import "server-only";

import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

export type BookingRow = Database["public"]["Tables"]["bookings"]["Row"];
export type BookingWithPackage = BookingRow & {
  tour_packages?: {
    title: string;
    slug: string;
    image: string;
  } | null;
};

export async function createBooking(
  booking: Database["public"]["Tables"]["bookings"]["Insert"],
) {
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("bookings")
    .insert(booking)
    .select("*, tour_packages(title, slug, image)")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as BookingWithPackage;
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
    throw new Error(error.message);
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
    throw new Error(error.message);
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
    throw new Error(error.message);
  }

  return data as BookingWithPackage | null;
}
