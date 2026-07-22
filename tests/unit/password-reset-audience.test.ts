import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Admin password resets are deliberately mailed to ADMIN_SECURITY_INBOX rather
 * than the account's own mailbox. Two ways that control used to be bypassable:
 *
 *  1. The public /forgot-password form issued a working code for a STAFF
 *     account and mailed it to that admin's own inbox.
 *  2. The code lookup didn't filter on `audience`, so a code minted by one flow
 *     could be redeemed through the other's form.
 */

const insert = vi.fn(async () => ({ error: null }));
const sendPasswordResetEmail = vi.fn(async () => {});
let profileRow: { id: string } | null = null;
const capturedFilters: Record<string, unknown> = {};

vi.mock("@/lib/supabase/service", () => ({
  canUseSupabaseService: () => true,
  createSupabaseServiceClient: () => ({
    auth: {
      admin: {
        listUsers: async () => ({
          data: {
            users: [{ id: "staff-1", email: "reservations@beyondborders.lk" }],
          },
          error: null,
        }),
      },
    },
    from: (table: string) => {
      if (table === "profiles") {
        const b: Record<string, unknown> = {
          select: () => b,
          eq: () => b,
          maybeSingle: async () => ({ data: profileRow, error: null }),
        };
        return b;
      }
      // `customers` (resolveAuthUser's first lookup) and password_reset_codes.
      const b: Record<string, unknown> = {
        select: () => b,
        insert,
        update: () => b,
        eq: (col: string, val: unknown) => {
          capturedFilters[col] = val;
          return b;
        },
        // resolveAuthUser probes `customers` with .ilike().limit() before
        // falling back to listUsers; without this the chain throws and the
        // whole call bails silently.
        ilike: () => b,
        is: () => b,
        order: () => b,
        limit: async () => ({ data: [], error: null }),
      };
      return b;
    },
  }),
}));

vi.mock("@/lib/email/send", () => ({
  sendPasswordResetEmail: (...a: unknown[]) => sendPasswordResetEmail(...a),
}));

vi.mock("@/lib/env", () => ({
  env: { adminAllowedEmails: ["reservations@beyondborders.lk"] },
}));

import { createAndSendResetCode, verifyAndReset } from "@/lib/auth/password-reset";

beforeEach(() => {
  insert.mockClear();
  sendPasswordResetEmail.mockClear();
  profileRow = null;
  for (const k of Object.keys(capturedFilters)) delete capturedFilters[k];
});

describe("password reset — staff accounts", () => {
  it("refuses to issue a customer-flow code for a STAFF account", async () => {
    profileRow = { id: "staff-1" }; // this account has a staff profile

    await createAndSendResetCode({
      email: "reservations@beyondborders.lk",
      audience: "customer",
      resetUrl: "https://example.com/reset",
    });

    expect(insert).not.toHaveBeenCalled();
    expect(sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it("still issues a customer-flow code for a normal customer", async () => {
    profileRow = null; // no staff profile

    await createAndSendResetCode({
      email: "reservations@beyondborders.lk",
      audience: "customer",
      resetUrl: "https://example.com/reset",
    });

    expect(insert).toHaveBeenCalledTimes(1);
    expect(sendPasswordResetEmail).toHaveBeenCalledTimes(1);
  });
});

describe("password reset — code lookup", () => {
  it("scopes the code lookup to the audience that issued it", async () => {
    await verifyAndReset({
      email: "someone@example.com",
      code: "123456",
      newPassword: "a-very-long-password",
      audience: "customer",
    });

    expect(capturedFilters.audience).toBe("customer");
  });
});
