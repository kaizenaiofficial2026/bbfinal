import { beforeEach, describe, expect, it, vi } from "vitest";

const retrieveOrder = vi.fn();
const sendInvoiceEmails = vi.fn();
const sendPaymentSms = vi.fn();
const maybeSingle = vi.fn();
const bookingsUpdateEq = vi.fn(async () => ({ data: null, error: null }));
let capturedPaymentUpdate: Record<string, unknown> | null = null;

vi.mock("@/lib/payments/mpgs", () => ({
  retrieveOrder: (...args: unknown[]) => retrieveOrder(...args),
}));

vi.mock("@/lib/email/send", () => ({
  sendInvoiceEmails: (...args: unknown[]) => sendInvoiceEmails(...args),
}));

vi.mock("@/lib/sms/send", () => ({
  sendPaymentSms: (...args: unknown[]) => sendPaymentSms(...args),
}));

vi.mock("@/lib/supabase/service", () => ({
  createSupabaseServiceClient: () => ({
    from: (table: string) => {
      if (table === "payments") {
        const builder = {
          update: (payload: Record<string, unknown>) => {
            capturedPaymentUpdate = payload;
            return builder;
          },
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
    reference: "BB-AAAA",
    mpgs_order_id: "BB-AAAA-1",
    amount: 1000,
    currency: "LKR",
    status: "pending",
    // A payment now covers an ARRAY of bookings (an order).
    bookings: [
      {
        id: "book-1",
        reference: "BB-AAAA",
        traveller_name: "Asha",
        email: "asha@example.com",
        phone: "+94771234567",
        status: "awaiting_payment",
        quoted_amount: 1000,
        currency: "LKR",
        tour_packages: { title: "Test Journey" },
      },
    ],
    ...overrides,
  } as TestPayment;
}

describe("reconcilePayment", () => {
  beforeEach(() => {
    retrieveOrder.mockReset();
    sendInvoiceEmails.mockReset();
    sendPaymentSms.mockReset();
    maybeSingle.mockReset();
    bookingsUpdateEq.mockClear();
    capturedPaymentUpdate = null;
  });

  it("is a no-op when the payment is already captured", async () => {
    const result = await reconcilePayment(makePayment({ status: "captured" }));

    expect(result).toEqual({ captured: true, alreadyFinalized: true });
    expect(retrieveOrder).not.toHaveBeenCalled();
    expect(sendInvoiceEmails).not.toHaveBeenCalled();
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
    expect(sendInvoiceEmails).toHaveBeenCalledTimes(1);
    expect(sendPaymentSms).toHaveBeenCalledTimes(1);
    expect(sendPaymentSms).toHaveBeenCalledWith({
      reference: "BB-AAAA",
      amount: 1000,
      currency: "LKR",
      customerName: "Asha",
      customerPhone: "+94771234567",
    });
    expect(bookingsUpdateEq).toHaveBeenCalledTimes(1);
  });

  it("does not send a receipt when a concurrent call already transitioned the row", async () => {
    retrieveOrder.mockResolvedValue({ result: "SUCCESS", status: "CAPTURED" });
    // The guarded update matched no row → another call won the race.
    maybeSingle.mockResolvedValue({ data: null, error: null });

    const result = await reconcilePayment(makePayment());

    expect(result.captured).toBe(true);
    expect(sendInvoiceEmails).not.toHaveBeenCalled();
    expect(sendPaymentSms).not.toHaveBeenCalled();
  });

  it("marks failed and sends nothing when the gateway does not confirm", async () => {
    retrieveOrder.mockResolvedValue({ result: "FAILURE", status: "FAILED" });
    maybeSingle.mockResolvedValue({ data: { id: "pay-1" }, error: null });

    const result = await reconcilePayment(makePayment());

    expect(result.captured).toBe(false);
    expect(capturedPaymentUpdate?.status).toBe("failed");
    expect(sendInvoiceEmails).not.toHaveBeenCalled();
    expect(sendPaymentSms).not.toHaveBeenCalled();
  });

  it("leaves the payment pending (not failed) when the gateway is not yet final", async () => {
    retrieveOrder.mockResolvedValue({ result: "PENDING", status: "PENDING" });
    maybeSingle.mockResolvedValue({ data: { id: "pay-1" }, error: null });

    const result = await reconcilePayment(makePayment());

    expect(result.captured).toBe(false);
    expect(result.alreadyFinalized).toBe(false);
    // The M7 fix: a non-terminal order must NOT be written as "failed".
    expect(capturedPaymentUpdate?.status).toBe("pending");
    expect(sendInvoiceEmails).not.toHaveBeenCalled();
    expect(sendPaymentSms).not.toHaveBeenCalled();
    expect(bookingsUpdateEq).not.toHaveBeenCalled();
  });
});
