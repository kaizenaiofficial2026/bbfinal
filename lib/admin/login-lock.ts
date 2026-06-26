import "server-only";

import { ADMIN_LOGIN_LOCK_TTL_MINUTES } from "@/lib/admin/constants";
import {
  canUseSupabaseService,
  createSupabaseServiceClient,
} from "@/lib/supabase/service";

function lockExpiresAt() {
  return new Date(
    Date.now() + ADMIN_LOGIN_LOCK_TTL_MINUTES * 60 * 1000,
  ).toISOString();
}

export async function acquireAdminLoginLock(
  userId: string,
  email: string,
): Promise<boolean> {
  if (!canUseSupabaseService()) {
    return true;
  }

  try {
    const service = createSupabaseServiceClient();
    const { data, error } = await service.rpc("acquire_admin_login_lock", {
      p_user_id: userId,
      p_email: email.toLowerCase(),
      p_expires_at: lockExpiresAt(),
    });

    if (error) {
      console.error("[admin-login-lock] acquire failed", error);
      return true;
    }

    return data !== false;
  } catch (error) {
    console.error("[admin-login-lock] acquire failed", error);
    return true;
  }
}

export async function refreshAdminLoginLock(userId: string, email: string) {
  await acquireAdminLoginLock(userId, email);
}

export async function releaseAdminLoginLock(userId: string) {
  if (!canUseSupabaseService()) {
    return;
  }

  try {
    const service = createSupabaseServiceClient();
    const { error } = await service
      .from("admin_login_lock")
      .delete()
      .eq("user_id", userId);

    if (error) {
      console.error("[admin-login-lock] release failed", error);
    }
  } catch (error) {
    console.error("[admin-login-lock] release failed", error);
  }
}
