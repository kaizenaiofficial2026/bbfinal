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

      if (table === "customers") {
        // Billing lookup for the invoice's address block.
        const builder = {
          select: () => builder,
          eq: () => builder,
          maybeSingle: async () => ({
            data: { country: "Sri Lanka", passport_number: "N1234567" },
            error: null,
          }),
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
        user_id: "cust-1",
        traveller_name: "Asha",
        email: "asha@example.com",
        phone: "+94771234567",
        travellers: 3,
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
      // The gateway echoes what was actually paid; reconcile now verifies it.
      amount: 1000,
      currency: "LKR",
      transaction: [{ transaction: { id: "txn-1" } }],
    });
    maybeSingle.mockResolvedValue({ data: { id: "pay-1" }, error: null });

    const result = await reconcilePayment(makePayment());

    expect(result.captured).toBe(true);
    expect(result.alreadyFinalized).toBe(false);
    expect(sendInvoiceEmails).toHaveBeenCalledTimes(1);

    // The invoice must carry the per-line QUANTITY (travellers) and the
    // customer's billing details, or the order table can't be rendered.
    expect(sendInvoiceEmails).toHaveBeenCalledWith(
      expect.objectContaining({
        reference: "BB-AAAA",
        amount: 1000,
        currency: "LKR",
        transactionId: "txn-1",
        items: [
          {
            title: "Test Journey",
            quantity: 3,
            amount: 1000,
            currency: "LKR",
          },
        ],
        customer: {
          email: "asha@example.com",
          phone: "+94771234567",
          country: "Sri Lanka",
          passportNumber: "N1234567",
        },
      }),
    );

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
    retrieveOrder.mockResolvedValue({
      result: "SUCCESS",
      status: "CAPTURED",
      amount: 1000,
      currency: "LKR",
    });
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

  /**
   * A hosted-checkout session id is handed to the browser, so unless the merchant
   * profile enforces session signing its holder can alter the amount before
   * paying. A capture for the wrong amount must never mark the order paid.
   */
  it("refuses to mark paid when the captured AMOUNT differs from the order", async () => {
    retrieveOrder.mockResolvedValue({
      result: "SUCCESS",
      status: "CAPTURED",
      amount: 0.01, // paid a cent against a 1000 order
      currency: "LKR",
    });
    maybeSingle.mockResolvedValue({ data: { id: "pay-1" }, error: null });

    const result = await reconcilePayment(makePayment());

    expect(result.captured).toBe(false);
    // Left for a human rather than written as a terminal failure.
    expect(capturedPaymentUpdate?.status).toBe("pending");
    expect(sendInvoiceEmails).not.toHaveBeenCalled();
    expect(sendPaymentSms).not.toHaveBeenCalled();
    expect(bookingsUpdateEq).not.toHaveBeenCalled();
  });

  it("refuses to mark paid when the captured CURRENCY differs", async () => {
    retrieveOrder.mockResolvedValue({
      result: "SUCCESS",
      status: "CAPTURED",
      amount: 1000,
      currency: "USD", // 1000 USD is not 1000 LKR
    });
    maybeSingle.mockResolvedValue({ data: { id: "pay-1" }, error: null });

    const result = await reconcilePayment(makePayment());

    expect(result.captured).toBe(false);
    expect(sendInvoiceEmails).not.toHaveBeenCalled();
  });
});
