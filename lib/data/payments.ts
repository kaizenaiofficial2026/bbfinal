import "server-only";

import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

export type PaymentRow = Database["public"]["Tables"]["payments"]["Row"];
export type PaymentWithBooking = PaymentRow & {
  bookings?: {
    id: string;
    reference: string;
    traveller_name: string;
    email: string;
    status: string;
    tour_packages?: {
      title: string;
    } | null;
  } | null;
};

export async function getPaymentByToken(token: string) {
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("payments")
    .select("*, bookings(*, tour_packages(title))")
    .eq("pay_token", token)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as PaymentWithBooking | null;
}

export async function getPaymentByOrderId(orderId: string) {
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("payments")
    .select("*, bookings(*, tour_packages(title))")
    .eq("mpgs_order_id", orderId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as PaymentWithBooking | null;
}

export async function listPaymentsForBooking(bookingId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .eq("booking_id", bookingId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
