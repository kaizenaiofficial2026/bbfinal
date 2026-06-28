import { z } from "zod";
import {
  ISO_DATE,
  MAX_SEGMENTS,
  TRIP_TYPES,
  parseSegments,
} from "./air-segments";

// Common guest details + spam guards.
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

// The custom inquiry is now a single multi-service submission gathering ALL four
// services in one go: Package → Hotel → Air ticket → Transport. Every section is
// mandatory. Field names are namespaced per section (hotel*/air*/transport*)
// because they share one <form> and would otherwise collide (arrival/departure,
// pax, extraBaggage). Dates are ISO (YYYY-MM-DD) so string comparison is correct.
export const customInquirySchema = z
  .object({
    ...guest,

    // Hotel
    hotel: required("Please choose a hotel."),
    hotelRoomCategory: required("Please choose a room category."),
    hotelRoomType: required("Please choose a room type."),
    hotelMealPlan: required("Please choose a meal plan."),
    hotelRooms: z.coerce.number().int().min(1).max(50),
    hotelArrival: required("Arrival date is required.").max(40),
    hotelDeparture: required("Departure date is required.").max(40),
    hotelAdults: z.coerce.number().int().min(1).max(50),
    hotelChildren: z.coerce.number().int().min(0).max(50),
    hotelExtraBed: yesNo,

    // Air ticket — a trip type plus one or more flight segments (parsed from
    // the JSON the trip builder posts). See lib/validation/air-segments.ts.
    airline: required("Airline is required.").max(120),
    airTripType: z.enum(TRIP_TYPES),
    airSegments: z.preprocess(
      (v) => parseSegments(v),
      z
        .array(
          z.object({
            from: z.string().trim().min(1, "Origin is required.").max(120),
            to: z.string().trim().min(1, "Destination is required.").max(120),
            date: z
              .string()
              .trim()
              .regex(ISO_DATE, "A flight date is required."),
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

    // Transport
    carType: required("Car type is required."),
    hireType: required("Hire type is required."),
    transportVehicles: z.coerce.number().int().min(1).max(50),
    transportDays: z.coerce.number().int().min(1).max(365),
    transportPax: z.coerce.number().int().min(1).max(50),
    transportExtraBaggage: yesNo,
  })
  .refine((d) => d.hotelDeparture >= d.hotelArrival, {
    message: "Departure can't be before arrival.",
    path: ["hotelDeparture"],
  })
  // A multi-city trip needs at least two flights.
  .refine((d) => d.airTripType !== "Multi-city" || d.airSegments.length >= 2, {
    message: "Add at least two flights for a multi-city trip.",
    path: ["airSegments"],
  })
  // A round trip needs a return date on or after the outbound date.
  .refine(
    (d) => d.airTripType !== "Round trip" || !!d.airSegments[0]?.returnDate,
    {
      message: "A return date is required for a round trip.",
      path: ["airSegments"],
    },
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

export type CustomInquiryInput = z.infer<typeof customInquirySchema>;
