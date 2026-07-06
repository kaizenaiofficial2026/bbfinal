"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createMediaUploadUrlAction } from "@/app/admin/actions";

// A minimal, session-less browser client used ONLY to PUT a file to a
// pre-authorized signed upload URL. The signed-URL token (minted server-side by
// the service role) authorizes the write, so no auth session is needed here.
let browserClient: SupabaseClient | null = null;
function anonClient(): SupabaseClient {
  if (!browserClient) {
    browserClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL as string,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
      { auth: { persistSession: false } },
    );
  }
  return browserClient;
}

/**
 * Upload an image straight from the browser to Supabase Storage and return its
 * public URL. The bytes go directly to Supabase — never through the Next/Vercel
 * Server Action — so the platform request-body cap doesn't apply and any number
 * of images can be attached. Throws with a user-facing message on failure.
 */
export async function uploadMediaDirect(
  prefix: "destinations" | "packages",
  file: File,
): Promise<string> {
  const ticket = await createMediaUploadUrlAction({
    prefix,
    filename: file.name,
    contentType: file.type,
    size: file.size,
  });
  if (!ticket.ok) {
    throw new Error(ticket.note);
  }

  const { error } = await anonClient()
    .storage.from("media")
    .uploadToSignedUrl(ticket.path, ticket.token, file, {
      contentType: file.type,
    });
  if (error) {
    throw new Error(error.message || "Upload failed. Please try again.");
  }

  return ticket.publicUrl;
}
