import "server-only";

import { randomBytes } from "node:crypto";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

/**
 * Sequential reference numbers for orders (BB-ORD-<n>) and custom inquiries
 * (BB-INQ-<n>), backed by Postgres sequences via SECURITY DEFINER RPCs.
 *
 * FAIL-SAFE: if the sequence/RPC isn't available (e.g. the migration hasn't been
 * applied yet, or a transient DB error), we fall back to a random suffix rather
 * than throwing — a booking or inquiry must never fail just because numbering
 * hiccuped. Fallback references keep the same prefix so they're still readable.
 */
async function nextSequence(
  fn: "next_order_number" | "next_inquiry_number",
): Promise<string | null> {
  try {
    const supabase = createSupabaseServiceClient();
    const { data, error } = await supabase.rpc(fn);
    if (error || data == null) {
      throw error ?? new Error("empty sequence value");
    }
    return String(data);
  } catch (error) {
    console.error(`[reference] ${fn} failed — using random fallback`, error);
    return null;
  }
}

const randomSuffix = () => randomBytes(3).toString("hex").toUpperCase();

export async function nextOrderReference(): Promise<string> {
  const n = await nextSequence("next_order_number");
  return `BB-ORD-${n ?? randomSuffix()}`;
}

export async function nextInquiryReference(): Promise<string> {
  const n = await nextSequence("next_inquiry_number");
  return `BB-INQ-${n ?? randomSuffix()}`;
}
