import "server-only";

import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { createBookings } from "@/lib/data/bookings";
import { nextOrderReference } from "@/lib/data/reference-numbers";
import {
  createMpgsOrderId,
  createPayToken,
  createPayTokenExpiry,
} from "@/lib/payments/tokens";

/**
 * An order is a single payment covering one OR MANY bookings. Both the single
 * "Book & pay" flow and the multi-package cart checkout create an order through
 * `createOrder`, so the downstream pay/reconcile/receipt pipeline is uniform.
 * Amounts and currency are ALWAYS re-derived from the packages server-side — the
 * client-supplied amounts are never trusted.
 */

export type OrderItemInput = {
  tourPackageId: string;
  travelDates: string;
  travellers: number;
  notes?: string | null;
};

export type OrderCustomer = {
  userId: string;
  fullName: string;
  email: string;
  phone: string | null;
};

export type CreateOrderResult =
  | {
      ok: true;
      token: string;
      reference: string;
      total: number;
      currency: string;
      itemCount: number;
    }
  | {
      ok: false;
      reason: "empty" | "not-available" | "mixed-currency" | "error";
    };

type PackageRow = {
  id: string;
  title: string;
  price_amount: number | null;
  currency: string;
  status: string;
};

export async function createOrder(input: {
  customer: OrderCustomer;
  items: OrderItemInput[];
  ipHash?: string | null;
}): Promise<CreateOrderResult> {
  const { customer, items } = input;
  if (items.length === 0) {
    return { ok: false, reason: "empty" };
  }

  const supabase = createSupabaseServiceClient();

  // Re-price every item server-side. Look packages up by id, then resolve each
  // item to its package so a bad/duplicate id can't smuggle in a wrong price.
  const ids = Array.from(new Set(items.map((i) => i.tourPackageId)));
  const { data: pkgData, error: pkgErr } = await supabase
    .from("tour_packages")
    .select("id, title, price_amount, currency, status")
    .in("id", ids);
  if (pkgErr) {
    console.error("[createOrder] package lookup failed", pkgErr);
    return { ok: false, reason: "error" };
  }
  const byId = new Map<string, PackageRow>(
    (pkgData as PackageRow[]).map((p) => [p.id, p]),
  );

  const resolved: { pkg: PackageRow; item: OrderItemInput }[] = [];
  for (const item of items) {
    const pkg = byId.get(item.tourPackageId);
    if (!pkg || pkg.status !== "published" || pkg.price_amount == null) {
      return { ok: false, reason: "not-available" };
    }
    resolved.push({ pkg, item });
  }

  // One MPGS transaction charges a single currency — reject a mixed-currency cart.
  const currency = resolved[0].pkg.currency;
  if (resolved.some((r) => r.pkg.currency !== currency)) {
    return { ok: false, reason: "mixed-currency" };
  }

  const total = resolved.reduce((sum, r) => sum + Number(r.pkg.price_amount), 0);
  const reference = await nextOrderReference();
  const token = createPayToken();

  try {
    // The payment IS the order. It's created first (booking_id stays null — the
    // bookings reference the payment via payment_id).
    const { data: payment, error: payErr } = await supabase
      .from("payments")
      .insert({
        reference,
        amount: total,
        currency,
        status: "initiated",
        pay_token: token,
        mpgs_order_id: createMpgsOrderId(reference),
        pay_token_expires_at: createPayTokenExpiry(),
      })
      .select("id")
      .single();
    if (payErr || !payment) {
      console.error("[createOrder] payment insert failed", payErr);
      return { ok: false, reason: "error" };
    }

    const multi = resolved.length > 1;
    await createBookings(
      resolved.map(({ pkg, item }, index) => ({
        // Single-item orders keep the plain BB-ORD-#### reference; multi-item
        // orders suffix each booking (the reference column is UNIQUE).
        reference: multi ? `${reference}-${index + 1}` : reference,
        tour_package_id: pkg.id,
        user_id: customer.userId,
        traveller_name: customer.fullName,
        email: customer.email,
        phone: customer.phone,
        travel_dates: item.travelDates,
        travellers: item.travellers,
        notes: item.notes || null,
        status: "awaiting_payment",
        quoted_amount: pkg.price_amount,
        currency: pkg.currency,
        ip_hash: input.ipHash ?? null,
        payment_id: payment.id as string,
      })),
    );

    return {
      ok: true,
      token,
      reference,
      total,
      currency,
      itemCount: resolved.length,
    };
  } catch (error) {
    console.error("[createOrder] failed", error);
    return { ok: false, reason: "error" };
  }
}
