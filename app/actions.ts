"use server";

import { createBooking, countRecentBookingsByIp } from "@/lib/data/bookings";
import { createEnquiry, countRecentEnquiriesByIp } from "@/lib/data/enquiries";
import { canUseSupabaseService } from "@/lib/supabase/service";
import { sendBookingEmails, sendEnquiryEmails } from "@/lib/email/send";
import { generateBookingReference, getRequestIpHash } from "@/lib/security/request";
import { bookingSchema } from "@/lib/validation/booking";
import { enquirySchema } from "@/lib/validation/enquiry";

export type EnquiryState = {
  note: string;
  ok: boolean;
};

export type BookingState = {
  note: string;
  ok: boolean;
  reference?: string;
};

export const initialEnquiryState: EnquiryState = {
  note: "Share your dates and travel notes. Our planners will reply by email.",
  ok: false,
};

export const initialBookingState: BookingState = {
  note: "Submit this request and our planners will confirm availability, amount and secure payment instructions.",
  ok: false,
};

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
  const parsed = bookingSchema.safeParse({
    tourPackageId: formString(formData, "tourPackageId"),
    packageTitle: formString(formData, "packageTitle"),
    travellerName: formString(formData, "name"),
    email: formString(formData, "email"),
    phone: formString(formData, "phone"),
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

  try {
    const ipHash = await getRequestIpHash();
    const recent = await countRecentBookingsByIp(ipHash);

    if (recent >= 3) {
      return {
        ok: false,
        note: "Too many recent booking requests from this connection. Please try again later.",
      };
    }

    const reference = generateBookingReference();
    await createBooking({
      reference,
      tour_package_id: parsed.data.tourPackageId,
      traveller_name: parsed.data.travellerName,
      email: parsed.data.email,
      phone: parsed.data.phone || null,
      travel_dates: parsed.data.travelDates,
      travellers: parsed.data.travellers,
      notes: parsed.data.notes || null,
      status: "new",
      currency: "LKR",
      ip_hash: ipHash,
    });

    await sendBookingEmails({
      reference,
      travellerName: parsed.data.travellerName,
      email: parsed.data.email,
      phone: parsed.data.phone || null,
      packageTitle: parsed.data.packageTitle,
      travelDates: parsed.data.travelDates,
      travellers: parsed.data.travellers,
      notes: parsed.data.notes || null,
    });

    return {
      ok: true,
      reference,
      note: `Booking request ${reference} received. A planner will confirm your total and secure payment link.`,
    };
  } catch (error) {
    console.error(error);

    return {
      ok: false,
      note: "We could not submit the booking request. Please try again or contact the team directly.",
    };
  }
}
