import { beforeEach, describe, expect, it, vi } from "vitest";

const retrieveOrder = vi.fn();
const sendInvoiceEmails = vi.fn();
const sendPaymentSms = vi.fn();
const maybeSingle = vi.fn();
let bookingsUpdateResult: { data: null; error: unknown } = {
  data: null,
  error: null,
};
const bookingsUpdateEq = vi.fn(async () => bookingsUpdateResult);
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
          in: () => builder,
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
    vi.restoreAllMocks();
    retrieveOrder.mockReset();
    sendInvoiceEmails.mockReset();
    sendPaymentSms.mockReset();
    maybeSingle.mockReset();
    bookingsUpdateEq.mockClear();
    bookingsUpdateResult = { data: null, error: null };
    capturedPaymentUpdate = null;
  });

  it("repairs unpaid bookings when the payment is already captured", async () => {
    const result = await reconcilePayment(makePayment({ status: "captured" }));

    expect(result).toEqual({ captured: true, alreadyFinalized: true });
    expect(retrieveOrder).not.toHaveBeenCalled();
    expect(sendInvoiceEmails).not.toHaveBeenCalled();
    expect(bookingsUpdateEq).toHaveBeenCalledTimes(1);
  });

  it("does not contact the gateway again once a full refund is recorded", async () => {
    const result = await reconcilePayment(makePayment({ status: "refunded" }));

    expect(result).toEqual({
      captured: false,
      alreadyFinalized: true,
      refunded: true,
    });
    expect(retrieveOrder).not.toHaveBeenCalled();
    expect(bookingsUpdateEq).not.toHaveBeenCalled();
  });

  it("captures and sends exactly one receipt when the gateway confirms", async () => {
    retrieveOrder.mockResolvedValue({
      id: "BB-AAAA-1",
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
      id: "BB-AAAA-1",
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
      id: "BB-AAAA-1",
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

  it("prefers the actual total captured amount over the requested order amount", async () => {
    retrieveOrder.mockResolvedValue({
      id: "BB-AAAA-1",
      result: "SUCCESS",
      status: "CAPTURED",
      amount: 1000,
      totalCapturedAmount: 0.01,
      currency: "LKR",
    });
    maybeSingle.mockResolvedValue({ data: { id: "pay-1" }, error: null });

    const result = await reconcilePayment(makePayment());

    expect(result.captured).toBe(false);
    expect(capturedPaymentUpdate?.status).toBe("pending");
    expect(bookingsUpdateEq).not.toHaveBeenCalled();
    expect(sendInvoiceEmails).not.toHaveBeenCalled();
  });

  it("refuses to mark paid when the captured CURRENCY differs", async () => {
    retrieveOrder.mockResolvedValue({
      id: "BB-AAAA-1",
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

  it("rejects a captured response for a different gateway order", async () => {
    retrieveOrder.mockResolvedValue({
      id: "BB-SOMEONE-ELSES-ORDER",
      result: "SUCCESS",
      status: "CAPTURED",
      amount: 1000,
      currency: "LKR",
    });
    maybeSingle.mockResolvedValue({ data: { id: "pay-1" }, error: null });

    const result = await reconcilePayment(makePayment());

    expect(result.captured).toBe(false);
    expect(capturedPaymentUpdate?.status).toBe("pending");
    expect(bookingsUpdateEq).not.toHaveBeenCalled();
    expect(sendInvoiceEmails).not.toHaveBeenCalled();
  });

  it("leaves the payment retryable when marking bookings paid fails", async () => {
    retrieveOrder.mockResolvedValue({
      id: "BB-AAAA-1",
      result: "SUCCESS",
      status: "CAPTURED",
      amount: 1000,
      currency: "LKR",
    });
    bookingsUpdateResult = {
      data: null,
      error: { message: "booking update failed" },
    };
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    await expect(reconcilePayment(makePayment())).rejects.toThrow(
      "A database error occurred",
    );
    expect(maybeSingle).not.toHaveBeenCalled();
    expect(sendInvoiceEmails).not.toHaveBeenCalled();
    expect(consoleError).toHaveBeenCalled();
  });

  it("does not send notifications when the guarded payment write fails", async () => {
    retrieveOrder.mockResolvedValue({
      id: "BB-AAAA-1",
      result: "SUCCESS",
      status: "CAPTURED",
      amount: 1000,
      currency: "LKR",
    });
    maybeSingle.mockResolvedValue({
      data: null,
      error: { message: "payment update failed" },
    });
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    await expect(reconcilePayment(makePayment())).rejects.toThrow(
      "A database error occurred",
    );
    expect(bookingsUpdateEq).toHaveBeenCalledTimes(1);
    expect(sendInvoiceEmails).not.toHaveBeenCalled();
    expect(sendPaymentSms).not.toHaveBeenCalled();
  });

  it("preserves the checkout consent audit when archiving the order response", async () => {
    retrieveOrder.mockResolvedValue({
      id: "BB-AAAA-1",
      result: "PENDING",
      status: "PENDING",
      amount: 1000,
      currency: "LKR",
    });
    maybeSingle.mockResolvedValue({ data: { id: "pay-1" }, error: null });
    const consent = {
      acceptedAt: "2026-07-27T10:00:00.000Z",
      termsVersion: "2026-07-27",
      privacyVersion: "2026-07-27",
    };

    await reconcilePayment(
      makePayment({
        gateway_result: {
          phase: "checkout_session",
          sessionCreatedAt: "2026-07-27T10:00:00.000Z",
          session: { result: "SUCCESS" },
          consent,
        },
      }),
    );

    expect(capturedPaymentUpdate?.gateway_result).toMatchObject({
      phase: "reconcile",
      consent,
      sessionCreatedAt: "2026-07-27T10:00:00.000Z",
      order: { status: "PENDING" },
    });
  });

  it("records a gateway-confirmed full refund from a later webhook", async () => {
    retrieveOrder.mockResolvedValue({
      id: "BB-AAAA-1",
      result: "SUCCESS",
      status: "REFUNDED",
      amount: 1000,
      totalCapturedAmount: 1000,
      totalRefundedAmount: 1000,
      currency: "LKR",
      transaction: [{ transaction: { id: "refund-1", type: "REFUND" } }],
    });
    maybeSingle.mockResolvedValue({ data: { id: "pay-1" }, error: null });
    const consoleWarn = vi
      .spyOn(console, "warn")
      .mockImplementation(() => undefined);

    const result = await reconcilePayment(
      makePayment({ status: "captured" }),
      { checkCaptured: true },
    );

    expect(result).toEqual({
      captured: false,
      alreadyFinalized: false,
      refunded: true,
    });
    expect(capturedPaymentUpdate).toMatchObject({
      status: "refunded",
      mpgs_transaction_id: "refund-1",
      gateway_result: {
        phase: "reconcile",
        order: { status: "REFUNDED", totalRefundedAmount: 1000 },
      },
    });
    expect(sendInvoiceEmails).not.toHaveBeenCalled();
    expect(sendPaymentSms).not.toHaveBeenCalled();
    expect(consoleWarn).toHaveBeenCalled();
  });

  it("keeps a partial refund captured and makes it visible for manual review", async () => {
    retrieveOrder.mockResolvedValue({
      id: "BB-AAAA-1",
      result: "SUCCESS",
      status: "PARTIALLY_REFUNDED",
      amount: 1000,
      totalCapturedAmount: 1000,
      totalRefundedAmount: 250,
      currency: "LKR",
    });
    const consoleWarn = vi
      .spyOn(console, "warn")
      .mockImplementation(() => undefined);

    const result = await reconcilePayment(
      makePayment({
        status: "captured",
        bookings: [
          {
            ...makePayment().bookings![0],
            status: "paid",
          },
        ],
      }),
      { checkCaptured: true },
    );

    expect(result).toEqual({ captured: true, alreadyFinalized: true });
    expect(capturedPaymentUpdate).toMatchObject({
      gateway_result: {
        phase: "reconcile",
        order: {
          status: "PARTIALLY_REFUNDED",
          totalRefundedAmount: 250,
        },
      },
    });
    expect(capturedPaymentUpdate).not.toHaveProperty("status");
    expect(bookingsUpdateEq).not.toHaveBeenCalled();
    expect(consoleWarn).toHaveBeenCalledWith(
      "[payment requires refund review]",
      expect.objectContaining({
        paymentId: "pay-1",
        gatewayStatus: "PARTIALLY_REFUNDED",
        refundedAmount: 250,
      }),
    );
  });
});
