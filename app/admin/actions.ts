"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getAdminUser, requireAdmin } from "@/lib/admin/auth";
import { ADMIN_SECURITY_INBOX } from "@/lib/admin/constants";
import {
  attemptAdminLogin,
  clearAdminSessionId,
  getAdminSessionId,
  newAdminSessionId,
  releaseAdminSession,
  setAdminSessionId,
} from "@/lib/admin/session";
import { sendAccountVerifiedEmail } from "@/lib/email/send";
import { env } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  changePasswordSchema,
  destinationAdminSchema,
  enquiryStatusUpdateSchema,
  lines,
  packageAdminSchema,
  startChangePasswordSchema,
} from "@/lib/validation/admin";
import { revalidateDestinations } from "@/lib/data/destinations";
import { revalidatePackages } from "@/lib/data/packages";
import { checkAndRecordRateLimit } from "@/lib/data/rate-limit";
import { getRequestIpHash, scopedRateKey } from "@/lib/security/request";
import { toRetryMinutes } from "@/lib/security/retry-after";
import { resetPasswordSchema } from "@/lib/validation/account";
import {
  createAndSendResetCode,
  verifyAndReset,
} from "@/lib/auth/password-reset";
import type { AdminPasswordStepState } from "./settings/password-change-state";

/** English rate-limit copy with an accurate wait time (admin UI is en-only). */
function rateLimitMessage(retryAfterSeconds?: number) {
  const minutes = toRetryMinutes(retryAfterSeconds);
  return `You've been rate limited. Please wait about ${minutes} minute(s) before trying again.`;
}

function adminCodeSentMessage() {
  return `We sent a 6-digit code to ${ADMIN_SECURITY_INBOX}. It expires in 15 minutes.`;
}

function adminResetFailureMessage(reason: "invalid" | "expired" | "too_many" | "server") {
  const messages: Record<typeof reason, string> = {
    invalid: "That code is invalid. Please check and try again.",
    expired: "That code has expired. Please request a new one.",
    too_many: "Too many attempts. Please request a new code.",
    server: "Something went wrong. Please try again.",
  };

  return messages[reason];
}

async function sendAdminPasswordCode(email: string) {
  const resetUrl = `${env.siteUrl}/admin/reset-password`;
  await createAndSendResetCode({ email, audience: "admin", resetUrl });
}

/**
 * The single admin account email (the login identity). Forgot/reset never ask
 * for an email — there is only one admin — so they operate on this address. The
 * verification code is always *delivered* to ADMIN_SECURITY_INBOX
 * (reservations@beyondborders.lk) regardless of this value; that recipient
 * override lives in lib/auth/password-reset.ts for the "admin" audience.
 */
function adminAccountEmail() {
  return env.adminAllowedEmails[0] ?? ADMIN_SECURITY_INBOX;
}

function formString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "");
}

const ALLOWED_MEDIA_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
];
// 4MB per image. Kept comfortably under the hosting request-body ceiling so an
// upload is rejected here with a friendly message rather than crashing the
// Server Action. The Next.js action body limit is raised to match in
// next.config.ts (its 1MB default silently broke every real photo upload).
const MAX_MEDIA_BYTES = 4 * 1024 * 1024;

async function uploadMedia(file: FormDataEntryValue | null, prefix: string) {
  if (!(file instanceof File) || file.size === 0) {
    return "";
  }

  if (!ALLOWED_MEDIA_TYPES.includes(file.type)) {
    throw new Error("Unsupported image type. Use JPEG, PNG, WEBP or AVIF.");
  }

  if (file.size > MAX_MEDIA_BYTES) {
    throw new Error("Image is too large. The maximum size is 4MB.");
  }

  const supabase = await createSupabaseServerClient();
  const extension = file.name.split(".").pop() || "bin";
  const path = `${prefix}/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from("media").upload(path, file, {
    cacheControl: "31536000",
    upsert: false,
  });

  if (error) {
    throw new Error(error.message);
  }

  const { data } = supabase.storage.from("media").getPublicUrl(path);

  return data.publicUrl;
}

export async function signInAction(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const email = formString(formData, "email");
  const password = formString(formData, "password");
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/admin/login?error=${encodeURIComponent(error.message)}`);
  }

  // Only staff may hold an admin session: a valid Supabase user that is not an
  // authorized admin is signed back out instead of landing on the dashboard.
  const user = await getAdminUser();

  if (!user) {
    await supabase.auth.signOut();
    redirect(
      `/admin/login?error=${encodeURIComponent(
        "This account is not authorized for admin access.",
      )}`,
    );
  }

  // Give this browser a fresh session id, then try to take the single admin
  // seat. If another admin is already active, this returns a pending request
  // and we send them to a waiting screen until that admin allows or denies them.
  const sid = newAdminSessionId();
  await setAdminSessionId(sid);
  const attempt = await attemptAdminLogin(user.id, sid, user.email ?? email);

  if (attempt.active) {
    redirect("/admin");
  }

  redirect(`/admin/login/waiting?req=${encodeURIComponent(attempt.requestId)}`);
}

