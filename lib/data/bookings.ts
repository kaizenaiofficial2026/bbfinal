import "server-only";

import { dbError } from "@/lib/data/errors";

import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

export type BookingRow = Database["public"]["Tables"]["bookings"]["Row"];
export type BookingWithPackage = BookingRow & {
  // Link to the payment (order) covering this booking — not in the generated type.
  payment_id?: string | null;
  tour_packages?: {
    title: string;
    slug: string;
    image: string;
  } | null;
};

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
    .select("*, tour_packages(title, slug, image)")
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
