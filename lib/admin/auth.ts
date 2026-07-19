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
 * Dashboard (view), Bookings, Customers, Support panel and Settings. Both tiers
 * are `role = 'admin'` in `profiles` (RLS's `is_admin()` stays the coarse gate;
 * the fine-grained limits are enforced in the app layer: nav filtering + page and
 * action guards).
 *
 * Tier for admins bootstrapped from the env allowlist is config-driven
 * (SUPER_ADMIN_EMAILS). Admins CREATED in the panel can't use config — env vars
 * aren't writable at runtime — so their tier is stamped on the auth user's
 * `app_metadata`, which is writable by the service role ONLY. It deliberately is
 * not `user_metadata`: that is writable by the account holder itself, so a
 * second-level admin could promote themselves to super.
 */
export const ADMIN_TIER_KEY = "admin_tier";

export type AdminTier = "super" | "second";

/** Read an explicit tier stamp off an auth user's app_metadata, if present. */
export function readAdminTier(
  appMetadata: Record<string, unknown> | null | undefined,
): AdminTier | null {
  const value = appMetadata?.[ADMIN_TIER_KEY];
  return value === "super" || value === "second" ? value : null;
}

export function isSuperAdminEmail(email: string | null | undefined): boolean {
  const value = (email ?? "").trim().toLowerCase();
  if (!value) return false;
  // No super list configured → every admin is a super admin (single-tier).
  if (env.superAdminEmails.length === 0) return true;
  return env.superAdminEmails.includes(value);
}

/**
 * Resolve an admin's tier. An explicit stamp always wins; without one we fall
 * back to the env allowlist, so admins that predate panel-created accounts keep
 * exactly the tier they had. The stamp is what stops a created admin from being
 * treated as super when SUPER_ADMIN_EMAILS is empty (which means "everyone is
 * super" for the env path).
 */
export function resolveIsSuperAdmin(params: {
  email: string | null | undefined;
  appMetadata?: Record<string, unknown> | null;
}): boolean {
  const tier = readAdminTier(params.appMetadata);
  if (tier) return tier === "super";
  return isSuperAdminEmail(params.email);
}

export async function getAdminContext() {
  const user = await getAdminUser();
  if (!user) return null;
  return {
    user,
    isSuperAdmin: resolveIsSuperAdmin({
      email: user.email,
      appMetadata: user.app_metadata,
    }),
  };
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
  if (!resolveIsSuperAdmin({ email: user.email, appMetadata: user.app_metadata })) {
    redirect("/admin");
  }
  return user;
}

/** requireAdmin + the caller's tier, for pages that render both tiers. */
export async function requireAdminContext() {
  const user = await requireAdmin();
  return {
    user,
    isSuperAdmin: resolveIsSuperAdmin({
      email: user.email,
      appMetadata: user.app_metadata,
    }),
  };
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
        isSuper: resolveIsSuperAdmin({
          email,
          appMetadata: data.user?.app_metadata,
        }),
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
