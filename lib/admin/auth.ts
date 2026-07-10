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
    .select("role, active")
    .eq("id", user.id)
    .maybeSingle();

  if (profile) {
    // A deactivated admin is denied everywhere — this blocks their login and
    // kicks any live session on the next request (requireAdmin → null → login).
    if (profile.role === "admin" && profile.active !== false) {
      return user;
    }
    return null;
  }

  // No profile row yet: allowlisted staff bootstrap themselves (active defaults
  // to true). A deactivated admin already has a row, so is denied above and can
  // never re-activate through this path.
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

export type AdminAccount = {
  id: string;
  email: string | null;
  fullName: string | null;
  active: boolean;
  /** Super admins can't be deactivated. */
  isSuper: boolean;
};

/**
 * List the staff accounts (role='admin' in `profiles`) with their email and tier,
 * for the super-admin "Admins" management screen. Uses the service client to read
 * profiles and resolve emails from auth.users (there are only a handful of admins).
 */
export async function listAdmins(): Promise<AdminAccount[]> {
  if (!canUseSupabaseService()) {
    return [];
  }

  const service = createSupabaseServiceClient();
  const { data: profiles } = await service
    .from("profiles")
    .select("id, full_name, active, created_at")
    .eq("role", "admin")
    .order("created_at", { ascending: true });

  if (!profiles) {
    return [];
  }

  return Promise.all(
    profiles.map(async (profile) => {
      const { data } = await service.auth.admin.getUserById(profile.id);
      const email = data.user?.email ?? null;
      return {
        id: profile.id,
        email,
        fullName: profile.full_name,
        active: profile.active,
        isSuper: isSuperAdminEmail(email),
      };
    }),
  );
}

/**
 * Whether the acting super admin may (de)activate a target admin. A super admin
 * may only toggle a SECOND-LEVEL admin, never a super admin and never themselves —
 * this makes it impossible to lock all super admins out of the panel.
 */
export function canToggleAdminActive(params: {
  actingUserId: string;
  target: Pick<AdminAccount, "id" | "isSuper">;
}): boolean {
  if (params.target.id === params.actingUserId) return false;
  if (params.target.isSuper) return false;
  return true;
}
