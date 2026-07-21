import "server-only";

import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Server-side cart persistence. The cart used to live in one browser's
 * localStorage, so a customer who added packages on their phone saw an empty
 * cart on their laptop. It now lives in `public.carts`, one row per customer,
 * guarded by RLS (`user_id = auth.uid()`).
 *
 * Cart lines are DRAFTS, never a pricing source: `createOrder` re-resolves every
 * package by id and re-prices server-side, so a tampered `amount` here changes
 * nothing about what gets charged. The schema below exists to keep junk out of
 * the column, not to secure the price.
 */

const cartItemSchema = z.object({
  lineId: z.string().min(1).max(64),
  packageId: z.uuid(),
  slug: z.string().min(1).max(160),
  title: z.string().min(1).max(200),
  image: z.string().max(500).optional(),
  currency: z.string().min(3).max(3),
  amount: z.number().nonnegative(),
  travelDates: z.string().max(160),
  travellers: z.coerce.number().int().min(1).max(50),
  notes: z.string().max(2000).optional(),
});

export type StoredCartItem = z.infer<typeof cartItemSchema>;

// Same ceiling the checkout enforces on an order.
const cartSchema = z.array(cartItemSchema).max(20);

/** Parse whatever is in the column, dropping anything malformed. */
export function parseCartItems(value: unknown): StoredCartItem[] {
  const parsed = cartSchema.safeParse(value);
  if (parsed.success) return parsed.data;
  // A partially-bad cart shouldn't wipe the good lines.
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    const line = cartItemSchema.safeParse(item);
    return line.success ? [line.data] : [];
  });
}

/**
 * The signed-in customer's cart.
 *
 * `hasRow` distinguishes "this customer has a saved cart that happens to be
 * empty" from "this customer has never saved one". The caller needs that to
 * decide whether the server or the browser is authoritative — without it, a cart
 * emptied on another device is indistinguishable from a first-ever sync, and the
 * browser's stale copy would resurrect removed (or already-paid-for) items.
 */
export async function readCart(
  userId: string,
): Promise<{ items: StoredCartItem[]; hasRow: boolean }> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("carts")
    .select("items")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) return { items: [], hasRow: false };
  return { items: parseCartItems(data.items), hasRow: true };
}

/** Overwrite the customer's cart. Returns the items actually stored. */
export async function writeCart(
  userId: string,
  items: unknown,
): Promise<StoredCartItem[]> {
  const clean = parseCartItems(items);
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("carts")
    .upsert(
      { user_id: userId, items: clean, updated_at: new Date().toISOString() },
      { onConflict: "user_id" },
    );

  if (error) {
    throw new Error(error.message);
  }
  return clean;
}
