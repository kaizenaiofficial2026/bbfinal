import "server-only";

import { dbError } from "@/lib/data/errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import type { Database } from "@/lib/supabase/types";

export type SupportTicketRow =
  Database["public"]["Tables"]["support_tickets"]["Row"];

const ALLOWED_MEDIA_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
];
const MAX_MEDIA_BYTES = 4 * 1024 * 1024;

// KZN-#### — random. Uniqueness is guaranteed by the table's unique constraint
// (a collision is rejected and createSupportTicket retries with a new number).
function makeTicketNumber(): string {
  return `KZN-${String(Math.floor(Math.random() * 10000)).padStart(4, "0")}`;
}

/**
 * Upload an optional ticket screenshot to the public `media` bucket (under a
 * `support/` prefix) via the admin session, and return its public URL. Empty
 * input returns "" (no image).
 */
export async function uploadSupportImage(
  file: FormDataEntryValue | null,
): Promise<string> {
  if (!(file instanceof File) || file.size === 0) {
    return "";
  }
  if (!ALLOWED_MEDIA_TYPES.includes(file.type)) {
    throw new Error("Unsupported image type. Use JPEG, PNG, WEBP or AVIF.");
  }
  if (file.size > MAX_MEDIA_BYTES) {
    throw new Error("Image is too large. The maximum size is 4MB.");
  }

  const supabase = await createSupabaseServerClient();
  const extension = file.name.split(".").pop() || "bin";
  const path = `support/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from("media").upload(path, file, {
    cacheControl: "31536000",
    upsert: false,
  });
  if (error) {
    throw new Error(error.message);
  }

  const { data } = supabase.storage.from("media").getPublicUrl(path);
  return data.publicUrl;
}

export async function createSupportTicket(input: {
  title: string;
  description: string;
  imageUrl: string;
}): Promise<SupportTicketRow> {
  const supabase = await createSupabaseServerClient();

  // Retry on a unique-number collision (Postgres 23505) so the random KZN-####
  // is always unique without needing a sequence.
  for (let attempt = 0; attempt < 12; attempt++) {
    const { data, error } = await supabase
      .from("support_tickets")
      .insert({
        number: makeTicketNumber(),
        title: input.title,
        description: input.description,
        image_url: input.imageUrl || null,
      })
      .select("*")
      .single();

    if (!error && data) {
      return data as SupportTicketRow;
    }
    if (error && error.code !== "23505") {
      dbError(error);
    }
  }

  throw new Error(
    "Could not allocate a unique ticket number. Please try again.",
  );
}

/**
 * Read all tickets via the SERVICE-ROLE client (bypasses RLS). For machine
 * callers that have no admin session — specifically the token-authenticated
 * support API. Never call this from an unauthenticated public path.
 */
export async function listSupportTicketsService(): Promise<SupportTicketRow[]> {
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("support_tickets")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    dbError(error);
  }
  return (data ?? []) as SupportTicketRow[];
}

/** Single ticket by id via the SERVICE-ROLE client (support API only). */
export async function getSupportTicketService(
  id: string,
): Promise<SupportTicketRow | null> {
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("support_tickets")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) {
    dbError(error);
  }
  return (data as SupportTicketRow | null) ?? null;
}

/**
 * Update a ticket's status via the SERVICE-ROLE client (support API only —
 * status is never changed from the Beyond Borders admin UI). Returns the updated
 * row, or null if no ticket with that id exists.
 */
export async function updateSupportTicketStatusService(
  id: string,
  status: string,
): Promise<SupportTicketRow | null> {
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("support_tickets")
    .update({ status })
    .eq("id", id)
    .select("*")
    .maybeSingle();
  if (error) {
    dbError(error);
  }
  return (data as SupportTicketRow | null) ?? null;
}

export async function listSupportTickets(): Promise<SupportTicketRow[]> {
  // Fail-soft: if the table isn't there yet (migration not applied) or a read
  // errors, return an empty list so the Support panel still renders instead of
  // crashing — it just shows the "No tickets yet" state.
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("support_tickets")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as SupportTicketRow[];
  } catch (error) {
    console.error("[support-tickets] list failed", error);
    return [];
  }
}
