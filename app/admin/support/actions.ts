"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import { supportTicketSchema } from "@/lib/validation/support";
import {
  createSupportTicket,
  uploadSupportImage,
} from "@/lib/data/support-tickets";

export type CreateTicketResult = {
  ok: boolean;
  note: string;
  number?: string;
};

export async function createSupportTicketAction(
  formData: FormData,
): Promise<CreateTicketResult> {
  await requireAdmin();

  const parsed = supportTicketSchema.safeParse({
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? ""),
  });
  if (!parsed.success) {
    return {
      ok: false,
      note: parsed.error.issues[0]?.message ?? "Please check the form.",
    };
  }

  let imageUrl = "";
  try {
    imageUrl = await uploadSupportImage(formData.get("image"));
  } catch (error) {
    return {
      ok: false,
      note: error instanceof Error ? error.message : "Image upload failed.",
    };
  }

  try {
    const ticket = await createSupportTicket({
      title: parsed.data.title,
      description: parsed.data.description,
      imageUrl,
    });
    revalidatePath("/admin/support");
    return { ok: true, note: "Ticket created.", number: ticket.number };
  } catch (error) {
    return {
      ok: false,
      note:
        error instanceof Error ? error.message : "Could not create the ticket.",
    };
  }
}
