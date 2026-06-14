import { beforeEach, describe, expect, it, vi } from "vitest";

const retrieveOrder = vi.fn();
const sendPaymentReceipt = vi.fn();
const maybeSingle = vi.fn();
const bookingsUpdateEq = vi.fn(async () => ({ data: null, error: null }));

vi.mock("@/lib/payments/mpgs", () => ({
  retrieveOrder: (...args: unknown[]) => retrieveOrder(...args),
}));

vi.mock("@/lib/email/send", () => ({
  sendPaymentReceipt: (...args: unknown[]) => sendPaymentReceipt(...args),
}));

vi.mock("@/lib/supabase/service", () => ({
  createSupabaseServiceClient: () => ({
    from: (table: string) => {
      if (table === "payments") {
        const builder = {
          update: () => builder,
          eq: () => builder,
          neq: () => builder,
          select: () => builder,
          maybeSingle,
        };
        return builder;
      }

      // bookings update path: awaited after .eq(...)
      const builder = {
        update: () => builder,
        eq: bookingsUpdateEq,
      };
      return builder;
    },
  }),
}));

import { reconcilePayment } from "@/lib/payments/reconcile";

type TestPayment = Parameters<typeof reconcilePayment>[0];

function makePayment(overrides: Partial<TestPayment> = {}): TestPayment {
  return {
    id: "pay-1",
    booking_id: "book-1",
    mpgs_order_id: "BB-AAAA-1",
    amount: 1000,
    currency: "LKR",
    status: "pending",
    bookings: {
      id: "book-1",
      reference: "BB-AAAA",
      traveller_name: "Asha",
      email: "asha@example.com",
      status: "awaiting_payment",
    },
    ...overrides,
  } as TestPayment;
}

describe("reconcilePayment", () => {
  beforeEach(() => {
    retrieveOrder.mockReset();
    sendPaymentReceipt.mockReset();
    maybeSingle.mockReset();
    bookingsUpdateEq.mockClear();
  });

  it("is a no-op when the payment is already captured", async () => {
    const result = await reconcilePayment(makePayment({ status: "captured" }));

    expect(result).toEqual({ captured: true, alreadyFinalized: true });
    expect(retrieveOrder).not.toHaveBeenCalled();
    expect(sendPaymentReceipt).not.toHaveBeenCalled();
  });

  it("captures and sends exactly one receipt when the gateway confirms", async () => {
    retrieveOrder.mockResolvedValue({
      result: "SUCCESS",
      status: "CAPTURED",
      transaction: [{ transaction: { id: "txn-1" } }],
    });
    maybeSingle.mockResolvedValue({ data: { id: "pay-1" }, error: null });

    const result = await reconcilePayment(makePayment());

    expect(result.captured).toBe(true);
    expect(result.alreadyFinalized).toBe(false);
    expect(sendPaymentReceipt).toHaveBeenCalledTimes(1);
    expect(bookingsUpdateEq).toHaveBeenCalledTimes(1);
  });

  it("does not send a receipt when a concurrent call already transitioned the row", async () => {
    retrieveOrder.mockResolvedValue({ result: "SUCCESS", status: "CAPTURED" });
    // The guarded update matched no row → another call won the race.
    maybeSingle.mockResolvedValue({ data: null, error: null });

    const result = await reconcilePayment(makePayment());

    expect(result.captured).toBe(true);
    expect(sendPaymentReceipt).not.toHaveBeenCalled();
  });

  it("marks failed and sends nothing when the gateway does not confirm", async () => {
    retrieveOrder.mockResolvedValue({ result: "FAILURE", status: "FAILED" });
    maybeSingle.mockResolvedValue({ data: { id: "pay-1" }, error: null });

    const result = await reconcilePayment(makePayment());

    expect(result.captured).toBe(false);
    expect(sendPaymentReceipt).not.toHaveBeenCalled();
  });
});
