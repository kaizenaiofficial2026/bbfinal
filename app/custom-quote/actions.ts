"use server";

import {
  countRecentCustomInquiriesByIp,
  createCustomInquiry,
} from "@/lib/data/custom-inquiries";
import { sendCustomInquiryEmails } from "@/lib/email/send";
import { getRequestIpHash } from "@/lib/security/request";
import { canUseSupabaseService } from "@/lib/supabase/service";
import type { Json } from "@/lib/supabase/types";
import {
  customInquirySchema,
  type CustomInquiryInput,
} from "@/lib/validation/custom-inquiry";
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
  const parsed = customInquirySchema.safeParse({
    inquiryType: fs(formData, "inquiryType"),
    firstName: fs(formData, "firstName"),
    lastName: fs(formData, "lastName"),
    countryCity: fs(formData, "countryCity"),
    passportNumber: fs(formData, "passportNumber"),
    email: fs(formData, "email"),
    mobile: fs(formData, "mobile"),
    company: fs(formData, "company"),
    startedAt: fs(formData, "startedAt"),
    package: fs(formData, "package"),
    hotel: fs(formData, "hotel"),
    roomCategory: fs(formData, "roomCategory"),
    roomType: fs(formData, "roomType"),
    mealPlan: fs(formData, "mealPlan"),
    numberOfRooms: fs(formData, "numberOfRooms"),
    arrival: fs(formData, "arrival"),
    departure: fs(formData, "departure"),
    adults: fs(formData, "adults"),
    children: fs(formData, "children"),
    extraBed: fs(formData, "extraBed"),
    airline: fs(formData, "airline"),
    route: fs(formData, "route"),
    wayType: fs(formData, "wayType"),
    flightClass: fs(formData, "flightClass"),
    pax: fs(formData, "pax"),
    extraBaggage: fs(formData, "extraBaggage"),
    carType: fs(formData, "carType"),
    hireType: fs(formData, "hireType"),
    numberOfVehicles: fs(formData, "numberOfVehicles"),
    numberOfDays: fs(formData, "numberOfDays"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      note: parsed.error.issues[0]?.message ?? "Please check the form.",
    };
  }

  const data = parsed.data;

  if (data.startedAt && Date.now() - data.startedAt < 2500) {
    return { ok: false, note: "Please wait a moment before submitting." };
  }

  if (!canUseSupabaseService()) {
    return { ok: false, note: "Inquiries are not configured yet." };
  }

  try {
    const ipHash = await getRequestIpHash();
    const recent = await countRecentCustomInquiriesByIp(ipHash);

    if (recent >= 8) {
      return {
        ok: false,
        note: "Too many recent inquiries from this connection. Please try again later.",
      };
    }

    const { details, lines } = buildDetails(data);

    await createCustomInquiry({
      inquiry_type: data.inquiryType,
      first_name: data.firstName,
      last_name: data.lastName,
      country_city: data.countryCity || null,
      passport_number: data.passportNumber || null,
      email: data.email,
      mobile: data.mobile,
      details: details as Json,
      ip_hash: ipHash,
    });

    await sendCustomInquiryEmails({
      inquiryType: data.inquiryType,
      firstName: data.firstName,
      fullName: `${data.firstName} ${data.lastName}`,
      email: data.email,
      mobile: data.mobile,
      countryCity: data.countryCity || null,
      passportNumber: data.passportNumber || null,
      lines,
    });

    return {
      ok: true,
      note: "Thank you. Your inquiry has been received — our team will reply by email.",
    };
  } catch (error) {
    console.error(error);

    return {
      ok: false,
      note: "We could not submit your inquiry. Please try again or contact the team directly.",
    };
  }
}
