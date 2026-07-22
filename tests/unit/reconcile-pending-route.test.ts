import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * The scheduled safety net for payments that were captured but never finalised
 * (webhook misfired AND the customer closed the tab). Two things must hold: it
 * cannot be open to the internet, and one bad order cannot abort the batch.
 */

const listStalePendingPayments = vi.fn();
const reconcilePayment = vi.fn();
let paymentsEnabled = true;

vi.mock("@/lib/data/payments", () => ({
  listStalePendingPayments: (...args: unknown[]) =>
    listStalePendingPayments(...args),
  orderReference: (p: { reference?: string }) => p.reference ?? "",
}));

vi.mock("@/lib/payments/reconcile", () => ({
  reconcilePayment: (...args: unknown[]) => reconcilePayment(...args),
}));

vi.mock("@/lib/env", () => ({
  get env() {
    return { paymentsEnabled };
  },
}));

import { GET } from "@/app/api/payments/reconcile-pending/route";

const makePayment = (id: string) => ({
  id,
  reference: `BB-ORD-${id}`,
  bookings: [{ id: `book-${id}` }],
});

const call = (secret?: string) =>
  GET(
    new Request("https://example.com/api/payments/reconcile-pending", {
      headers: secret ? { authorization: `Bearer ${secret}` } : {},
    }),
  );

beforeEach(() => {
  listStalePendingPayments.mockReset().mockResolvedValue([]);
  reconcilePayment.mockReset();
  paymentsEnabled = true;
  process.env.CRON_SECRET = "s3cret-value";
});

afterEach(() => {
  delete process.env.CRON_SECRET;
});

describe("reconcile-pending cron route", () => {
  it("rejects a request with no credentials", async () => {
    const res = await call();
    expect(res.status).toBe(401);
    expect(listStalePendingPayments).not.toHaveBeenCalled();
  });

  it("rejects a wrong secret", async () => {
    const res = await call("not-the-secret");
    expect(res.status).toBe(401);
    expect(listStalePendingPayments).not.toHaveBeenCalled();
  });

  /**
   * Fail CLOSED: if CRON_SECRET is missing the endpoint must not become public.
   */
  it("stays locked when CRON_SECRET is not configured", async () => {
    delete process.env.CRON_SECRET;
    const res = await call("anything");
    expect(res.status).toBe(401);
    expect(listStalePendingPayments).not.toHaveBeenCalled();
  });

  it("finalises a payment the gateway confirms was captured", async () => {
    listStalePendingPayments.mockResolvedValue([makePayment("1")]);
    reconcilePayment.mockResolvedValue({ captured: true });

    const res = await call("s3cret-value");
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toMatchObject({ checked: 1, captured: 1, failed: 0 });
  });

  it("keeps going when one payment throws, instead of dropping the batch", async () => {
    listStalePendingPayments.mockResolvedValue([
      makePayment("1"),
      makePayment("2"),
      makePayment("3"),
    ]);
    reconcilePayment
      .mockResolvedValueOnce({ captured: true })
      .mockRejectedValueOnce(new Error("gateway timeout"))
      .mockResolvedValueOnce({ captured: false });

    const res = await call("s3cret-value");
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(reconcilePayment).toHaveBeenCalledTimes(3);
    expect(body).toMatchObject({
      checked: 3,
      captured: 1,
      stillPending: 1,
      failed: 1,
    });
  });

  it("does nothing while payments are disabled", async () => {
    paymentsEnabled = false;
    const res = await call("s3cret-value");

    expect(res.status).toBe(200);
    expect(listStalePendingPayments).not.toHaveBeenCalled();
  });
});
