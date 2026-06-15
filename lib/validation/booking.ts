import { z } from "zod";

export const bookingSchema = z.object({
  tourPackageId: z.uuid("Invalid package."),
  packageTitle: z.string().trim().min(1).max(180),
  travellerName: z.string().trim().min(2, "Please enter your name.").max(120),
  email: z.email("Please enter a valid email address.").max(180),
  phone: z.string().trim().max(60).optional().or(z.literal("")),
  travelDates: z
    .string()
    .trim()
    .min(3, "Please enter preferred travel dates.")
    .max(160),
  travellers: z.coerce.number().int().min(1).max(50),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
  company: z.string().max(0).optional().or(z.literal("")),
  startedAt: z.coerce.number().optional(),
});

export type BookingInput = z.infer<typeof bookingSchema>;
