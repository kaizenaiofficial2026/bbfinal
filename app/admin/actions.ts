"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  ADMIN_TIER_KEY,
  type AdminTier,
  canToggleAdminActive,
  getAdminUser,
  listAdmins,
  requireAdmin,
  requireSuperAdmin,
} from "@/lib/admin/auth";
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
  canUseSupabaseService,
  createSupabaseServiceClient,
} from "@/lib/supabase/service";
import {
  changePasswordSchema,
  createAdminSchema,
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
import {
  resetPasswordSchema,
  setPasswordSchema,
} from "@/lib/validation/account";
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
// 8MB per image. Kept comfortably under the Server Action body ceiling
// (bodySizeLimit in next.config.ts) so two images plus form fields fit in one
// request. This is the server-side backstop; the admin forms also enforce it in
// the browser and block the submit with a friendly message before any upload.
const MAX_MEDIA_BYTES = 8 * 1024 * 1024;

async function uploadMedia(file: FormDataEntryValue | null, prefix: string) {
  if (!(file instanceof File) || file.size === 0) {
    return "";
  }

  if (!ALLOWED_MEDIA_TYPES.includes(file.type)) {
    throw new Error("Unsupported image type. Use JPEG, PNG, WEBP or AVIF.");
  }

  if (file.size > MAX_MEDIA_BYTES) {
    throw new Error("Image is too large. The maximum size is 8MB.");
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

const UPLOAD_PREFIXES = ["destinations", "packages"] as const;
type UploadPrefix = (typeof UPLOAD_PREFIXES)[number];

export type MediaUploadTicket =
  | { ok: true; path: string; token: string; publicUrl: string }
  | { ok: false; note: string };

/**
 * Mint a short-lived signed URL for the browser to upload an image DIRECTLY to
 * Supabase Storage, bypassing the Server Action request body entirely. Image
 * bytes never transit the Next/Vercel function, so the platform's ~4.5MB request
 * body cap (which broke uploading two images at once) no longer applies. Only the
 * resulting public URL is submitted with the form. Admin-gated; validates type
 * and size the same way uploadMedia does, and pins the storage path so the token
 * can't be used to write anywhere else.
 */
export async function createMediaUploadUrlAction(input: {
  prefix: string;
  filename: string;
  contentType: string;
  size: number;
}): Promise<MediaUploadTicket> {
  await requireSuperAdmin();

  if (!UPLOAD_PREFIXES.includes(input.prefix as UploadPrefix)) {
    return { ok: false, note: "Invalid upload target." };
  }
  if (!ALLOWED_MEDIA_TYPES.includes(input.contentType)) {
    return {
      ok: false,
      note: "Unsupported image type. Use JPEG, PNG, WEBP or AVIF.",
    };
  }
  if (!Number.isFinite(input.size) || input.size <= 0) {
    return { ok: false, note: "That file looks empty." };
  }
  if (input.size > MAX_MEDIA_BYTES) {
    return { ok: false, note: "Image is too large. The maximum size is 8MB." };
  }

  const extension = (input.filename.split(".").pop() || "bin")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 5);
  const path = `${input.prefix}/${crypto.randomUUID()}.${extension || "bin"}`;

  const service = createSupabaseServiceClient();
  const { data, error } = await service.storage
    .from("media")
    .createSignedUploadUrl(path);
  if (error || !data) {
    return { ok: false, note: "Could not start the upload. Please try again." };
  }

  const { data: pub } = service.storage.from("media").getPublicUrl(data.path);
  return { ok: true, path: data.path, token: data.token, publicUrl: pub.publicUrl };
}

export async function signInAction(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const email = formString(formData, "email");
  const password = formString(formData, "password");

  // Throttle admin sign-in like the customer login. One shared admin password
  // guards all customer PII, so brute force here is the highest-value target;
  // only Supabase's default endpoint limits stood in the way before. Scope by
  // (IP, email) so a shared office/CGNAT IP doesn't lock out the whole team.
  const ipHash = await getRequestIpHash();
  const rate = await checkAndRecordRateLimit(
    "admin-login",
    scopedRateKey(ipHash, email),
    { max: 8, windowMinutes: 15 },
  );
  if (!rate.allowed) {
    redirect(
      `/admin/login?error=${encodeURIComponent(
        rateLimitMessage(rate.retryAfterSeconds),
      )}`,
    );
  }

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
  await requireSuperAdmin();
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
  await requireSuperAdmin();
  const parsed = packageAdminSchema.parse({
    id: formString(formData, "id"),
    slug: formString(formData, "slug"),
    title: formString(formData, "title"),
    tier: formString(formData, "tier"),
    hotels: formString(formData, "hotels"),
    destinations: formString(formData, "destinations"),
    duration: formString(formData, "duration"),
    image: formString(formData, "image"),
    heroImage: formString(formData, "heroImage"),
    summary: formString(formData, "summary"),
    inclusions: formString(formData, "inclusions"),
    itinerary: formString(formData, "itinerary"),
    priceAmount: formString(formData, "priceAmount"),
    depositAmount: formString(formData, "depositAmount"),
    currency: formString(formData, "currency") || env.mpgsCurrency,
    status: formString(formData, "status"),
    sortOrder: formString(formData, "sortOrder"),
  });
  // `image` is the card thumbnail; `hero_image` is the booking-page banner. Each
  // can be set by upload or URL, and falls back to the other when only one is
  // provided (mirrors destinations) so a package never renders with no image.
  const uploadedCard = await uploadMedia(formData.get("imageFile"), "packages");
  const uploadedHero = await uploadMedia(formData.get("heroImageFile"), "packages");
  const supabase = await createSupabaseServerClient();
  const payload = {
    slug: parsed.slug,
    title: parsed.title,
    tier: parsed.tier,
    hotels: parsed.hotels,
    destinations_summary: parsed.destinations,
    duration: parsed.duration,
    image: uploadedCard || parsed.image || uploadedHero || parsed.heroImage,
    hero_image: uploadedHero || parsed.heroImage || uploadedCard || parsed.image,
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
  await requireSuperAdmin();
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
  await requireSuperAdmin();
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
  await requireSuperAdmin();
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
  await requireSuperAdmin();
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
    // The customer is ALREADY verified at this point. If the mail server hiccups,
    // an uncaught throw would drop the admin on the error page even though the
    // change succeeded — so they'd retry and re-send the email. Log it instead;
    // the verification stands and the mail can be re-sent by hand.
    try {
      await sendAccountVerifiedEmail({
        fullName: customer.full_name,
        email: customer.email,
      });
    } catch (mailError) {
      console.error("[verify customer] CUSTOMER VERIFIED, EMAIL NOT SENT", {
        customerId,
        email: customer.email,
        error: mailError,
      });
    }
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
 * Activate or deactivate a SECOND-LEVEL admin (SUPER admin only). A deactivated
 * admin is denied by getAdminUser() — blocked at login and kicked from any live
 * session. A super admin can never toggle themselves or another super admin, so
 * the panel can't lock all super admins out (canToggleAdminActive enforces this).
 */
export async function setAdminActiveAction(formData: FormData) {
  const actor = await requireSuperAdmin();
  const adminId = formString(formData, "adminId");
  const active = formString(formData, "active") === "true";

  if (!adminId) {
    throw new Error("Missing admin id.");
  }

  const target = (await listAdmins()).find((a) => a.id === adminId);
  if (!target) {
    throw new Error("Admin not found.");
  }
  if (!canToggleAdminActive({ actingUserId: actor.id, target })) {
    throw new Error(
      "Only a second-level admin can be activated or deactivated.",
    );
  }

  const service = createSupabaseServiceClient();
  const { error } = await service
    .from("profiles")
    .update({ active })
    .eq("id", adminId);

  if (error) {
    throw new Error(error.message);
  }

  if (!active) {
    // Revoke the tokens they already hold. `is_admin()` now refuses a
    // deactivated profile, so RLS stops them at the database — but their issued
    // JWT stays valid until it expires and the refresh token would keep minting
    // new ones. A global sign-out ends the session immediately. Best-effort: the
    // deactivation itself has already taken effect, so a failure here must not
    // roll it back or surface an error to the super admin.
    try {
      await service.auth.admin.signOut(adminId, "global");
    } catch (signOutError) {
      console.error("[deactivate admin] could not revoke sessions", {
        adminId,
        error: signOutError,
      });
    }
  }

  revalidatePath("/admin/admins");
}

/**
 * Create a new SECOND-LEVEL admin account (SUPER admin only).
 *
 * The new account is always second-level — the panel deliberately offers no way
 * to mint another super admin, so the super tier stays controlled by
 * SUPER_ADMIN_EMAILS. The tier is stamped on `app_metadata` (service-role writable
 * only) rather than left to the env fallback, which treats every admin as super
 * when SUPER_ADMIN_EMAILS is empty.
 *
 * No env change is needed for the new admin to sign in: ADMIN_ALLOWED_EMAILS is
 * only the bootstrap path for staff WITHOUT a profile row, and this creates one.
 */
export async function createAdminAction(
  formData: FormData,
): Promise<{ ok: boolean; note: string }> {
  await requireSuperAdmin();

  const parsed = createAdminSchema.safeParse({
    fullName: formString(formData, "fullName"),
    email: formString(formData, "email"),
    password: formString(formData, "password"),
    confirm: formString(formData, "confirm"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      note: parsed.error.issues[0]?.message ?? "Please check the form.",
    };
  }

  if (!canUseSupabaseService()) {
    return {
      ok: false,
      note: "Admin creation is unavailable (service role not configured).",
    };
  }

  const { fullName, password } = parsed.data;
  const email = parsed.data.email.trim().toLowerCase();
  const service = createSupabaseServiceClient();

  const { data: created, error } = await service.auth.admin.createUser({
    email,
    password,
    // Staff accounts are created by a trusted super admin, so the address is
    // treated as confirmed — there is no signup email to click through.
    email_confirm: true,
    user_metadata: { full_name: fullName },
    app_metadata: { [ADMIN_TIER_KEY]: "second" satisfies AdminTier },
  });

  if (error || !created.user) {
    // Supabase reports a duplicate address as a 422; surface it as plain English
    // rather than the raw gateway wording.
    const duplicate = /already|exists|registered/i.test(error?.message ?? "");
    return {
      ok: false,
      note: duplicate
        ? "An account with that email already exists."
        : (error?.message ?? "Could not create the admin account."),
    };
  }

  // The profile row is what actually grants admin access (getAdminUser) and what
  // RLS's is_admin() trusts. Roll the auth user back if it can't be written, so a
  // half-created account can never linger.
  const { error: profileError } = await service.from("profiles").upsert(
    { id: created.user.id, role: "admin", full_name: fullName, active: true },
    { onConflict: "id" },
  );

  if (profileError) {
    await service.auth.admin.deleteUser(created.user.id);
    return { ok: false, note: profileError.message };
  }

  revalidatePath("/admin/admins");
  return { ok: true, note: `${fullName} can now sign in as a second-level admin.` };
}

/**
 * Set (reset) a SECOND-LEVEL admin's password directly (SUPER admin only). Unlike
 * the self-service change flow, no old password/OTP is needed — the trusted super
 * admin sets it via the service admin API. Same guard as the active toggle: never
 * a super admin, never yourself. Returns {ok, note} so the UI can show feedback
 * instead of throwing on a typo (e.g. mismatched confirmation).
 */
export async function setAdminPasswordAction(
  formData: FormData,
): Promise<{ ok: boolean; note: string }> {
  const actor = await requireSuperAdmin();
  const adminId = formString(formData, "adminId");

  if (!adminId) {
    return { ok: false, note: "Missing admin id." };
  }

  const parsed = setPasswordSchema.safeParse({
    password: formString(formData, "password"),
    confirm: formString(formData, "confirm"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      note: parsed.error.issues[0]?.message ?? "Please check the password.",
    };
  }

  const target = (await listAdmins()).find((a) => a.id === adminId);
  if (!target) {
    return { ok: false, note: "Admin not found." };
  }
  if (!canToggleAdminActive({ actingUserId: actor.id, target })) {
    return {
      ok: false,
      note: "You can only set a second-level admin's password.",
    };
  }

  const service = createSupabaseServiceClient();
  const { error } = await service.auth.admin.updateUserById(adminId, {
    password: parsed.data.password,
  });
  if (error) {
    return { ok: false, note: error.message };
  }

  return { ok: true, note: "Password updated." };
}

/**
 * Permanently delete a customer account (SUPER admin only). Booking/payment
 * records are PRESERVED for the business — their `user_id` is detached first
 * (the FK has no ON DELETE action, so the auth-user delete would otherwise fail),
 * then the auth user is removed, cascading to the `customers` row, profile and
 * any password-reset codes.
 */
export async function deleteCustomerAction(formData: FormData) {
  await requireSuperAdmin();
  const customerId = formString(formData, "customerId");

  if (!customerId) {
    throw new Error("Missing customer id.");
  }

  const supabase = await createSupabaseServerClient();

  // ARCHIVE rather than erase: the row is kept (listed under the "Deleted"
  // filter, restorable) and the login is disabled, which getCustomerUser treats
  // as signed out. Bookings stay linked, so the customer's history survives.
  // `purgeCustomerAction` below is the irreversible path.
  const { error } = await supabase
    .from("customers")
    .update({ deleted_at: new Date().toISOString(), active: false })
    .eq("id", customerId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/users");
}

/** Undo a soft delete: the account is listed and can sign in again. */
export async function restoreCustomerAction(formData: FormData) {
  await requireSuperAdmin();
  const customerId = formString(formData, "customerId");

  if (!customerId) {
    throw new Error("Missing customer id.");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("customers")
    .update({ deleted_at: null, active: true })
    .eq("id", customerId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/users");
}

/**
 * Permanently remove an archived account — the old destructive behaviour, now
 * reachable only from the "Deleted" view so it can't happen by accident.
 * Booking/payment records are PRESERVED for the business: their `user_id` is
 * detached first (the FK has no ON DELETE action, so the auth-user delete would
 * otherwise fail), then the auth user is removed, cascading to the customers
 * row, profile and any password-reset codes.
 */
export async function purgeCustomerAction(formData: FormData) {
  await requireSuperAdmin();
  const customerId = formString(formData, "customerId");

  if (!customerId) {
    throw new Error("Missing customer id.");
  }
  if (!canUseSupabaseService()) {
    throw new Error(
      "Account deletion is unavailable (service role not configured).",
    );
  }

  const service = createSupabaseServiceClient();

  // Keep bookings as records but unlink them from the account being deleted.
  const { error: detachError } = await service
    .from("bookings")
    .update({ user_id: null })
    .eq("user_id", customerId);
  if (detachError) {
    throw new Error(detachError.message);
  }

  const { error } = await service.auth.admin.deleteUser(customerId);
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
