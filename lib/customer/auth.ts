import "server-only";

import { getLocale } from "next-intl/server";
import { localeRedirect } from "@/lib/i18n/redirect";
import {
  canUseSupabaseServer,
  createSupabaseServerClient,
} from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

export type CustomerRow = Database["public"]["Tables"]["customers"]["Row"];

export type CustomerSession = {
  user: { id: string; email: string };
  customer: CustomerRow;
};

function loginRedirect(nextPath?: string) {
  return nextPath ? `/login?next=${encodeURIComponent(nextPath)}` : "/login";
}

/**
 * Resolve the current customer session, or null. Mirrors getAdminUser() but
 * reads the `customers` table (RLS "Customers read own profile" allows a signed-
 * in user to read their own row). Staff/admins have no customers row, so they
 * resolve to null here and continue through the admin flow instead.
 */
export async function getCustomerUser(): Promise<CustomerSession | null> {
  if (!canUseSupabaseServer()) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return null;
  }

  const { data: customer } = await supabase
    .from("customers")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (!customer) {
    return null;
  }

  // Staff can deactivate a login; treat a deactivated customer as signed out so
  // every gated page (and the header) drops them. (Pre-migration the column is
  // absent → undefined → treated as active.)
  if (customer.active === false) {
    return null;
  }

  return { user: { id: user.id, email: user.email }, customer };
}

/** Require any signed-in customer; otherwise redirect to /login (preserving intent). */
export async function requireCustomer(nextPath?: string) {
  const session = await getCustomerUser();

  if (!session) {
    localeRedirect(loginRedirect(nextPath), await getLocale());
  }

  return session;
}

/**
 * Require a signed-in AND admin-verified customer. Unauthenticated → /login;
 * authenticated but not yet approved → /account (the pending-verification page).
 */
export async function requireVerifiedCustomer(nextPath?: string) {
  const session = await getCustomerUser();

  if (!session) {
    localeRedirect(loginRedirect(nextPath), await getLocale());
  }

  if (!session.customer.verified) {
    localeRedirect("/account", await getLocale());
  }

  return session;
}
