import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

// Don't send real email — assert it would be sent, exercise the DB + crypto.
vi.mock("@/lib/email/send", () => ({
  sendPasswordResetEmail: vi.fn(async () => ({ skipped: true })),
}));

import {
  createAndSendResetCode,
  verifyAndReset,
} from "@/lib/auth/password-reset";
import { sendPasswordResetEmail } from "@/lib/email/send";
import {
  anon,
  cleanupTestData,
  createCustomer,
  ensureAdmin,
  seedResetCode,
  service,
  TEST_ADMIN,
} from "../support/db";
import { ADMIN_SECURITY_INBOX } from "@/lib/admin/constants";

let customer: Awaited<ReturnType<typeof createCustomer>>;

beforeAll(async () => {
  customer = await createCustomer({ verified: true });
});

afterAll(async () => {
  await service()
    .from("password_reset_codes")
    .delete()
    .eq("email", TEST_ADMIN.email.toLowerCase());
  await cleanupTestData();
});

describe("password reset core (integration, test DB)", () => {
  it("stores a hashed code and emails it for a real customer", async () => {
    await createAndSendResetCode({
      email: customer.email,
      audience: "customer",
      resetUrl: "http://localhost:3000/reset-password",
    });
    expect(sendPasswordResetEmail).toHaveBeenCalledTimes(1);
    const { count } = await service()
      .from("password_reset_codes")
      .select("id", { count: "exact", head: true })
      .eq("email", customer.email.toLowerCase())
      .is("consumed_at", null);
    expect(count).toBeGreaterThanOrEqual(1);
  });

  it("verifies a valid code and actually changes the password", async () => {
    const c = await createCustomer({ verified: true });
    await seedResetCode({ email: c.email, userId: c.id, code: "246802" });

    const result = await verifyAndReset({
      email: c.email,
      code: "246802",
      newPassword: "NewStrongPass!9",
      audience: "customer",
    });
    expect(result.ok).toBe(true);

    const { error } = await anon().auth.signInWithPassword({
      email: c.email,
      password: "NewStrongPass!9",
    });
    expect(error).toBeNull();
  });

  it("rejects a wrong code and counts the attempt", async () => {
    const c = await createCustomer({ verified: true });
    await seedResetCode({ email: c.email, userId: c.id, code: "111111" });

    const result = await verifyAndReset({
      email: c.email,
      code: "999999",
      newPassword: "irrelevant12",
      audience: "customer",
    });
    expect(result.ok).toBe(false);

    const { data } = await service()
      .from("password_reset_codes")
      .select("attempts")
      .eq("email", c.email.toLowerCase())
      .order("created_at", { ascending: false })
      .limit(1);
    expect(data?.[0]?.attempts).toBe(1);
  });

  it("rejects an expired code", async () => {
    const c = await createCustomer({ verified: true });
    await seedResetCode({
      email: c.email,
      userId: c.id,
      code: "222222",
      ttlMinutes: -5,
    });
    const result = await verifyAndReset({
      email: c.email,
      code: "222222",
      newPassword: "irrelevant12",
      audience: "customer",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("expired");
  });

  it("only issues admin reset codes to allowlisted staff", async () => {
    await ensureAdmin();
    // A non-staff email must be silently ignored (no row created).
    await createAndSendResetCode({
      email: customer.email,
      audience: "admin",
      resetUrl: "x",
    });
    const { count: leaked } = await service()
      .from("password_reset_codes")
      .select("id", { count: "exact", head: true })
      .eq("email", customer.email.toLowerCase())
      .eq("audience", "admin");
    expect(leaked).toBe(0);

    // The allowlisted admin gets a code.
    await createAndSendResetCode({
      email: TEST_ADMIN.email,
      audience: "admin",
      resetUrl: "http://localhost:3000/admin/reset-password",
    });
    expect(sendPasswordResetEmail).toHaveBeenLastCalledWith(
      expect.objectContaining({
        accountEmail: TEST_ADMIN.email,
        email: ADMIN_SECURITY_INBOX,
      }),
    );
    const { count: ok } = await service()
      .from("password_reset_codes")
      .select("id", { count: "exact", head: true })
      .eq("email", TEST_ADMIN.email.toLowerCase());
    expect(ok).toBeGreaterThanOrEqual(1);
  });
});
