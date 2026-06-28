import { z } from "zod";
import {
  ISO_DATE,
  MAX_SEGMENTS,
  TRIP_TYPES,
  parseSegments,
} from "./air-segments";
import { todayIso } from "./dates";

// Common guest details + spam guards. The customer always provides these so we
// can reply, regardless of which services they pick.
const guest = {
  firstName: z.string().trim().min(1, "First name is required.").max(120),
  lastName: z.string().trim().min(1, "Last name is required.").max(120),
  countryCity: z.string().trim().min(1, "Country & city are required.").max(160),
  passportNumber: z
    .string()
    .trim()
    .min(1, "Passport number is required.")
    .max(60),
  email: z.email("Please enter a valid email address.").max(180),
  mobile: z.string().trim().min(4, "Please enter a mobile number.").max(40),
  company: z.string().max(0).optional().or(z.literal("")), // honeypot
  startedAt: z.coerce.number().optional(),
};

const required = (label: string) => z.string().trim().min(1, label).max(160);
const yesNo = z.enum(["Yes", "No"]);

// Earliest acceptable travel date. The client blocks truly-past dates against
// the visitor's local "today"; the server runs in UTC, so we allow one day of
// slack — a visitor's local today in a behind-UTC timezone is never rejected,
// while clearly-past dates still are.
const earliestTravelDate = () => todayIso(new Date(Date.now() - 86_400_000));
// Lenient placeholder for an optional section field — empty when the section is
// skipped; the per-section sub-schema below re-validates it when filled. Coerces
// so numeric form inputs (and test fixtures) are accepted as their string form.
const opt = z.coerce.string().trim().optional().default("");

// ── Section "started" detection ──────────────────────────────────────────────
// A section is "started" once the user has begun filling it, so it must then be
// completed in full. Field names that signal intent per section (the air ticket
// ignores its always-present defaults — Colombo destination, Economy, etc.).
export const HOTEL_FIELDS = [
  "hotel",
  "hotelRoomCategory",
  "hotelRoomType",
  "hotelMealPlan",
  "hotelRooms",
  "hotelArrival",
  "hotelDeparture",
  "hotelAdults",
  "hotelExtraBed",
] as const;

export const TRANSPORT_FIELDS = [
  "carType",
  "hireType",
  "transportVehicles",
  "transportDays",
  "transportPax",
  "transportExtraBaggage",
] as const;

type Values = Record<string, string>;
const filled = (v: Values, key: string) => (v[key] ?? "").trim() !== "";

export function hotelStarted(v: Values): boolean {
  return HOTEL_FIELDS.some((f) => filled(v, f));
}
export function transportStarted(v: Values): boolean {
  return TRANSPORT_FIELDS.some((f) => filled(v, f));
}
export function airStarted(v: Values): boolean {
  if (filled(v, "airline")) return true;
  // Ignore the default destination — a started air section means an airline,
  // an origin, or a flight date was entered.
  return parseSegments(v.airSegments ?? "").some(
    (s) => s.from.trim() !== "" || s.date.trim() !== "",
  );
}

export function startedSectionCount(v: Values): number {
  return [hotelStarted(v), airStarted(v), transportStarted(v)].filter(Boolean)
    .length;
}

// ── Per-section completeness schemas (only run when a section is started) ─────
const hotelSection = z
  .object({
    hotel: required("Please choose a hotel."),
    hotelRoomCategory: required("Please choose a room category."),
    hotelRoomType: required("Please choose a room type."),
    hotelMealPlan: required("Please choose a meal plan."),
    hotelRooms: z.coerce.number().int().min(1).max(50),
    hotelArrival: z
      .string()
      .trim()
      .regex(ISO_DATE, "A valid arrival date is required."),
    hotelDeparture: z
      .string()
      .trim()
      .regex(ISO_DATE, "A valid departure date is required."),
    hotelAdults: z.coerce.number().int().min(1).max(50),
    hotelChildren: z.coerce.number().int().min(0).max(50).optional(),
    hotelExtraBed: yesNo,
  })
  .refine((d) => d.hotelArrival >= earliestTravelDate(), {
    message: "Arrival date can't be in the past.",
    path: ["hotelArrival"],
  })
  .refine((d) => d.hotelDeparture >= d.hotelArrival, {
    message: "Departure can't be before arrival.",
    path: ["hotelDeparture"],
  });

