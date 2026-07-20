"use server";

import { getCustomerUser } from "@/lib/customer/auth";
import { readCart, writeCart, type StoredCartItem } from "@/lib/data/carts";

/**
 * Cart persistence actions. The cart is a signed-in-only feature, so every
 * action resolves the caller from their session — the user id is NEVER taken
 * from the client, and RLS enforces the same rule at the database.
 *
 * Both actions fail SOFT: the cart is a convenience, and a hiccup writing it
 * must not break the page the customer is on. The local store stays the source
 * of truth for the current tab either way.
 */

export async function loadCartAction(): Promise<StoredCartItem[]> {
  const session = await getCustomerUser();
  if (!session) return [];
  try {
    return await readCart(session.user.id);
  } catch {
    return [];
  }
}

export async function saveCartAction(
  items: unknown,
): Promise<{ ok: boolean; items: StoredCartItem[] }> {
  const session = await getCustomerUser();
  if (!session) return { ok: false, items: [] };
  try {
    const saved = await writeCart(session.user.id, items);
    return { ok: true, items: saved };
  } catch (error) {
    console.error("[cart save failed]", error);
    return { ok: false, items: [] };
  }
}
