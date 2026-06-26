import { z } from "zod";

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

    // Package
    package: required("Please choose a package."),

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

    // Air ticket
    airline: required("Airline is required.").max(120),
    airRoute: required("Route is required."),
    airWayType: z.enum(["One way", "Both way"]),
    airDepartDate: required("Departure date is required.").max(40),
    airReturnDate: z.string().trim().max(40).optional().or(z.literal("")),
    airClass: required("Class is required.").max(60),
    airPax: z.coerce.number().int().min(1).max(50),
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
  // `airDepartDate` is the outbound date; `airReturnDate` is mandatory for a
  // round trip, optional one-way.
  .refine((d) => d.airWayType !== "Both way" || !!d.airReturnDate, {
    message: "A return date is required for a round trip.",
    path: ["airReturnDate"],
  })
  .refine((d) => !d.airReturnDate || d.airReturnDate >= d.airDepartDate, {
    message: "The return date can't be before the departure date.",
    path: ["airReturnDate"],
  });

export type CustomInquiryInput = z.infer<typeof customInquirySchema>;
