"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getAdminUser, requireAdmin } from "@/lib/admin/auth";
import { sendAccountVerifiedEmail } from "@/lib/email/send";
import { env } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  bookingStatusUpdateSchema,
  destinationAdminSchema,
  enquiryStatusUpdateSchema,
  lines,
  packageAdminSchema,
  settingsSchema,
} from "@/lib/validation/admin";
import { revalidateDestinations } from "@/lib/data/destinations";
import { revalidatePackages } from "@/lib/data/packages";
import { checkAndRecordRateLimit } from "@/lib/data/rate-limit";
import { getRequestIpHash } from "@/lib/security/request";
import {
  requestResetSchema,
  resetPasswordSchema,
} from "@/lib/validation/account";
import {
  createAndSendResetCode,
  verifyAndReset,
} from "@/lib/auth/password-reset";

function formString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "");
}

const ALLOWED_MEDIA_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
];
const MAX_MEDIA_BYTES = 5 * 1024 * 1024;

async function uploadMedia(file: FormDataEntryValue | null, prefix: string) {
  if (!(file instanceof File) || file.size === 0) {
    return "";
  }

  if (!ALLOWED_MEDIA_TYPES.includes(file.type)) {
    throw new Error("Unsupported image type. Use JPEG, PNG, WEBP or AVIF.");
  }

  if (file.size > MAX_MEDIA_BYTES) {
    throw new Error("Image is too large. The maximum size is 5MB.");
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

  redirect("/admin");
}

export async function signOutAction() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

export async function requestAdminResetAction(formData: FormData) {
  const parsed = requestResetSchema.safeParse({
    email: formString(formData, "email"),
  });
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Please check the form.";
    redirect(`/admin/forgot-password?error=${encodeURIComponent(message)}`);
  }

  const ipHash = await getRequestIpHash();
  const rate = await checkAndRecordRateLimit(
    "admin-password-reset-request",
    ipHash,
    { max: 5, windowMinutes: 30 },
  );
  if (!rate.allowed) {
    redirect(
      `/admin/forgot-password?error=${encodeURIComponent("Please wait a moment before trying again.")}`,
    );
  }

  const email = parsed.data.email;
  const resetUrl = `${env.siteUrl}/admin/reset-password?email=${encodeURIComponent(email)}`;
  await createAndSendResetCode({ email, audience: "admin", resetUrl });

  redirect(`/admin/reset-password?email=${encodeURIComponent(email)}&sent=1`);
}

export async function resetAdminPasswordAction(formData: FormData) {
  const email = formString(formData, "email");

  const back = (message: string): never =>
    redirect(
      `/admin/reset-password?email=${encodeURIComponent(email)}&error=${encodeURIComponent(message)}`,
    );

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
    ipHash,
    { max: 10, windowMinutes: 15 },
  );
  if (!rate.allowed) {
    return back("Please wait a moment before trying again.");
  }

  const result = await verifyAndReset({
    email: parsed.data.email,
    code: parsed.data.code,
    newPassword: parsed.data.password,
    audience: "admin",
  });

  if (!result.ok) {
    const messages: Record<typeof result.reason, string> = {
      invalid: "That code is invalid. Please check and try again.",
      expired: "That code has expired. Please request a new one.",
      too_many: "Too many attempts. Please request a new code.",
      server: "Something went wrong. Please try again.",
    };
    return back(messages[result.reason]);
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

export async function updateEnquiryStatusAction(formData: FormData) {
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
    throw new Error(error.message);
  }

  revalidatePath("/admin/enquiries");
}

export async function updateBookingStatusAction(formData: FormData) {
  await requireAdmin();
  const parsed = bookingStatusUpdateSchema.parse({
    id: formString(formData, "id"),
    status: formString(formData, "status"),
  });
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("bookings")
    .update({ status: parsed.status })
    .eq("id", parsed.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/bookings");
}

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

export async function saveSettingsAction(formData: FormData) {
  await requireAdmin();
  const parsed = settingsSchema.parse({
    contactEmail: formString(formData, "contactEmail"),
    phone: formString(formData, "phone"),
    address: formString(formData, "address"),
    heroCopy: formString(formData, "heroCopy"),
  });
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("site_settings").upsert({
    key: "site",
    value: parsed,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/settings");
  redirect("/admin/settings?saved=1");
}
