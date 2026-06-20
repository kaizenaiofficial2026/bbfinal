import { z } from "zod";

// Traveller name/email now come from the signed-in customer account, not the
// form, so they are no longer collected or validated here.
export const bookingSchema = z.object({
  tourPackageId: z.uuid("Invalid package."),
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
