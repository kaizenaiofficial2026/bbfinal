import { z } from "zod";

// Ticket lifecycle. `open` is the default; status is only ever changed via the
// support API (the Kaizen panel), never from the Beyond Borders admin UI.
export const SUPPORT_TICKET_STATUSES = [
  "open",
  "in_progress",
  "closed",
] as const;

export const supportTicketStatusSchema = z.enum(SUPPORT_TICKET_STATUSES);

export type SupportTicketStatus = (typeof SUPPORT_TICKET_STATUSES)[number];

export const supportTicketSchema = z.object({
  title: z.string().trim().min(2, "Please enter a title.").max(140),
  description: z
    .string()
    .trim()
    .min(2, "Please add a description.")
    .max(4000),
});

export type SupportTicketInput = z.infer<typeof supportTicketSchema>;
