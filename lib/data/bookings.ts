import "server-only";

import { dbError } from "@/lib/data/errors";

import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

export type BookingRow = Database["public"]["Tables"]["bookings"]["Row"];

// The payment (order) a booking belongs to. A payment can cover several bookings,
// so this is what we group by when presenting orders to an admin.
export type BookingPayment = {
  id: string;
  reference: string | null;
  amount: number;
  currency: string;
  status: string;
} | null;

export type BookingWithPackage = BookingRow & {
  // Link to the payment (order) covering this booking — not in the generated type.
  payment_id?: string | null;
  payment?: BookingPayment;
  tour_packages?: {
    title: string;
    slug: string;
    image: string;
  } | null;
};

// A group of bookings paid together (one payment = one order). Single-package
// purchases are just an order with one item.
export type AdminOrder = {
  key: string;
  reference: string;
  bookingId: string;
  travellerName: string;
  createdAt: string;
  status: string;
  itemCount: number;
  amount: number | null;
  currency: string;
  titles: string[];
};

// Group booking rows into orders by their payment_id (falling back to the booking
// id for legacy rows with no payment). Order is preserved from the input, so a
// created_at-desc list stays newest-first.
export function groupAdminOrders(bookings: BookingWithPackage[]): AdminOrder[] {
  const map = new Map<string, AdminOrder>();
  for (const b of bookings) {
    const key = b.payment_id ?? b.id;
    const title = b.tour_packages?.title ?? "Package";
    const existing = map.get(key);
    if (existing) {
      existing.itemCount += 1;
      existing.titles.push(title);
      // A single unpaid item leaves the whole order unpaid.
      if (b.status !== "paid") existing.status = b.status;
      if (existing.amount == null && b.quoted_amount != null) {
        existing.amount = (existing.amount ?? 0) + b.quoted_amount;
      }
    } else {
      map.set(key, {
        key,
        reference: b.payment?.reference ?? b.reference,
        bookingId: b.id,
        travellerName: b.traveller_name,
        createdAt: b.created_at,
        status: b.status,
        itemCount: 1,
        // Prefer the authoritative order total on the payment; fall back to the
        // booking's quoted amount for legacy rows without a linked payment.
        amount: b.payment?.amount ?? b.quoted_amount ?? null,
        currency: b.payment?.currency ?? b.currency,
        titles: [title],
      });
    }
  }
  return Array.from(map.values());
}

// A booking to create as part of an order. Loosely typed (the service client is
// untyped) so it can carry `payment_id`, which links the booking to the payment
// (order) covering it — a column the generated Database type doesn't include yet.
export type BookingInsert = {
  reference: string;
  tour_package_id: string;
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
  ip_hash: string | null;
  payment_id?: string;
};

export async function createBooking(booking: BookingInsert) {
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("bookings")
    .insert(booking)
    .select("*, tour_packages(title, slug, image)")
    .single();

  if (error) {
    dbError(error);
  }

  return data as BookingWithPackage;
}

/** Insert several bookings at once (a multi-package order). */
export async function createBookings(rows: BookingInsert[]) {
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("bookings")
    .insert(rows)
    .select("*, tour_packages(title, slug, image)");

  if (error) {
    dbError(error);
  }

  return (data ?? []) as BookingWithPackage[];
}

export async function countRecentBookingsByIp(ipHash: string | null) {
  if (!ipHash) {
    return 0;
  }

  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const supabase = createSupabaseServiceClient();
  const { count, error } = await supabase
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .eq("ip_hash", ipHash)
    .gte("created_at", since);

  if (error) {
    dbError(error);
  }

  return count ?? 0;
}

export async function listBookings() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("bookings")
    .select(
      "*, tour_packages(title, slug, image), payment:payments!bookings_payment_id_fkey(id, reference, amount, currency, status)",
    )
    .order("created_at", { ascending: false });

  if (error) {
    dbError(error);
  }

  return data as BookingWithPackage[];
}

export async function getBooking(id: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("bookings")
    .select("*, tour_packages(title, slug, image)")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    dbError(error);
  }

  return data as BookingWithPackage | null;
}
