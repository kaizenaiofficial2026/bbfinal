"use server";

import { redirect } from "next/navigation";
import { createBooking } from "@/lib/data/bookings";
import { createEnquiry, countRecentEnquiriesByIp } from "@/lib/data/enquiries";
import { requireVerifiedCustomer } from "@/lib/customer/auth";
import {
  canUseSupabaseService,
  createSupabaseServiceClient,
} from "@/lib/supabase/service";
import { sendEnquiryEmails } from "@/lib/email/send";
import {
  createMpgsOrderId,
  createPayToken,
  createPayTokenExpiry,
} from "@/lib/payments/tokens";
import { generateBookingReference, getRequestIpHash } from "@/lib/security/request";
import { bookingSchema } from "@/lib/validation/booking";
import { enquirySchema } from "@/lib/validation/enquiry";
import type { BookingState, EnquiryState } from "@/app/action-state";

function formString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "");
}

function passedTimeTrap(startedAt?: number) {
  if (!startedAt) {
    return true;
  }

  return Date.now() - startedAt >= 2500;
}

export async function submitEnquiry(
  _prevState: EnquiryState,
  formData: FormData,
): Promise<EnquiryState> {
  const parsed = enquirySchema.safeParse({
    name: formString(formData, "name"),
    email: formString(formData, "email"),
    phone: formString(formData, "phone"),
    packageLabel: formString(formData, "package"),
    message: formString(formData, "message"),
    source: "contact-form",
    company: formString(formData, "company"),
    startedAt: formString(formData, "startedAt"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      note: parsed.error.issues[0]?.message ?? "Please check the form.",
    };
  }

  if (!passedTimeTrap(parsed.data.startedAt)) {
    return {
      ok: false,
      note: "Please wait a moment before submitting.",
    };
  }

  if (!canUseSupabaseService()) {
    return {
      ok: false,
      note: "Enquiries are not configured yet. Please add Supabase environment variables.",
    };
  }

  try {
    const ipHash = await getRequestIpHash();
    const recent = await countRecentEnquiriesByIp(ipHash);

    if (recent >= 5) {
      return {
        ok: false,
        note: "Too many recent enquiries from this connection. Please try again later.",
      };
    }

    await createEnquiry({
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone || null,
      package_label: parsed.data.packageLabel || null,
      message: parsed.data.message,
      source: parsed.data.source,
      ip_hash: ipHash,
    });

    await sendEnquiryEmails({
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone || null,
      packageLabel: parsed.data.packageLabel || null,
      message: parsed.data.message,
    });

    return {
      ok: true,
      note: `Thanks, ${parsed.data.name}. A Beyond Borders planner will reply by email.`,
    };
  } catch (error) {
    console.error(error);

    return {
      ok: false,
      note: "We could not submit the enquiry. Please try again or email the team directly.",
    };
  }
}

export async function submitBooking(
  _prevState: BookingState,
  formData: FormData,
): Promise<BookingState> {
  // Only signed-in, admin-verified customers can book (defense in depth — the
  // form is only rendered for them). Redirects otherwise.
  const session = await requireVerifiedCustomer();

  const parsed = bookingSchema.safeParse({
    tourPackageId: formString(formData, "tourPackageId"),
    travelDates: formString(formData, "dates"),
    travellers: formString(formData, "travellers"),
    notes: formString(formData, "notes"),
    company: formString(formData, "company"),
    startedAt: formString(formData, "startedAt"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      note: parsed.error.issues[0]?.message ?? "Please check the booking form.",
    };
  }

  if (!passedTimeTrap(parsed.data.startedAt)) {
    return {
      ok: false,
      note: "Please wait a moment before submitting.",
    };
  }

  if (!canUseSupabaseService()) {
    return {
      ok: false,
      note: "Bookings are not configured yet. Please add Supabase environment variables.",
    };
  }

  const service = createSupabaseServiceClient();

  // The payable amount is the package's flat price, read server-side — never
  // trust a client-supplied amount.
  const { data: pkg, error: pkgError } = await service
    .from("tour_packages")
    .select("id, title, price_amount, currency, status")
    .eq("id", parsed.data.tourPackageId)
    .maybeSingle();

  if (pkgError || !pkg || pkg.status !== "published") {
    return { ok: false, note: "This journey is not available for booking." };
  }

  if (pkg.price_amount == null) {
    return {
      ok: false,
      note: "This journey isn't available for instant checkout. Please contact our team.",
    };
  }

  const reference = generateBookingReference();
  const token = createPayToken();

  try {
    const booking = await createBooking({
      reference,
      tour_package_id: pkg.id,
      user_id: session.user.id,
      traveller_name: session.customer.full_name,
      email: session.customer.email,
      phone: session.customer.phone,
      travel_dates: parsed.data.travelDates,
      travellers: parsed.data.travellers,
      notes: parsed.data.notes || null,
      status: "awaiting_payment",
      quoted_amount: pkg.price_amount,
      currency: pkg.currency,
    });

    const { error: paymentError } = await service.from("payments").insert({
      booking_id: booking.id,
      mpgs_order_id: createMpgsOrderId(reference),
      amount: pkg.price_amount,
      currency: pkg.currency,
      status: "initiated",
      pay_token: token,
      pay_token_expires_at: createPayTokenExpiry(),
    });

    if (paymentError) {
      throw new Error(paymentError.message);
    }
  } catch (error) {
    console.error(error);

    return {
      ok: false,
      note: "We could not start your booking. Please try again or contact the team directly.",
    };
  }

  // Send the verified customer straight into the hosted MPGS checkout.
  redirect(`/pay/${token}`);
}