export async function signOutAction() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const sid = await getAdminSessionId();
  if (user && sid) {
    await releaseAdminSession(user.id, sid);
  }
  await clearAdminSessionId();
  // scope: "local" — both admins share one Supabase account, so a global sign
  // out would revoke the OTHER active/waiting session too. Only clear this one.
  await supabase.auth.signOut({ scope: "local" });
  redirect("/admin/login");
}

/**
 * Sign out a session that was superseded (another admin was allowed in) or that
 * voluntarily handed over the seat. Returns instead of redirecting so the caller
 * (AdminPresence) can do a hard navigation to the login page — that guarantees
 * the "?kicked=1" notice renders with fresh search params. releaseAdminSession
 * only clears the seat if this session still holds it, so it never disturbs the
 * new active admin.
 */
export async function adminKickedSignOutAction() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const sid = await getAdminSessionId();
  if (user && sid) {
    await releaseAdminSession(user.id, sid);
  }
  await clearAdminSessionId();
  // scope: "local" so handing over (or being kicked) only signs out THIS
  // browser — the admin who was allowed in shares the same account and must
  // keep their session.
  await supabase.auth.signOut({ scope: "local" });
}

export async function requestAdminResetAction(_formData: FormData) {
  // Only one admin email exists, so we never prompt for it — the code is sent
  // (delivered to reservations@beyondborders.lk) for the admin account email.
  const email = adminAccountEmail();

  const ipHash = await getRequestIpHash();
  const rate = await checkAndRecordRateLimit(
    "admin-password-reset-request",
    scopedRateKey(ipHash, email),
    { max: 5, windowMinutes: 30 },
  );
  if (!rate.allowed) {
    redirect(
      `/admin/forgot-password?error=${encodeURIComponent(rateLimitMessage(rate.retryAfterSeconds))}`,
    );
  }

  await sendAdminPasswordCode(email);

  redirect("/admin/reset-password?sent=1");
}

export async function resetAdminPasswordAction(formData: FormData) {
  // The reset only ever applies to the single admin account; any submitted
  // email is ignored.
  const email = adminAccountEmail();

  const back = (message: string): never =>
    redirect(`/admin/reset-password?error=${encodeURIComponent(message)}`);

  const parsed = resetPasswordSchema.safeParse({
    email,
    code: formString(formData, "code"),
    password: formString(formData, "password"),
    confirm: formString(formData, "confirm"),
  });
  if (!parsed.success) {
    return back(parsed.error.issues[0]?.message ?? "Please check the form.");
  }

  const ipHash = await getRequestIpHash();
  const rate = await checkAndRecordRateLimit(
    "admin-password-reset-verify",
    scopedRateKey(ipHash, email),
    { max: 10, windowMinutes: 15 },
  );
  if (!rate.allowed) {
    return back(rateLimitMessage(rate.retryAfterSeconds));
  }

  const result = await verifyAndReset({
    email: parsed.data.email,
    code: parsed.data.code,
    newPassword: parsed.data.password,
    audience: "admin",
  });

  if (!result.ok) {
    return back(adminResetFailureMessage(result.reason));
  }

  redirect("/admin/login?reset=1");
}

