import "server-only";

import { dbError } from "@/lib/data/errors";

import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

export type PaymentRow = Database["public"]["Tables"]["payments"]["Row"];

// One booking within an order (a payment can cover several).
export type OrderBooking = {
  id: string;
  reference: string;
  /** Owning customer, so the invoice can pull their billing details. */
  user_id: string | null;
  traveller_name: string;
  email: string;
  phone: string | null;
  travel_dates: string;
  travellers: number;
  notes: string | null;
  status: string;
  quoted_amount: number | null;
  currency: string;
  tour_packages?: {
    title: string;
  } | null;
};

// A payment (the order) with the bookings it covers. `reference` is the order
// reference (BB-ORD-####); both it and `bookings` are added by the order model
// and aren't in the generated Database type yet.
export type PaymentWithBookings = PaymentRow & {
  reference?: string | null;
  bookings?: OrderBooking[];
};

// Kept as an alias so existing imports don't break; the shape is now multi-booking.
export type PaymentWithBooking = PaymentWithBookings;

// Embed the bookings via the bookings.payment_id FK (the reverse relationship),
// which returns an ARRAY — a payment can cover many bookings. The explicit FK name
// disambiguates from the legacy payments.booking_id forward relationship.
const ORDER_SELECT =
  "*, bookings:bookings!bookings_payment_id_fkey(id, reference, user_id, traveller_name, email, phone, travel_dates, travellers, notes, status, quoted_amount, currency, tour_packages(title))";

/** The order reference (BB-ORD-####) for a payment. */
export function orderReference(payment: PaymentWithBookings): string {
  return payment.reference ?? payment.bookings?.[0]?.reference ?? "";
}

export async function getPaymentByToken(token: string) {
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("payments")
    .select(ORDER_SELECT)
    .eq("pay_token", token)
    .maybeSingle();

  if (error) {
    dbError(error);
  }

  return data as PaymentWithBookings | null;
}

/**
 * Payments that were started but never reached a terminal state.
 *
 * Reconciliation normally happens on the MPGS webhook, or when the customer
 * lands back on the result page. If the webhook misfires AND the customer closes
 * the tab, the money is captured but the order stays `pending` forever — no
 * receipt, and nothing retrying. The scheduled job re-checks these against the
 * gateway so a captured payment can't be lost.
 *
 * `olderThanMinutes` skips in-flight checkouts, which are legitimately pending
 * while the customer is still on the card page.
 */
export async function listStalePendingPayments(options?: {
  olderThanMinutes?: number;
  limit?: number;
}) {
  const olderThanMinutes = options?.olderThanMinutes ?? 15;
  const limit = options?.limit ?? 25;
  const cutoff = new Date(Date.now() - olderThanMinutes * 60_000).toISOString();

  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("payments")
    .select(ORDER_SELECT)
    .in("status", ["pending", "initiated"])
    .lt("created_at", cutoff)
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) {
    dbError(error);
  }

  return (data ?? []) as PaymentWithBookings[];
}

export async function getPaymentByOrderId(orderId: string) {
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("payments")
    .select(ORDER_SELECT)
    .eq("mpgs_order_id", orderId)
    .maybeSingle();

  if (error) {
    dbError(error);
  }

  return data as PaymentWithBookings | null;
}

/** The payment (order) covering a given booking, with all its sibling bookings. */
export async function getPaymentById(paymentId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("payments")
    .select(ORDER_SELECT)
    .eq("id", paymentId)
    .maybeSingle();

  if (error) {
    dbError(error);
  }

  return data as PaymentWithBookings | null;
}
