import { z } from "zod";

// Common guest details + spam guards, shared by every inquiry type.
const guest = {
  firstName: z.string().trim().min(1, "First name is required.").max(120),
  lastName: z.string().trim().min(1, "Last name is required.").max(120),
  countryCity: z.string().trim().max(160).optional().or(z.literal("")),
  passportNumber: z.string().trim().max(60).optional().or(z.literal("")),
  email: z.email("Please enter a valid email address.").max(180),
  mobile: z.string().trim().min(4, "Please enter a mobile number.").max(40),
  company: z.string().max(0).optional().or(z.literal("")), // honeypot
  startedAt: z.coerce.number().optional(),
};

const required = (label: string) => z.string().trim().min(1, label).max(160);
const yesNo = z.enum(["Yes", "No"]);

export const customInquirySchema = z.discriminatedUnion("inquiryType", [
  z.object({
    inquiryType: z.literal("package"),
    ...guest,
    package: required("Please choose a package."),
  }),
  z
    .object({
      inquiryType: z.literal("hotel"),
      ...guest,
      hotel: required("Please choose a hotel."),
      roomCategory: required("Please choose a room category."),
      roomType: required("Please choose a room type."),
      mealPlan: required("Please choose a meal plan."),
      numberOfRooms: z.coerce.number().int().min(1).max(50),
      arrival: required("Arrival date is required.").max(40),
      departure: required("Departure date is required.").max(40),
      adults: z.coerce.number().int().min(1).max(50),
      children: z.coerce.number().int().min(0).max(50),
      extraBed: yesNo,
    })
    // ISO date strings (YYYY-MM-DD) compare correctly as strings.
    .refine((d) => d.departure >= d.arrival, {
      message: "Departure can't be before arrival.",
      path: ["departure"],
    }),
  z
    .object({
      inquiryType: z.literal("airticket"),
      ...guest,
      airline: required("Airline is required.").max(120),
      route: required("Route is required."),
      wayType: z.enum(["One way", "Both way"]),
      arrival: required("Departure date is required.").max(40),
      departure: z.string().trim().max(40).optional().or(z.literal("")),
      flightClass: required("Class is required.").max(60),
      pax: z.coerce.number().int().min(1).max(50),
      extraBaggage: yesNo,
    })
    // `arrival` is the departure date; `departure` is the optional return date.
    .refine((d) => !d.departure || d.departure >= d.arrival, {
      message: "The return date can't be before the departure date.",
      path: ["departure"],
    }),
  z.object({
    inquiryType: z.literal("transport"),
    ...guest,
    carType: required("Car type is required."),
    hireType: required("Hire type is required."),
    numberOfVehicles: z.coerce.number().int().min(1).max(50),
    numberOfDays: z.coerce.number().int().min(1).max(365),
    pax: z.coerce.number().int().min(1).max(50),
    extraBaggage: yesNo,
  }),
]);

export type CustomInquiryInput = z.infer<typeof customInquirySchema>;
