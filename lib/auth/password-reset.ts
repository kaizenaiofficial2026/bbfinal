import "server-only";

import { createHash, randomInt, timingSafeEqual } from "crypto";
import { env } from "@/lib/env";
import { isExpired } from "@/lib/security/request";
import {
  canUseSupabaseService,
  createSupabaseServiceClient,
} from "@/lib/supabase/service";
import { sendPasswordResetEmail } from "@/lib/email/send";
import { ADMIN_SECURITY_INBOX } from "@/lib/admin/constants";

/**
 * Shared core for the customer + admin "forgot password" flow.
 *
 * A 6-digit code is emailed to the user; only its salted SHA-256 hash is stored
 * (table `password_reset_codes`). Verification updates the password through the
 * service-role admin API (`auth.admin.updateUserById`), so it works regardless
 * of Supabase email-confirmation settings and the app's custom SMTP. To avoid
 * account enumeration, the request step is always silent about whether an
 * account exists.
 */

export type ResetAudience = "customer" | "admin";

const OTP_TTL_MINUTES = 15;
const MAX_VERIFY_ATTEMPTS = 5;
const USER_PAGE_SIZE = 200;
const MAX_USER_PAGES = 25;

function hashCode(code: string, email: string) {
  return createHash("sha256")
    .update(
      `${code}:${email.toLowerCase()}:${process.env.SUPABASE_SERVICE_ROLE_KEY ?? "local"}`,
    )
    .digest("hex");
}

function safeEqualHex(a: string, b: string) {
  const ab = Buffer.from(a, "hex");
  const bb = Buffer.from(b, "hex");
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

function generateCode() {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

type ServiceClient = ReturnType<typeof createSupabaseServiceClient>;

/**
 * Resolve an email to its auth user. Customers live in the `customers` table
 * (fast path); everyone else (admins) is found by paging the auth admin API.
 */
async function resolveAuthUser(
  service: ServiceClient,
  email: string,
): Promise<{ id: string; email: string } | null> {
  const lower = email.toLowerCase();

  const { data: customer } = await service
    .from("customers")
    .select("id, email")
    .ilike("email", lower)
    .limit(1);
  const match = customer?.[0];
  if (match?.id) {
    return { id: match.id as string, email: (match.email as string) ?? lower };
  }

  for (let page = 1; page <= MAX_USER_PAGES; page += 1) {
    const { data, error } = await service.auth.admin.listUsers({
      page,
      perPage: USER_PAGE_SIZE,
    });
    if (error || !data?.users?.length) {
      return null;
    }
    const found = data.users.find((u) => u.email?.toLowerCase() === lower);
    if (found?.email) {
      return { id: found.id, email: found.email };
    }
    if (data.users.length < USER_PAGE_SIZE) {
      return null;
    }
  }
  return null;
}

/**
 * Generate + store a reset code and email it. Silent (resolves to void) when no
 * account matches or the email isn't an allowed admin, so callers can show the
 * same "if an account exists, we sent a code" message either way.
 */
export async function createAndSendResetCode({
  email,
  audience,
  resetUrl,
}: {
  email: string;
  audience: ResetAudience;
  resetUrl: string;
}): Promise<void> {
  try {
    if (!canUseSupabaseService()) {
      return;
    }
    const lower = email.toLowerCase();

    // Admin reset/change codes are only issued for allowlisted staff accounts,
    // but the email containing the code always goes to the reservations inbox.
    if (audience === "admin" && !env.adminAllowedEmails.includes(lower)) {
      return;
    }

    const service = createSupabaseServiceClient();
    const user = await resolveAuthUser(service, lower);
    if (!user) {
      return;
    }

    const code = generateCode();
    const expiresAt = new Date(
      Date.now() + OTP_TTL_MINUTES * 60 * 1000,
    ).toISOString();

    // Invalidate any earlier unused codes so only the newest one works.
    await service
      .from("password_reset_codes")
      .update({ consumed_at: new Date().toISOString() })
      .eq("email", lower)
      .is("consumed_at", null);

    const { error } = await service.from("password_reset_codes").insert({
      email: lower,
      user_id: user.id,
      audience,
      code_hash: hashCode(code, lower),
      expires_at: expiresAt,
      attempts: 0,
    });
    if (error) {
      console.error("[password-reset] could not store code", error);
      return;
    }

    await sendPasswordResetEmail({
      email: audience === "admin" ? ADMIN_SECURITY_INBOX : user.email,
      accountEmail: audience === "admin" ? user.email : undefined,
      code,
      resetUrl,
      ttlMinutes: OTP_TTL_MINUTES,
    });
  } catch (error) {
    // Never surface internals to the caller (avoids enumeration + leaks).
    console.error("[password-reset] request failed", error);
  }
}

export type ResetResult =
  | { ok: true }
  | { ok: false; reason: "invalid" | "expired" | "too_many" | "server" };

/**
 * Verify a submitted code and, on success, set the new password. The code check
 * gates the password change: the password is only applied after the emailed
 * code matches an active, unexpired, single-use record.
 */
export async function verifyAndReset({
  email,
  code,
  newPassword,
  audience,
}: {
  email: string;
  code: string;
  newPassword: string;
  audience: ResetAudience;
}): Promise<ResetResult> {
  try {
    if (!canUseSupabaseService()) {
      return { ok: false, reason: "server" };
    }
    const lower = email.toLowerCase();

    if (audience === "admin" && !env.adminAllowedEmails.includes(lower)) {
      return { ok: false, reason: "invalid" };
    }

    const service = createSupabaseServiceClient();
    const { data: rows, error } = await service
      .from("password_reset_codes")
      .select("id, user_id, code_hash, expires_at, attempts")
      .eq("email", lower)
      .is("consumed_at", null)
      .order("created_at", { ascending: false })
      .limit(1);

    if (error) {
      console.error("[password-reset] lookup failed", error);
      return { ok: false, reason: "server" };
    }

    const row = rows?.[0];
    if (!row) {
      return { ok: false, reason: "invalid" };
    }
    if ((row.attempts as number) >= MAX_VERIFY_ATTEMPTS) {
      return { ok: false, reason: "too_many" };
    }
    if (isExpired(row.expires_at as string)) {
      return { ok: false, reason: "expired" };
    }

    if (!safeEqualHex(row.code_hash as string, hashCode(code, lower))) {
      await service
        .from("password_reset_codes")
        .update({ attempts: (row.attempts as number) + 1 })
        .eq("id", row.id as string);
      return { ok: false, reason: "invalid" };
    }

    const { error: updateError } = await service.auth.admin.updateUserById(
      row.user_id as string,
      { password: newPassword },
    );
    if (updateError) {
      console.error("[password-reset] password update failed", updateError);
      return { ok: false, reason: "server" };
    }

    // Burn this and any sibling codes for the email.
    await service
      .from("password_reset_codes")
      .update({ consumed_at: new Date().toISOString() })
      .eq("email", lower)
      .is("consumed_at", null);

    return { ok: true };
  } catch (error) {
    console.error("[password-reset] verify failed", error);
    return { ok: false, reason: "server" };
  }
}
