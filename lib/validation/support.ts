import { z } from "zod";

export const supportTicketSchema = z.object({
  title: z.string().trim().min(2, "Please enter a title.").max(140),
  description: z
    .string()
    .trim()
    .min(2, "Please add a description.")
    .max(4000),
});

export type SupportTicketInput = z.infer<typeof supportTicketSchema>;