export async function saveDestinationAction(formData: FormData) {
  await requireAdmin();
  const parsed = destinationAdminSchema.parse({
    id: formString(formData, "id"),
    slug: formString(formData, "slug"),
    title: formString(formData, "title"),
    tagline: formString(formData, "tagline"),
    keyAttraction: formString(formData, "keyAttraction"),
    summary: formString(formData, "summary"),
    bestFor: formString(formData, "bestFor"),
    highlights: formString(formData, "highlights"),
    heroImage: formString(formData, "heroImage"),
    cardImage: formString(formData, "cardImage"),
    status: formString(formData, "status"),
    sortOrder: formString(formData, "sortOrder"),
  });
  const uploadedCard = await uploadMedia(formData.get("cardImageFile"), "destinations");
  const uploadedHero = await uploadMedia(formData.get("heroImageFile"), "destinations");
  const supabase = await createSupabaseServerClient();
  const payload = {
    slug: parsed.slug,
    title: parsed.title,
    tagline: parsed.tagline,
    key_attraction: parsed.keyAttraction,
    summary: parsed.summary,
    best_for: parsed.bestFor,
    highlights: lines(parsed.highlights),
    hero_image: uploadedHero || parsed.heroImage || uploadedCard || parsed.cardImage,
    card_image: uploadedCard || parsed.cardImage || uploadedHero || parsed.heroImage,
    status: parsed.status,
    sort_order: parsed.sortOrder,
  };
  const query = parsed.id
    ? supabase.from("destinations").update(payload).eq("id", parsed.id)
    : supabase.from("destinations").insert(payload);
  const { error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  revalidateDestinations();
  revalidatePath("/admin/destinations");
  revalidatePath("/");
  revalidatePath("/destinations");
  revalidatePath("/[slug]", "page");
  redirect("/admin/destinations");
}

export async function savePackageAction(formData: FormData) {
  await requireAdmin();
  const parsed = packageAdminSchema.parse({
    id: formString(formData, "id"),
    slug: formString(formData, "slug"),
    title: formString(formData, "title"),
    tier: formString(formData, "tier"),
    hotels: formString(formData, "hotels"),
    destinations: formString(formData, "destinations"),
    duration: formString(formData, "duration"),
    image: formString(formData, "image"),
    summary: formString(formData, "summary"),
    inclusions: formString(formData, "inclusions"),
    itinerary: formString(formData, "itinerary"),
    priceAmount: formString(formData, "priceAmount"),
    depositAmount: formString(formData, "depositAmount"),
    currency: formString(formData, "currency") || env.mpgsCurrency,
    status: formString(formData, "status"),
    sortOrder: formString(formData, "sortOrder"),
  });
  const uploadedImage = await uploadMedia(formData.get("imageFile"), "packages");
  const supabase = await createSupabaseServerClient();
  const payload = {
    slug: parsed.slug,
    title: parsed.title,
    tier: parsed.tier,
    hotels: parsed.hotels,
    destinations_summary: parsed.destinations,
    duration: parsed.duration,
    image: uploadedImage || parsed.image,
    summary: parsed.summary,
    inclusions: lines(parsed.inclusions),
    price_amount: parsed.priceAmount === "" ? null : parsed.priceAmount,
    deposit_amount: parsed.depositAmount === "" ? null : parsed.depositAmount,
    currency: parsed.currency,
    status: parsed.status,
    sort_order: parsed.sortOrder,
  };
  const packageResult = parsed.id
    ? await supabase.from("tour_packages").update(payload).eq("id", parsed.id).select("id").single()
    : await supabase.from("tour_packages").insert(payload).select("id").single();

  if (packageResult.error) {
    throw new Error(packageResult.error.message);
  }

  const packageId = packageResult.data.id;
  await supabase.from("itinerary_items").delete().eq("tour_package_id", packageId);
  const itinerary = lines(parsed.itinerary).map((line, index) => {
    const [day, title, ...descriptionParts] = line.split("|").map((part) => part.trim());

    return {
      tour_package_id: packageId,
      day_label: day || `Day ${index + 1}`,
      title: title || "Itinerary item",
      description: descriptionParts.join(" | ") || title || "Details to confirm.",
      sort_order: index,
    };
  });

  if (itinerary.length > 0) {
    const { error } = await supabase.from("itinerary_items").insert(itinerary);

    if (error) {
      throw new Error(error.message);
    }
  }

  revalidatePackages();
  revalidatePath("/admin/packages");
  revalidatePath("/");
  revalidatePath("/tours");
  revalidatePath("/booking/[slug]", "page");
  redirect("/admin/packages");
}

export async function deletePackageAction(formData: FormData) {
  await requireAdmin();
  const id = formString(formData, "id");
  if (!id) {
    redirect("/admin/packages");
  }

  const supabase = await createSupabaseServerClient();

  // Bookings reference tour_packages with NO cascade — refuse to delete a
  // package that still has bookings (we never want to lose booking history).
  // The admin can set it to Draft to hide it instead. itinerary_items DO cascade.
  const { count } = await supabase
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .eq("tour_package_id", id);

  if ((count ?? 0) > 0) {
    redirect(
      `/admin/packages/${id}?error=${encodeURIComponent(
        `This package has ${count} booking(s) and can't be deleted. Set its status to Draft to hide it instead.`,
      )}`,
    );
  }

  const { error } = await supabase.from("tour_packages").delete().eq("id", id);
  if (error) {
    redirect(`/admin/packages/${id}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePackages();
  revalidatePath("/admin/packages");
  revalidatePath("/");
  revalidatePath("/tours");
  revalidatePath("/booking/[slug]", "page");
  redirect("/admin/packages");
}

export async function deleteDestinationAction(formData: FormData) {
  await requireAdmin();
  const id = formString(formData, "id");
  if (!id) {
    redirect("/admin/destinations");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("destinations").delete().eq("id", id);
  if (error) {
    redirect(
      `/admin/destinations/${id}?error=${encodeURIComponent(error.message)}`,
    );
  }

  revalidateDestinations();
  revalidatePath("/admin/destinations");
  revalidatePath("/");
  revalidatePath("/destinations");
  revalidatePath("/[slug]", "page");
  redirect("/admin/destinations");
}

/**
 * Update an enquiry's status. Returns a result object (instead of throwing) so
 * the client status form can show a success/error toast and refresh the page.
 */
export async function updateEnquiryStatusAction(
  formData: FormData,
): Promise<{ ok: boolean; note: string }> {
  await requireAdmin();
  const parsed = enquiryStatusUpdateSchema.parse({
    id: formString(formData, "id"),
    status: formString(formData, "status"),
  });
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("enquiries")
    .update({ status: parsed.status })
    .eq("id", parsed.id);

  if (error) {
    return { ok: false, note: error.message };
  }

  revalidatePath("/admin/enquiries");
  revalidatePath(`/admin/enquiries/${parsed.id}`);

  return { ok: true, note: `Status updated to “${parsed.status}”.` };
}

export async function updateCustomInquiryStatusAction(
  formData: FormData,
): Promise<{ ok: boolean; note: string }> {
  await requireAdmin();
  // Custom inquiries share the enquiry status enum (new/contacted/closed), so
  // the enquiry status schema validates this one too.
  const parsed = enquiryStatusUpdateSchema.parse({
    id: formString(formData, "id"),
    status: formString(formData, "status"),
  });
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("custom_inquiries")
    .update({ status: parsed.status })
    .eq("id", parsed.id);

  if (error) {
    return { ok: false, note: error.message };
  }

  revalidatePath("/admin/custom-inquiries");
  revalidatePath(`/admin/custom-inquiries/${parsed.id}`);

  return { ok: true, note: `Status updated to “${parsed.status}”.` };
}

// Booking status is no longer editable by hand — it is derived purely from
// payment (see lib/payments/reconcile.ts, which sets booking.status = 'paid' on
// a confirmed capture). The manual updateBookingStatusAction was removed.

export async function verifyCustomerAction(formData: FormData) {
  await requireAdmin();
  const customerId = formString(formData, "customerId");

  if (!customerId) {
    throw new Error("Missing customer id.");
  }

  const supabase = await createSupabaseServerClient();
  const { data: customer, error } = await supabase
    .from("customers")
    .update({ verified: true, verified_at: new Date().toISOString() })
    .eq("id", customerId)
    .select("full_name, email")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (customer) {
    await sendAccountVerifiedEmail({
      fullName: customer.full_name,
      email: customer.email,
    });
  }

  revalidatePath("/admin/users");
}

/** Enable or disable a customer's login (separate from purchase verification). */
export async function setCustomerActiveAction(formData: FormData) {
  await requireAdmin();
  const customerId = formString(formData, "customerId");
  const active = formString(formData, "active") === "true";

  if (!customerId) {
    throw new Error("Missing customer id.");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("customers")
    .update({ active })
    .eq("id", customerId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/users");
}

/**
 * Step 1: verify the current password + new-password pair, then email a code
 * to the reservations inbox. Returns state so the admin wizard can advance
 * inline, matching the customer password-change flow.
 */
export async function startAdminPasswordChangeAction(
  _prev: AdminPasswordStepState,
  formData: FormData,
): Promise<AdminPasswordStepState> {
  const user = await requireAdmin();
  const email = user.email;
  if (!email) {
    return { ok: false, note: "Your account has no email on file." };
  }

  const parsed = startChangePasswordSchema.safeParse({
    oldPassword: formString(formData, "oldPassword"),
    password: formString(formData, "password"),
    confirm: formString(formData, "confirm"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      note: parsed.error.issues[0]?.message ?? "Please check the form.",
    };
  }

  const supabase = await createSupabaseServerClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password: parsed.data.oldPassword,
  });
  if (signInError) {
    return { ok: false, note: "Your current password is incorrect." };
  }

  const ipHash = await getRequestIpHash();
  const rate = await checkAndRecordRateLimit(
    "admin-password-change-otp",
    scopedRateKey(ipHash, email),
    { max: 5, windowMinutes: 30 },
  );
  if (!rate.allowed) {
    return {
      ok: false,
      note: rateLimitMessage(rate.retryAfterSeconds),
    };
  }

  await sendAdminPasswordCode(email);

  return { ok: true, note: adminCodeSentMessage() };
}

/** Step 2 "resend": email a fresh admin code to the reservations inbox. */
export async function resendAdminPasswordOtpAction(
  _prev: AdminPasswordStepState,
  _formData: FormData,
): Promise<AdminPasswordStepState> {
  const user = await requireAdmin();
  const email = user.email;
  if (!email) {
    return { ok: false, note: "Your account has no email on file." };
  }

  const ipHash = await getRequestIpHash();
  const rate = await checkAndRecordRateLimit(
    "admin-password-change-otp",
    scopedRateKey(ipHash, email),
    { max: 5, windowMinutes: 30 },
  );
  if (!rate.allowed) {
    return {
      ok: false,
      note: rateLimitMessage(rate.retryAfterSeconds),
    };
  }

  await sendAdminPasswordCode(email);

  return { ok: true, note: adminCodeSentMessage() };
}

/**
 * Change the logged-in admin's password. Requires the current password AND a
 * one-time code emailed to the reservations inbox, then refreshes the session
 * so they stay signed in with the new credentials.
 */
export async function changeAdminPasswordAction(
  _prev: AdminPasswordStepState,
  formData: FormData,
): Promise<AdminPasswordStepState> {
  const user = await requireAdmin();
  const email = user.email;

  if (!email) {
    return { ok: false, note: "Your account has no email on file." };
  }

  const parsed = changePasswordSchema.safeParse({
    oldPassword: formString(formData, "oldPassword"),
    password: formString(formData, "password"),
    confirm: formString(formData, "confirm"),
    code: formString(formData, "code"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      note: parsed.error.issues[0]?.message ?? "Please check the form.",
    };
  }

  const ipHash = await getRequestIpHash();
  const rate = await checkAndRecordRateLimit(
    "admin-password-change",
    scopedRateKey(ipHash, email),
    { max: 10, windowMinutes: 15 },
  );
  if (!rate.allowed) {
    return { ok: false, note: rateLimitMessage(rate.retryAfterSeconds) };
  }

  // 1) Confirm the current password by re-authenticating.
  const supabase = await createSupabaseServerClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password: parsed.data.oldPassword,
  });
  if (signInError) {
    return { ok: false, note: "Your current password is incorrect." };
  }

  // 2) Verify the emailed code and apply the new password.
  const result = await verifyAndReset({
    email,
    code: parsed.data.code,
    newPassword: parsed.data.password,
    audience: "admin",
  });
  if (!result.ok) {
    return { ok: false, note: adminResetFailureMessage(result.reason) };
  }

  // 3) Refresh the session with the new password so the admin stays signed in.
  await supabase.auth.signInWithPassword({
    email,
    password: parsed.data.password,
  });

  return { ok: true, note: "Your password has been updated." };
}
