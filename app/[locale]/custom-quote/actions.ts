"use server";

import { getTranslations } from "next-intl/server";
import {
  countRecentCustomInquiriesByIp,
  createCustomInquiry,
} from "@/lib/data/custom-inquiries";
import { sendCustomInquiryEmails } from "@/lib/email/send";
import { sendInquirySms } from "@/lib/sms/send";
import { generateInquiryReference, getRequestIpHash } from "@/lib/security/request";
import { canUseSupabaseService } from "@/lib/supabase/service";
import type { Json } from "@/lib/supabase/types";
import {
  customInquirySchema,
  type CustomInquiryInput,
} from "@/lib/validation/custom-inquiry";
import { checkEmailDeliverable } from "@/lib/validation/email-deliverability";
import type { InquiryState } from "./inquiry-state";

function fs(formData: FormData, key: string) {
  return String(formData.get(key) ?? "");
}

type Pair = [string, string | number];

function entries(pairs: Pair[]) {
  const details: Record<string, string | number> = {};
  const lines = pairs.map(([label, value]) => {
    details[label] = value;
    return { label, value: String(value) };
  });
  return { details, lines };
}

// Map each inquiry type to its labelled detail fields (for storage + email).
function buildDetails(data: CustomInquiryInput) {
  switch (data.inquiryType) {
    case "package":
      return entries([["Package", data.package]]);
    case "hotel":
      return entries([
        ["Hotel", data.hotel],
        ["Room Category", data.roomCategory],
        ["Room Type", data.roomType],
        ["Meal Plan", data.mealPlan],
        ["Number of Rooms", data.numberOfRooms],
        ["Arrival", data.arrival],
        ["Departure", data.departure],
        ["Adults", data.adults],
        ["Children", data.children],
        ["Extra Bed", data.extraBed],
      ]);
    case "airticket":
      return entries([
        ["Airline", data.airline],
        ["Route", data.route],
        ["Trip", data.wayType],
        ["Departure date", data.arrival],
        ["Return date", data.departure || "—"],
        ["Class", data.flightClass],
        ["Passengers", data.pax],
        ["Extra Baggage", data.extraBaggage],
      ]);
    case "transport":
      return entries([
        ["Car Type", data.carType],
        ["Hire Type", data.hireType],
        ["Number of Vehicles", data.numberOfVehicles],
        ["Number of Days", data.numberOfDays],
        ["Passengers", data.pax],
        ["Extra Baggage", data.extraBaggage],
      ]);
    default:
      return entries([]);
  }
}

export async function submitCustomInquiry(
  _prevState: InquiryState,
  formData: FormData,
): Promise<InquiryState> {
  const t = await getTranslations("serverActions");

  // Every visible field, echoed back so a failed submit doesn't wipe the form.
  const FIELDS = [
    "inquiryType", "firstName", "lastName", "countryCity", "passportNumber",
    "email", "mobile", "package", "hotel", "roomCategory", "roomType",
    "mealPlan", "numberOfRooms", "arrival", "departure", "adults", "children",
    "extraBed", "airline", "route", "wayType", "flightClass", "pax",
    "extraBaggage", "carType", "hireType", "numberOfVehicles", "numberOfDays",
  ] as const;
  const values = Object.fromEntries(
    FIELDS.map((key) => [key, fs(formData, key)]),
  ) as Record<string, string>;

  const parsed = customInquirySchema.safeParse({
    ...values,
    company: fs(formData, "company"),
    startedAt: fs(formData, "startedAt"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      note: parsed.error.issues[0]?.message ?? t("checkForm"),
      values,
    };
  }

  const data = parsed.data;

  if (data.startedAt && Date.now() - data.startedAt < 2500) {
    return { ok: false, note: t("waitMoment"), values };
  }

  // Make sure the address can actually receive mail (catches typos + fakes).
  const email = data.email.trim().toLowerCase();
  const deliverable = await checkEmailDeliverable(email);
  if (!deliverable.ok) {
    return { ok: false, note: deliverable.reason, values };
  }

  if (!canUseSupabaseService()) {
    return { ok: false, note: t("inquiriesNotConfigured"), values };
  }

  try {
    const ipHash = await getRequestIpHash();
    const recent = await countRecentCustomInquiriesByIp(ipHash);

    if (recent >= 8) {
      return {
        ok: false,
        note: t("tooManyInquiries"),
        values,
      };
    }

    const { details, lines } = buildDetails(data);

    await createCustomInquiry({
      inquiry_type: data.inquiryType,
      first_name: data.firstName,
      last_name: data.lastName,
      country_city: data.countryCity || null,
      passport_number: data.passportNumber || null,
      email,
      mobile: data.mobile,
      details: details as Json,
      ip_hash: ipHash,
    });

    await sendCustomInquiryEmails({
      inquiryType: data.inquiryType,
      firstName: data.firstName,
      fullName: `${data.firstName} ${data.lastName}`,
      email,
      mobile: data.mobile,
      countryCity: data.countryCity || null,
      passportNumber: data.passportNumber || null,
      lines,
    });

    // Business-facing SMS notification (fail-soft — sendInquirySms never throws).
    // The reference is generated for the SMS only; it is not persisted.
    await sendInquirySms({ reference: generateInquiryReference() });

    return {
      ok: true,
      note: t("inquirySuccess"),
    };
  } catch (error) {
    console.error(error);

    return {
      ok: false,
      note: t("inquiryError"),
      values,
    };
  }
}
