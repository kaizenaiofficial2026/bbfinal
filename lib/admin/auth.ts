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
