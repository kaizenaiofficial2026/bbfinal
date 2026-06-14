import { z } from "zod";

export const enquirySchema = z.object({
  name: z.string().trim().min(2, "Please enter your name.").max(120),
  email: z.email("Please enter a valid email address.").max(180),
  phone: z.string().trim().max(60).optional().or(z.literal("")),
  packageLabel: z.string().trim().max(160).optional().or(z.literal("")),
  message: z
    .string()
    .trim()
    .min(10, "Please add a few travel notes.")
    .max(2000),
  source: z.string().trim().max(80).default("contact-form"),
  company: z.string().max(0).optional().or(z.literal("")),
  startedAt: z.coerce.number().optional(),
});

export type EnquiryInput = z.infer<typeof enquirySchema>;
