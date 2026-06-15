"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getAdminUser, requireAdmin } from "@/lib/admin/auth";
import { sendPayLinkEmail } from "@/lib/email/send";
import { env } from "@/lib/env";
import { createMpgsOrderId, createPayToken, createPayTokenExpiry } from "@/lib/payments/tokens";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  destinationAdminSchema,
  lines,
  packageAdminSchema,
  quoteSchema,
  settingsSchema,
  statusUpdateSchema,
} from "@/lib/validation/admin";
import { revalidateDestinations } from "@/lib/data/destinations";
import { revalidatePackages } from "@/lib/data/packages";

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
  const parsed = statusUpdateSchema.parse({
    id: formString(formData, "id"),
    status: formString(formData, "status"),
  });
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("enquiries")
    .update({ status: parsed.status as "new" | "contacted" | "closed" })
    .eq("id", parsed.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/enquiries");
}

export async function updateBookingStatusAction(formData: FormData) {
  await requireAdmin();
  const parsed = statusUpdateSchema.parse({
    id: formString(formData, "id"),
    status: formString(formData, "status"),
  });
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("bookings")
    .update({
      status: parsed.status as
        | "new"
        | "confirmed"
        | "awaiting_payment"
        | "paid"
        | "cancelled",
    })
    .eq("id", parsed.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/bookings");
}

export async function generatePayLinkAction(formData: FormData) {
  await requireAdmin();
  const parsed = quoteSchema.parse({
    bookingId: formString(formData, "bookingId"),
    amount: formString(formData, "amount"),
    currency: formString(formData, "currency") || env.mpgsCurrency,
  });
  const supabase = await createSupabaseServerClient();
  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .select("*, tour_packages(title)")
    .eq("id", parsed.bookingId)
    .single();

  if (bookingError) {
    throw new Error(bookingError.message);
  }

  // Keep one active pay link per booking: expire any previously issued links
  // that have not been captured so regenerating cannot leave multiple live
  // tokens valid at once.
  const { error: invalidateError } = await supabase
    .from("payments")
    .update({ pay_token_expires_at: new Date().toISOString() })
    .eq("booking_id", booking.id)
    .in("status", ["initiated", "pending"]);

  if (invalidateError) {
    throw new Error(invalidateError.message);
  }

  const token = createPayToken();
  const { error: paymentError } = await supabase.from("payments").insert({
    booking_id: booking.id,
    mpgs_order_id: createMpgsOrderId(booking.reference),
    amount: parsed.amount,
    currency: parsed.currency,
    status: "initiated",
    pay_token: token,
    pay_token_expires_at: createPayTokenExpiry(),
  });

  if (paymentError) {
    throw new Error(paymentError.message);
  }

  const { error: updateError } = await supabase
    .from("bookings")
    .update({
      quoted_amount: parsed.amount,
      currency: parsed.currency,
      status: "awaiting_payment",
    })
    .eq("id", booking.id);

  if (updateError) {
    throw new Error(updateError.message);
  }

  await sendPayLinkEmail({
    travellerName: booking.traveller_name,
    email: booking.email,
    reference: booking.reference,
    amount: parsed.amount,
    currency: parsed.currency,
    token,
  });

  revalidatePath(`/admin/bookings/${booking.id}`);
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
}