const airSection = z
  .object({
    airline: required("Airline is required.").max(120),
    airTripType: z.enum(TRIP_TYPES),
    airSegments: z.preprocess(
      (v) => parseSegments(v),
      z
        .array(
          z.object({
            from: z.string().trim().min(1, "Origin is required.").max(120),
            to: z.string().trim().min(1, "Destination is required.").max(120),
            date: z.string().trim().regex(ISO_DATE, "A flight date is required."),
            returnDate: z
              .string()
              .trim()
              .regex(ISO_DATE)
              .optional()
              .or(z.literal("")),
          }),
        )
        .min(1, "Please add at least one flight.")
        .max(MAX_SEGMENTS),
    ),
    airClass: required("Class is required.").max(60),
    airAdults: z.coerce.number().int().min(1).max(50),
    airChildren: z.coerce.number().int().min(0).max(50),
    airExtraBaggage: yesNo,
  })
  .refine(
    (d) =>
      d.airSegments.every(
        (s) => s.from.trim().toLowerCase() !== s.to.trim().toLowerCase(),
      ),
    { message: "Origin and destination can't be the same.", path: ["airSegments"] },
  )
  .refine((d) => d.airSegments.every((s) => s.date >= earliestTravelDate()), {
    message: "Flight date can't be in the past.",
    path: ["airSegments"],
  })
  .refine((d) => d.airTripType !== "Multi-city" || d.airSegments.length >= 2, {
    message: "Add at least two flights for a multi-city trip.",
    path: ["airSegments"],
  })
  .refine(
    (d) => d.airTripType !== "Round trip" || !!d.airSegments[0]?.returnDate,
    { message: "A return date is required for a round trip.", path: ["airSegments"] },
  )
  .refine(
    (d) =>
      d.airTripType !== "Round trip" ||
      !d.airSegments[0]?.returnDate ||
      d.airSegments[0].returnDate >= d.airSegments[0].date,
    {
      message: "The return date can't be before the departure date.",
      path: ["airSegments"],
    },
  );

const transportSection = z.object({
  carType: required("Car type is required."),
  hireType: required("Hire type is required."),
  transportVehicles: z.coerce.number().int().min(1).max(50),
  transportDays: z.coerce.number().int().min(1).max(365),
  transportPax: z.coerce.number().int().min(1).max(50),
  transportExtraBaggage: yesNo,
});

// ── Main schema: guest always required; each service section optional but
// all-or-nothing when started; at least one section must be complete. ─────────
export const customInquirySchema = z
  .object({
    ...guest,

    // Hotel (lenient — validated by hotelSection only when started)
    hotel: opt,
    hotelRoomCategory: opt,
    hotelRoomType: opt,
    hotelMealPlan: opt,
    hotelRooms: opt,
    hotelArrival: opt,
    hotelDeparture: opt,
    hotelAdults: opt,
    hotelChildren: opt,
    hotelExtraBed: opt,

    // Air ticket
    airline: opt,
    airTripType: opt,
    airSegments: opt,
    airClass: opt,
    airAdults: opt,
    airChildren: opt,
    airExtraBaggage: opt,

    // Transport
    carType: opt,
    hireType: opt,
    transportVehicles: opt,
    transportDays: opt,
    transportPax: opt,
    transportExtraBaggage: opt,
  })
  .superRefine((data, ctx) => {
    const v = data as unknown as Values;
    let complete = 0;

    const run = (started: boolean, schema: z.ZodTypeAny) => {
      if (!started) return;
      const result = schema.safeParse(data);
      if (result.success) {
        complete += 1;
        return;
      }
      for (const issue of result.error.issues) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: issue.path,
          message: issue.message,
        });
      }
    };

    run(hotelStarted(v), hotelSection);
    run(airStarted(v), airSection);
    run(transportStarted(v), transportSection);

    if (complete === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["sections"],
        message:
          "Please fill in at least one service (hotel, air ticket or transport).",
      });
    }
  });

export type CustomInquiryInput = z.infer<typeof customInquirySchema>;
