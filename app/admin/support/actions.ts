"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import { supportTicketSchema } from "@/lib/validation/support";
import {
  createSupportTicket,
  deleteSupportTicket,
  updateSupportTicketContent,
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

export async function updateSupportTicketAction(
  formData: FormData,
): Promise<CreateTicketResult> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  if (!id) {
    return { ok: false, note: "Missing ticket id." };
  }

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

  // Image resolution: a newly uploaded file wins; otherwise keep the existing
  // image, unless the admin explicitly removed it.
  const existingImage = String(formData.get("existingImage") ?? "");
  const removeImage = String(formData.get("removeImage") ?? "") === "1";
  let imageUrl: string | null;
  try {
    const uploaded = await uploadSupportImage(formData.get("image"));
    if (uploaded) {
      imageUrl = uploaded;
    } else if (removeImage) {
      imageUrl = null;
    } else {
      imageUrl = existingImage || null;
    }
  } catch (error) {
    return {
      ok: false,
      note: error instanceof Error ? error.message : "Image upload failed.",
    };
  }

  try {
    await updateSupportTicketContent({
      id,
      title: parsed.data.title,
      description: parsed.data.description,
      imageUrl,
    });
    revalidatePath("/admin/support");
    return { ok: true, note: "Ticket updated." };
  } catch (error) {
    return {
      ok: false,
      note:
        error instanceof Error ? error.message : "Could not update the ticket.",
    };
  }
}

export async function deleteSupportTicketAction(
  id: string,
): Promise<CreateTicketResult> {
  await requireAdmin();

  if (!id) {
    return { ok: false, note: "Missing ticket id." };
  }

  try {
    await deleteSupportTicket(id);
    revalidatePath("/admin/support");
    return { ok: true, note: "Ticket deleted." };
  } catch (error) {
    return {
      ok: false,
      note:
        error instanceof Error ? error.message : "Could not delete the ticket.",
    };
  }
}
