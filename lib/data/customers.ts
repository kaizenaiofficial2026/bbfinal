import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export type CustomerBilling = {
  passportNumber: string | null;
  passportExpiry: string | null;
  country: string | null;
  city: string | null;
};

/**
 * Billing details for a customer, for surfaces that need more than a booking
 * carries (the receipt's NIC/passport line, invoice address block).
 *
 * Returns null rather than throwing when the customer can't be read — a legacy
 * or guest booking has no `user_id`, and a missing billing line must never take
 * down the page that shows it.
 */
export async function getCustomerBilling(
  userId: string,
): Promise<CustomerBilling | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("customers")
    .select("passport_number, passport_expiry, country, city")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return {
    passportNumber: data.passport_number,
    passportExpiry: data.passport_expiry,
    country: data.country,
    city: data.city,
  };
}
