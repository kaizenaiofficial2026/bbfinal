/**
 * Test-database harness (against the TEST Supabase). Used by Vitest integration
 * tests and Playwright fixtures/setup. Reads credentials straight from .env so
 * it works in both runners without extra env wiring.
 *
 * All created data uses the `@beyondborders.test` email domain and `qa-` prefix
 * so `cleanupTestData()` can remove it without touching real records.
 */
import { readFileSync } from "node:fs";
import { createHash, randomInt } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

function loadEnv(): Record<string, string> {
  const raw = readFileSync(".env", "utf8");
  return Object.fromEntries(
    raw
      .split("\n")
      .filter((l) => l && !l.trimStart().startsWith("#") && l.includes("="))
      .map((l) => {
        const i = l.indexOf("=");
        return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
      }),
  );
}

const env = loadEnv();

export const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
export const ANON_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
export const SITE_URL = env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const TEST_EMAIL_DOMAIN = "beyondborders.test";
export const TEST_ADMIN = {
  email: "reservations@beyondborders.lk",
  password: env.TEST_ADMIN_PASSWORD || "Password123",
};

export function service(): SupabaseClient {
  return createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false },
  });
}

export function anon(): SupabaseClient {
  return createClient(SUPABASE_URL, ANON_KEY, {
    auth: { persistSession: false },
  });
}

export function testEmail(prefix: string): string {
  return `qa-${prefix}-${Date.now()}-${randomInt(1000, 9999)}@${TEST_EMAIL_DOMAIN}`;
}

/** Mirrors the salted hash in lib/auth/password-reset.ts so tests can seed a
 *  known, valid OTP code. */
export function resetCodeHash(code: string, email: string): string {
  return createHash("sha256")
    .update(`${code}:${email.toLowerCase()}:${SERVICE_KEY ?? "local"}`)
    .digest("hex");
}

export type TestCustomer = {
  id: string;
  email: string;
  password: string;
};

/** Create a real auth user + customers row via the service role. */
export async function createCustomer(opts: {
  verified?: boolean;
  active?: boolean;
  password?: string;
  firstName?: string;
  lastName?: string;
} = {}): Promise<TestCustomer> {
  const sb = service();
  const email = testEmail("cust");
  const password = opts.password ?? "QaCustomer!2026";
  const firstName = opts.firstName ?? "Qa";
  const lastName = opts.lastName ?? "Customer";

  const { data: created, error } = await sb.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: `${firstName} ${lastName}` },
  });
  if (error || !created.user) {
    throw new Error(`createCustomer auth failed: ${error?.message}`);
  }
  const id = created.user.id;

  const { error: rowErr } = await sb.from("customers").upsert(
    {
      id,
      full_name: `${firstName} ${lastName}`,
      first_name: firstName,
      last_name: lastName,
      email,
      phone: "+94 77 000 0000",
      country: "Sri Lanka",
      city: "Colombo",
      date_of_birth: "1990-01-01",
      passport_number: "N0000000",
      passport_expiry: "2032-01-01",
      verified: opts.verified ?? false,
      active: opts.active ?? true,
    },
    { onConflict: "id" },
  );
  if (rowErr) throw new Error(`createCustomer row failed: ${rowErr.message}`);

  return { id, email, password };
}

/** Ensure the allowlisted admin auth user exists with a known password. */
export async function ensureAdmin(): Promise<{ email: string; password: string }> {
  const sb = service();
  const { data } = await sb.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const existing = data?.users.find((u) => u.email === TEST_ADMIN.email);

  if (existing) {
    await sb.auth.admin.updateUserById(existing.id, {
      password: TEST_ADMIN.password,
      // Clear any held single-active-admin seat (user_metadata.admin_session) so
      // the test login is never contested into the waiting screen.
      user_metadata: {
        ...(existing.user_metadata ?? {}),
        admin_session: null,
      },
    });
  } else {
    const { error } = await sb.auth.admin.createUser({
      email: TEST_ADMIN.email,
      password: TEST_ADMIN.password,
      email_confirm: true,
      user_metadata: { full_name: "QA Admin" },
    });
    if (error) throw new Error(`ensureAdmin failed: ${error.message}`);
  }
  return { ...TEST_ADMIN };
}

/** Insert a valid, unconsumed reset code row so the OTP verify path is testable. */
export async function seedResetCode(opts: {
  email: string;
  userId: string;
  code: string;
  audience?: "customer" | "admin";
  ttlMinutes?: number;
}): Promise<void> {
  const sb = service();
  await sb.from("password_reset_codes").insert({
    email: opts.email.toLowerCase(),
    user_id: opts.userId,
    audience: opts.audience ?? "customer",
    code_hash: resetCodeHash(opts.code, opts.email),
    expires_at: new Date(
      Date.now() + (opts.ttlMinutes ?? 15) * 60_000,
    ).toISOString(),
    attempts: 0,
  });
}

/** Remove all test-created records (best-effort, by the qa-…@…test pattern). */
export async function cleanupTestData(): Promise<void> {
  const sb = service();
  const pattern = `qa-%@${TEST_EMAIL_DOMAIN}`;

  const { data: custs } = await sb
    .from("customers")
    .select("id, email")
    .ilike("email", pattern);
  const ids = (custs ?? []).map((c) => c.id as string);

  if (ids.length) {
    await sb.from("bookings").delete().in("user_id", ids);
  }
  await sb.from("password_reset_codes").delete().ilike("email", pattern);
  await sb.from("customers").delete().ilike("email", pattern);

  // Remove the auth users themselves.
  const { data: users } = await sb.auth.admin.listUsers({ page: 1, perPage: 1000 });
  for (const u of users?.users ?? []) {
    if (u.email && u.email.endsWith(`@${TEST_EMAIL_DOMAIN}`)) {
      await sb.auth.admin.deleteUser(u.id);
    }
  }
}
