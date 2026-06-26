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

type Section = { title: string; fields: [string, string | number][] };

// One submission now covers all four services. `details` is stored grouped by
// section (jsonb), and the email `lines` flatten the same sections with a bold
// heading row before each (heading lines carry an empty value).
function buildSections(data: CustomInquiryInput): Section[] {
  return [
    { title: "Package", fields: [["Package", data.package]] },
    {
      title: "Hotel",
      fields: [
        ["Hotel", data.hotel],
        ["Room Category", data.hotelRoomCategory],
        ["Room Type", data.hotelRoomType],
        ["Meal Plan", data.hotelMealPlan],
        ["Number of Rooms", data.hotelRooms],
        ["Arrival", data.hotelArrival],
        ["Departure", data.hotelDeparture],
        ["Adults", data.hotelAdults],
        ["Children", data.hotelChildren],
        ["Extra Bed", data.hotelExtraBed],
      ],
    },
    {
      title: "Air ticket",
      fields: [
        ["Airline", data.airline],
        ["Route", data.airRoute],
        ["Trip", data.airWayType],
        ["Departure date", data.airDepartDate],
        ["Return date", data.airReturnDate || "—"],
        ["Class", data.airClass],
        ["Passengers", data.airPax],
        ["Extra Baggage", data.airExtraBaggage],
      ],
    },
    {
      title: "Transport",
      fields: [
        ["Car Type", data.carType],
        ["Hire Type", data.hireType],
        ["Number of Vehicles", data.transportVehicles],
        ["Number of Days", data.transportDays],
        ["Passengers", data.transportPax],
        ["Extra Baggage", data.transportExtraBaggage],
      ],
    },
  ];
}

function buildDetails(data: CustomInquiryInput) {
  const sections = buildSections(data);

  const details: Record<string, Record<string, string | number>> = {};
  const lines: { label: string; value: string; heading?: boolean }[] = [];

  for (const section of sections) {
    details[section.title] = Object.fromEntries(section.fields);
    lines.push({ label: section.title, value: "", heading: true });
    for (const [label, value] of section.fields) {
      lines.push({ label, value: String(value) });
    }
  }

  return { details, lines };
}

export async function submitCustomInquiry(
  _prevState: InquiryState,
  formData: FormData,
): Promise<InquiryState> {
  const t = await getTranslations("serverActions");

  // Every visible field, echoed back so a failed submit doesn't wipe the form.
  const FIELDS = [
    "firstName", "lastName", "countryCity", "passportNumber", "email", "mobile",
    "package",
    "hotel", "hotelRoomCategory", "hotelRoomType", "hotelMealPlan", "hotelRooms",
    "hotelArrival", "hotelDeparture", "hotelAdults", "hotelChildren",
    "hotelExtraBed",
    "airline", "airRoute", "airWayType", "airDepartDate", "airReturnDate",
    "airClass", "airPax", "airExtraBaggage",
    "carType", "hireType", "transportVehicles", "transportDays", "transportPax",
    "transportExtraBaggage",
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
      // Every submission now spans all four services. The enum column keeps a
      // valid value ("package" is always present); the admin derives the
      // "Custom inquiry" label from the grouped `details` instead.
      inquiry_type: "package",
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
      inquiryType: "custom",
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
