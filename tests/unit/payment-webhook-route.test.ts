import { beforeEach, describe, expect, it, vi } from "vitest";

type AfterCallback = () => void | Promise<void>;

const mocks = vi.hoisted(() => ({
  after: vi.fn(),
  getPaymentByOrderId: vi.fn(),
  reconcilePayment: vi.fn(),
  verifyWebhook: vi.fn(),
}));

vi.mock("next/server", () => ({
  after: (callback: AfterCallback) => mocks.after(callback),
  NextResponse: {
    json: (body: unknown, init?: ResponseInit) => Response.json(body, init),
  },
}));

vi.mock("@/lib/data/payments", () => ({
  getPaymentByOrderId: (...args: unknown[]) =>
    mocks.getPaymentByOrderId(...args),
}));

vi.mock("@/lib/payments/mpgs", () => ({
  verifyWebhook: (...args: unknown[]) => mocks.verifyWebhook(...args),
}));

vi.mock("@/lib/payments/reconcile", () => ({
  reconcilePayment: (...args: unknown[]) => mocks.reconcilePayment(...args),
}));

import { POST } from "@/app/api/payments/webhook/route";

const payment = {
  id: "payment-1",
  mpgs_order_id: "BB-ORDER-1",
  bookings: [{ id: "booking-1" }],
};

function request(
  body: string,
  {
    secret = "valid-secret",
    notificationId = "notification-1",
    notificationAttempt = "1",
  }: {
    secret?: string;
    notificationId?: string;
    notificationAttempt?: string;
  } = {},
) {
  return new Request("https://www.beyondborders.lk/api/payments/webhook", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-notification-attempt": notificationAttempt,
      "x-notification-id": notificationId,
      "x-notification-secret": secret,
    },
    body,
  });
}

function scheduledCallbacks() {
  return mocks.after.mock.calls.map(
    ([callback]) => callback as AfterCallback,
  );
}

beforeEach(() => {
  vi.restoreAllMocks();
  mocks.after.mockReset();
  mocks.getPaymentByOrderId.mockReset().mockResolvedValue(payment);
  mocks.reconcilePayment
    .mockReset()
    .mockResolvedValue({ captured: true, alreadyFinalized: false });
  mocks.verifyWebhook
    .mockReset()
    .mockImplementation((secret) => secret === "valid-secret");
});

describe("MPGS webhook route", () => {
  it("rejects an invalid notification secret without parsing or scheduling work", async () => {
    const response = await POST(
      request('{"order":{"id":"BB-ORDER-1"}}', {
        secret: "wrong-secret",
      }),
    );

    expect(response.status).toBe(401);
    expect(mocks.after).not.toHaveBeenCalled();
    expect(mocks.getPaymentByOrderId).not.toHaveBeenCalled();
  });

  it("rejects malformed JSON without scheduling work", async () => {
    const response = await POST(request("{not-json"));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Invalid payload." });
    expect(mocks.after).not.toHaveBeenCalled();
  });

  it("rejects a payload with no usable order id", async () => {
    const response = await POST(request('{"order":{"id":"   "}}'));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Missing order id." });
    expect(mocks.after).not.toHaveBeenCalled();
  });

  it("acknowledges and schedules a nested MPGS order id before database work", async () => {
    const response = await POST(
      request('{"order":{"id":"BB-ORDER-1"},"result":"SUCCESS"}'),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(mocks.after).toHaveBeenCalledOnce();
    expect(mocks.getPaymentByOrderId).not.toHaveBeenCalled();

    await scheduledCallbacks()[0]();

    expect(mocks.getPaymentByOrderId).toHaveBeenCalledWith("BB-ORDER-1");
    expect(mocks.reconcilePayment).toHaveBeenCalledWith(payment, {
      checkCaptured: true,
    });
  });

  it("accepts the supported top-level orderId form", async () => {
    const response = await POST(request('{"orderId":12345}'));

    expect(response.status).toBe(200);
    await scheduledCallbacks()[0]();

    expect(mocks.getPaymentByOrderId).toHaveBeenCalledWith("12345");
    expect(mocks.reconcilePayment).toHaveBeenCalledWith(payment, {
      checkCaptured: true,
    });
  });

  it("acknowledges an unknown order without attempting reconciliation", async () => {
    mocks.getPaymentByOrderId.mockResolvedValue(null);
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    const response = await POST(request('{"order":{"id":"unknown-order"}}'));
    expect(response.status).toBe(200);

    await expect(scheduledCallbacks()[0]()).resolves.toBeUndefined();
    expect(mocks.getPaymentByOrderId).toHaveBeenCalledWith("unknown-order");
    expect(mocks.reconcilePayment).not.toHaveBeenCalled();
    expect(consoleError).not.toHaveBeenCalled();
  });

  it("contains and safely logs a deferred reconciliation failure", async () => {
    const secret = "do-not-log-this-secret";
    const body =
      '{"order":{"id":"BB-ORDER-1"},"cardNumber":"5123450000000008"}';
    mocks.verifyWebhook.mockReturnValue(true);
    mocks.reconcilePayment.mockRejectedValue(new Error("gateway timeout"));
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    const response = await POST(
      request(body, {
        secret,
        notificationId: "notification-safe-id",
        notificationAttempt: "7",
      }),
    );
    expect(response.status).toBe(200);

    await expect(scheduledCallbacks()[0]()).resolves.toBeUndefined();
    expect(consoleError).toHaveBeenCalledWith(
      "[payment webhook] deferred reconciliation failed",
      {
        orderId: "BB-ORDER-1",
        paymentId: "payment-1",
        notificationId: "notification-safe-id",
        notificationAttempt: "7",
      },
    );

    const logged = JSON.stringify(consoleError.mock.calls);
    expect(logged).not.toContain(secret);
    expect(logged).not.toContain("5123450000000008");
    expect(logged).not.toContain("gateway timeout");
  });

  it("contains lookup failures as well as reconciliation failures", async () => {
    mocks.getPaymentByOrderId.mockRejectedValue(new Error("database offline"));
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    const response = await POST(request('{"order":{"id":"BB-ORDER-1"}}'));
    expect(response.status).toBe(200);

    await expect(scheduledCallbacks()[0]()).resolves.toBeUndefined();
    expect(mocks.reconcilePayment).not.toHaveBeenCalled();
    expect(consoleError).toHaveBeenCalledWith(
      "[payment webhook] deferred reconciliation failed",
      expect.objectContaining({
        orderId: "BB-ORDER-1",
        paymentId: undefined,
      }),
    );
  });

  it("schedules every duplicate delivery and relies on idempotent reconciliation", async () => {
    const duplicate = '{"order":{"id":"BB-ORDER-1"}}';

    const first = await POST(request(duplicate));
    const second = await POST(request(duplicate));

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(mocks.after).toHaveBeenCalledTimes(2);
    expect(mocks.getPaymentByOrderId).not.toHaveBeenCalled();

    await Promise.all(scheduledCallbacks().map((callback) => callback()));

    expect(mocks.getPaymentByOrderId).toHaveBeenCalledTimes(2);
    expect(mocks.reconcilePayment).toHaveBeenCalledTimes(2);
  });
});
