"use server";

import { getTranslations } from "next-intl/server";
import { createCustomInquiry } from "@/lib/data/custom-inquiries";
import { checkAndRecordRateLimit } from "@/lib/data/rate-limit";
import { sendCustomInquiryEmails } from "@/lib/email/send";
import { sendInquirySms } from "@/lib/sms/send";
import {
  generateInquiryReference,
  getRequestIpHash,
  scopedRateKey,
} from "@/lib/security/request";
import { toRetryMinutes } from "@/lib/security/retry-after";
import { canUseSupabaseService } from "@/lib/supabase/service";
import type { Json } from "@/lib/supabase/types";
import {
  customInquirySchema,
  type CustomInquiryInput,
} from "@/lib/validation/custom-inquiry";
import { serializeRoute } from "@/lib/validation/air-segments";
import { checkEmailDeliverable } from "@/lib/validation/email-deliverability";
import type { InquiryState } from "./inquiry-state";

function fs(formData: FormData, key: string) {
  return String(formData.get(key) ?? "");
}

type Section = { title: string; fields: [string, string | number][] };

// Flatten the trip builder's segments into label→value rows for storage/email.
// One-way/round-trip show the single route + dates; multi-city lists each leg.
function airTicketFields(
  data: CustomInquiryInput,
): [string, string | number][] {
  const fields: [string, string | number][] = [
    ["Airline", data.airline],
    ["Trip", data.airTripType],
    ["Route", serializeRoute(data.airTripType, data.airSegments)],
  ];

  if (data.airTripType === "Multi-city") {
    data.airSegments.forEach((s, i) => {
      fields.push([`Flight ${i + 1}`, `${s.from} → ${s.to} · ${s.date}`]);
    });
  } else {
    const s = data.airSegments[0];
    fields.push(["Departure date", s?.date ?? "—"]);
    if (data.airTripType === "Round trip") {
      fields.push(["Return date", s?.returnDate || "—"]);
    }
  }

  fields.push(
    ["Class", data.airClass],
    ["Adults", data.airAdults],
    ["Children", data.airChildren],
    ["Extra Baggage", data.airExtraBaggage],
  );
  return fields;
}

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
      fields: airTicketFields(data),
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
    "airline", "airTripType", "airSegments",
    "airClass", "airAdults", "airChildren", "airExtraBaggage",
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
    // Surface EVERY invalid field (not just the first) so the form can mark each
    // one and the visitor sees exactly what to fix in one pass.
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string" && !fieldErrors[key]) {
        fieldErrors[key] = issue.message;
      }
    }
    return {
      ok: false,
      note: parsed.error.issues[0]?.message ?? t("checkForm"),
      values,
      fieldErrors,
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
    return {
      ok: false,
      note: deliverable.reason,
      values,
      fieldErrors: { email: deliverable.reason },
    };
  }

  if (!canUseSupabaseService()) {
    return { ok: false, note: t("inquiriesNotConfigured"), values };
  }

  try {
    // Key the limit by (IP, email) — NOT IP alone — so two different people
    // behind the same network (shared NAT/office Wi-Fi) each get their own quota
    // and concurrent submissions don't block one another. Also returns an exact
    // retry window so the visitor is told how long to wait.
    const ipHash = await getRequestIpHash();
    const rate = await checkAndRecordRateLimit(
      "custom-inquiry",
      scopedRateKey(ipHash, email),
      { max: 8, windowMinutes: 60 },
    );

    if (!rate.allowed) {
      return {
        ok: false,
        note: t("rateLimited", {
          minutes: toRetryMinutes(rate.retryAfterSeconds),
        }),
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
