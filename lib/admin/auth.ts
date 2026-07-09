import "server-only";

import { redirect } from "next/navigation";
import { env } from "@/lib/env";
import {
  canUseSupabaseServer,
  createSupabaseServerClient,
} from "@/lib/supabase/server";
import {
  canUseSupabaseService,
  createSupabaseServiceClient,
} from "@/lib/supabase/service";
import { getAdminSessionId, heartbeatAdminSession } from "@/lib/admin/session";

/**
 * Ensure an allowlisted staff member has a `profiles` row. The app-layer
 * allowlist (ADMIN_ALLOWED_EMAILS) and the database RLS `is_admin()` check
 * must agree: RLS only trusts `profiles`, so without this an allowlisted admin
 * would pass `requireAdmin()` yet read/write nothing through RLS. Bootstrapping
 * the profile here keeps the two in sync. Uses the service client because RLS
 * "Admins manage profiles" would otherwise block the very first insert.
 */
async function ensureAdminProfile(userId: string, fullName: string | null) {
  if (!canUseSupabaseService()) {
    return;
  }

  const service = createSupabaseServiceClient();
  await service
    .from("profiles")
    .upsert({ id: userId, role: "admin", full_name: fullName }, { onConflict: "id" });
}

export async function getAdminUser() {
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

  const email = user.email.toLowerCase();

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role === "admin") {
    return user;
  }

  // Allowlisted staff bootstrap themselves: create the profiles row that RLS
  // `is_admin()` relies on, then authorize for this and all future requests.
  if (env.adminAllowedEmails.includes(email)) {
    const fullName =
      typeof user.user_metadata?.full_name === "string"
        ? user.user_metadata.full_name
        : null;
    await ensureAdminProfile(user.id, fullName);
    return user;
  }

  return null;
}

/**
 * Admin tiers. A SUPER admin has full access; a second-level admin is limited to
 * Dashboard (view), Bookings, Customers, Support panel and Settings. The tier is
 * config-driven (SUPER_ADMIN_EMAILS) rather than stored in the DB, so no schema
 * change is needed — both tiers are `role = 'admin'` in `profiles` (RLS's
 * `is_admin()` stays the coarse gate; the fine-grained limits are enforced in the
 * app layer: nav filtering + page/action guards).
 */
export function isSuperAdminEmail(email: string | null | undefined): boolean {
  const value = (email ?? "").trim().toLowerCase();
  if (!value) return false;
  // No super list configured → every admin is a super admin (single-tier).
  if (env.superAdminEmails.length === 0) return true;
  return env.superAdminEmails.includes(value);
}

export async function getAdminContext() {
  const user = await getAdminUser();
  if (!user) return null;
  return { user, isSuperAdmin: isSuperAdminEmail(user.email) };
}

export async function requireAdmin() {
  const user = await getAdminUser();

  if (!user) {
    redirect("/admin/login");
  }

  // Enforce a single active admin session: heartbeat this browser's session and,
  // if a different session now holds the seat (another admin was allowed in),
  // bounce this one out. Fails open (heartbeat returns true) if unavailable.
  const sid = await getAdminSessionId();
  const isHolder = await heartbeatAdminSession(user.id, sid, user.email ?? "");
  if (!isHolder) {
    redirect("/admin/login?kicked=1");
  }

  return user;
}

/**
 * Guard for SUPER-admin-only areas (Packages, Destinations, Enquiries, Custom
 * enquiries and their write actions). A signed-in second-level admin is sent back
 * to the dashboard rather than shown content they can't manage.
 */
export async function requireSuperAdmin() {
  const user = await requireAdmin();
  if (!isSuperAdminEmail(user.email)) {
    redirect("/admin");
  }
  return user;
}
