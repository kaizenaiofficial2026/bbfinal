import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getPaymentByToken: vi.fn(),
  createCheckoutSession: vi.fn(),
  checkAndRecordRateLimit: vi.fn(),
  getRequestIpHash: vi.fn(),
  isExpired: vi.fn(),
  createSupabaseServiceClient: vi.fn(),
  env: {
    paymentsEnabled: true,
    mpgsCurrency: "USD",
    siteUrl: "https://travel.example",
  },
}));

vi.mock("@/lib/data/payments", () => ({
  getPaymentByToken: (...args: unknown[]) =>
    mocks.getPaymentByToken(...args),
  orderReference: (payment: {
    reference?: string | null;
    bookings?: Array<{ reference?: string }>;
  }) => payment.reference ?? payment.bookings?.[0]?.reference ?? "",
}));

vi.mock("@/lib/env", () => ({
  get env() {
    return mocks.env;
  },
}));

vi.mock("@/lib/payments/mpgs", () => ({
  createCheckoutSession: (...args: unknown[]) =>
    mocks.createCheckoutSession(...args),
}));

vi.mock("@/lib/data/rate-limit", () => ({
  checkAndRecordRateLimit: (...args: unknown[]) =>
    mocks.checkAndRecordRateLimit(...args),
}));

vi.mock("@/lib/security/request", () => ({
  getRequestIpHash: (...args: unknown[]) => mocks.getRequestIpHash(...args),
  isExpired: (...args: unknown[]) => mocks.isExpired(...args),
}));

vi.mock("@/lib/supabase/service", () => ({
  createSupabaseServiceClient: () =>
    mocks.createSupabaseServiceClient(),
}));

import { POST } from "@/app/api/payments/create-session/route";
import {
  CHECKOUT_PRIVACY_VERSION,
  CHECKOUT_TERMS_VERSION,
} from "@/lib/payments/consent";

type DbResult = {
  data: Record<string, unknown> | null;
  error: unknown | null;
};

type Filter = {
  kind: "eq" | "in" | "neq";
  column: string;
  value: unknown;
};

type UpdateOperation = {
  table: string;
  payload: Record<string, unknown>;
  filters: Filter[];
  selected?: string;
};

function makeSupabase(results: DbResult[]) {
  const pendingResults = [...results];
  const operations: UpdateOperation[] = [];
  const from = vi.fn((table: string) => ({
    update(payload: Record<string, unknown>) {
      const result = pendingResults.shift() ?? { data: null, error: null };
      const operation: UpdateOperation = {
        table,
        payload,
        filters: [],
      };
      operations.push(operation);

      const builder = {
        eq(column: string, value: unknown) {
          operation.filters.push({ kind: "eq", column, value });
          return builder;
        },
        in(column: string, value: unknown) {
          operation.filters.push({ kind: "in", column, value });
          return builder;
        },
        neq(column: string, value: unknown) {
          operation.filters.push({ kind: "neq", column, value });
          return builder;
        },
        select(columns: string) {
          operation.selected = columns;
          return builder;
        },
        async maybeSingle() {
          return result;
        },
        then(
          resolve: (value: DbResult) => unknown,
          reject: (reason: unknown) => unknown,
        ) {
          return Promise.resolve(result).then(resolve, reject);
        },
      };

      return builder;
    },
  }));

  return {
    client: { from },
    from,
    operations,
  };
}

const NOW = "2026-07-27T12:00:00.000Z";

function payment(overrides: Record<string, unknown> = {}) {
  return {
    id: "payment-1",
    reference: "BB-ORD-0042",
    status: "initiated",
    mpgs_session_id: null,
    mpgs_order_id: "gateway-order-123",
    pay_token: "server-payment-token",
    pay_token_expires_at: "2026-07-28T12:00:00.000Z",
    amount: 1250.5,
    currency: "USD",
    updated_at: "2026-07-27T10:00:00.000Z",
    bookings: [
      {
        id: "booking-1",
        reference: "BB-BOOK-0042",
        status: "awaiting_payment",
      },
    ],
    ...overrides,
  };
}

function makeRequest(
  body: unknown,
  options: { raw?: boolean; headers?: Record<string, string> } = {},
) {
  return new Request("https://travel.example/api/payments/create-session", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      host: "travel.example",
      ...options.headers,
    },
    body: options.raw ? String(body) : JSON.stringify(body),
  });
}

const validBody = {
  token: "server-payment-token",
  acceptedTerms: true,
  acceptedPrivacy: true,
};

let database = makeSupabase([]);
let consoleError: ReturnType<typeof vi.spyOn>;

function installDatabase(results: DbResult[]) {
  database = makeSupabase(results);
  mocks.createSupabaseServiceClient.mockReturnValue(database.client);
  return database;
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(NOW));

  mocks.getPaymentByToken.mockReset().mockResolvedValue(payment());
  mocks.createCheckoutSession.mockReset().mockResolvedValue({
    id: "SESSION-123",
    raw: { result: "SUCCESS", session: { id: "SESSION-123" } },
  });
  mocks.checkAndRecordRateLimit.mockReset().mockResolvedValue({
    allowed: true,
    retryAfterSeconds: 0,
  });
  mocks.getRequestIpHash.mockReset().mockResolvedValue("hashed-ip");
  mocks.isExpired.mockReset().mockReturnValue(false);
  mocks.createSupabaseServiceClient.mockReset();

  mocks.env.paymentsEnabled = true;
  mocks.env.mpgsCurrency = "USD";
  mocks.env.siteUrl = "https://travel.example";

  installDatabase([
    {
      data: {
        id: "payment-1",
        updated_at: "2026-07-27T12:00:01.000Z",
      },
      error: null,
    },
    { data: { id: "payment-1" }, error: null },
  ]);

  consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
});

afterEach(() => {
  consoleError.mockRestore();
  vi.useRealTimers();
});

describe("POST /api/payments/create-session", () => {
  it("fails closed while payments are disabled", async () => {
    mocks.env.paymentsEnabled = false;

    const response = await POST(makeRequest(validBody));

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      error: "Payments are disabled.",
    });
    expect(mocks.getRequestIpHash).not.toHaveBeenCalled();
    expect(mocks.createCheckoutSession).not.toHaveBeenCalled();
  });

  it("rejects a cross-origin browser request before rate limiting it", async () => {
    const response = await POST(
      makeRequest(validBody, {
        headers: { origin: "https://attacker.example" },
      }),
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({ error: "Forbidden." });
    expect(mocks.checkAndRecordRateLimit).not.toHaveBeenCalled();
    expect(mocks.getPaymentByToken).not.toHaveBeenCalled();
  });

  it("treats a different scheme on the same host as cross-origin", async () => {
    const response = await POST(
      makeRequest(validBody, {
        headers: { origin: "http://travel.example" },
      }),
    );

    expect(response.status).toBe(403);
    expect(mocks.checkAndRecordRateLimit).not.toHaveBeenCalled();
    expect(mocks.getPaymentByToken).not.toHaveBeenCalled();
  });

  it("rate limits session amplification and returns a usable retry delay", async () => {
    mocks.checkAndRecordRateLimit.mockResolvedValue({
      allowed: false,
      retryAfterSeconds: 61,
    });

    const response = await POST(makeRequest(validBody));

    expect(mocks.checkAndRecordRateLimit).toHaveBeenCalledWith(
      "create-session",
      "hashed-ip",
      { max: 20, windowMinutes: 10 },
    );
    expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toBe("61");
    await expect(response.json()).resolves.toEqual({
      error:
        "Too many payment attempts. Please wait about 2 minute(s) and try again.",
      retryAfterSeconds: 61,
    });
    expect(mocks.getPaymentByToken).not.toHaveBeenCalled();
  });

  it("rejects malformed JSON without consulting the payment record", async () => {
    const response = await POST(makeRequest("{", { raw: true }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Invalid request.",
    });
    expect(mocks.getPaymentByToken).not.toHaveBeenCalled();
  });

  it.each([null, [], "not-an-object"])(
    "rejects a non-object JSON body (%j)",
    async (body) => {
      const response = await POST(makeRequest(body));

      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toEqual({
        error: "Invalid request.",
      });
      expect(mocks.getPaymentByToken).not.toHaveBeenCalled();
    },
  );

  it.each([
    {
      name: "terms",
      body: { token: "server-payment-token", acceptedPrivacy: true },
    },
    {
      name: "privacy policy",
      body: { token: "server-payment-token", acceptedTerms: true },
    },
  ])("requires affirmative acceptance of the $name", async ({ body }) => {
    const response = await POST(makeRequest(body));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Please accept the terms and privacy policy before paying.",
    });
    expect(mocks.getPaymentByToken).not.toHaveBeenCalled();
  });

  it.each([
    { name: "missing", token: undefined },
    { name: "non-string", token: 123 },
    { name: "oversized", token: "x".repeat(257) },
  ])("rejects a $name payment token", async ({ token }) => {
    const response = await POST(
      makeRequest({ ...validBody, token }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Invalid payment link.",
    });
    expect(mocks.getPaymentByToken).not.toHaveBeenCalled();
  });

  it("returns not found without leaking whether a gateway order exists", async () => {
    mocks.getPaymentByToken.mockResolvedValue(null);

    const response = await POST(makeRequest(validBody));

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: "Payment not found.",
    });
    expect(mocks.createSupabaseServiceClient).not.toHaveBeenCalled();
  });

  it("rejects an expired payment link", async () => {
    mocks.isExpired.mockReturnValue(true);

    const response = await POST(makeRequest(validBody));

    expect(mocks.isExpired).toHaveBeenCalledWith(
      "2026-07-28T12:00:00.000Z",
    );
    expect(response.status).toBe(410);
    await expect(response.json()).resolves.toEqual({
      error: "Payment link expired.",
    });
    expect(mocks.createCheckoutSession).not.toHaveBeenCalled();
  });

  it.each(["captured", "refunded"])(
    "does not create another session for a %s payment",
    async (status) => {
      mocks.getPaymentByToken.mockResolvedValue(payment({ status }));

      const response = await POST(makeRequest(validBody));

      expect(response.status).toBe(409);
      await expect(response.json()).resolves.toEqual({
        error: "Payment already completed.",
      });
      expect(mocks.createCheckoutSession).not.toHaveBeenCalled();
    },
  );

  it("rejects an order outside the merchant's enabled currency", async () => {
    mocks.getPaymentByToken.mockResolvedValue(payment({ currency: "LKR" }));

    const response = await POST(makeRequest(validBody));

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      error:
        "This order cannot currently be paid online. Please contact us.",
    });
    expect(mocks.createSupabaseServiceClient).not.toHaveBeenCalled();
    expect(mocks.createCheckoutSession).not.toHaveBeenCalled();
  });

  it("reuses a recent pending session instead of creating a competing one", async () => {
    mocks.getPaymentByToken.mockResolvedValue(
      payment({
        status: "pending",
        mpgs_session_id: "RECENT-SESSION",
        updated_at: "2026-07-27T11:50:00.000Z",
      }),
    );

    const response = await POST(makeRequest(validBody));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      sessionId: "RECENT-SESSION",
    });
    expect(mocks.createSupabaseServiceClient).not.toHaveBeenCalled();
    expect(mocks.createCheckoutSession).not.toHaveBeenCalled();
  });

  it("does not extend an old session merely because reconciliation touched the row", async () => {
    mocks.getPaymentByToken.mockResolvedValue(
      payment({
        status: "pending",
        mpgs_session_id: "OLD-SESSION",
        updated_at: "2026-07-27T11:59:30.000Z",
        gateway_result: {
          phase: "reconcile",
          sessionCreatedAt: "2026-07-27T10:00:00.000Z",
          order: { status: "PENDING" },
        },
      }),
    );

    const response = await POST(makeRequest(validBody));

    expect(response.status).toBe(200);
    expect(mocks.createCheckoutSession).toHaveBeenCalledOnce();
    await expect(response.json()).resolves.toEqual({
      sessionId: "SESSION-123",
    });
  });

  it("honours a fresh session-creation lock", async () => {
    mocks.getPaymentByToken.mockResolvedValue(
      payment({
        status: "pending",
        mpgs_session_id: null,
        updated_at: "2026-07-27T11:59:30.000Z",
      }),
    );

    const response = await POST(makeRequest(validBody));

    expect(response.status).toBe(409);
    expect(response.headers.get("retry-after")).toBe("3");
    await expect(response.json()).resolves.toEqual({
      error:
        "A payment session is already being prepared. Please try again.",
    });
    expect(mocks.createSupabaseServiceClient).not.toHaveBeenCalled();
    expect(mocks.createCheckoutSession).not.toHaveBeenCalled();
  });

  it("returns retry when another request wins the optimistic claim race", async () => {
    const db = installDatabase([{ data: null, error: null }]);

    const response = await POST(makeRequest(validBody));

    expect(response.status).toBe(409);
    expect(response.headers.get("retry-after")).toBe("3");
    expect(db.operations).toHaveLength(1);
    expect(db.operations[0]).toMatchObject({
      table: "payments",
      payload: { status: "pending", mpgs_session_id: null },
      filters: [
        { kind: "eq", column: "id", value: "payment-1" },
        {
          kind: "eq",
          column: "updated_at",
          value: "2026-07-27T10:00:00.000Z",
        },
        {
          kind: "in",
          column: "status",
          value: ["initiated", "pending", "failed"],
        },
      ],
    });
    expect(mocks.createCheckoutSession).not.toHaveBeenCalled();
  });

  it("returns a generic server error when the optimistic claim fails", async () => {
    installDatabase([
      {
        data: null,
        error: { message: "database internals must stay private" },
      },
    ]);

    const response = await POST(makeRequest(validBody));
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({
      error: "We couldn't start the payment. Please try again.",
    });
    expect(JSON.stringify(body)).not.toContain("database internals");
    expect(mocks.createCheckoutSession).not.toHaveBeenCalled();
  });

  it("creates MPGS input only from server data and persists a consent audit", async () => {
    const db = installDatabase([
      {
        data: {
          id: "payment-1",
          updated_at: "2026-07-27T12:00:01.000Z",
        },
        error: null,
      },
      { data: { id: "payment-1" }, error: null },
    ]);
    mocks.getPaymentByToken.mockResolvedValue(
      payment({
        pay_token: "canonical-server-token",
        reference: "BB-ORD-SERVER",
      }),
    );

    const response = await POST(
      makeRequest({
        ...validBody,
        token: "  server-payment-token  ",
        amount: 0.01,
        currency: "XXX",
        orderId: "attacker-order",
        returnUrl: "https://attacker.example",
        termsVersion: "attacker-version",
        privacyVersion: "attacker-version",
      }),
    );

    expect(mocks.getPaymentByToken).toHaveBeenCalledWith(
      "server-payment-token",
    );
    expect(mocks.createCheckoutSession).toHaveBeenCalledTimes(1);
    expect(mocks.createCheckoutSession).toHaveBeenCalledWith({
      orderId: "gateway-order-123",
      amount: 1250.5,
      currency: "USD",
      description: "Beyond Borders order BB-ORD-SERVER",
      returnUrl:
        "https://travel.example/pay/canonical-server-token/result",
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      sessionId: "SESSION-123",
    });

    expect(db.operations).toHaveLength(2);
    expect(db.operations[1]).toEqual({
      table: "payments",
      payload: {
        mpgs_session_id: "SESSION-123",
        status: "pending",
        gateway_result: {
          phase: "checkout_session",
          sessionCreatedAt: NOW,
          session: {
            result: "SUCCESS",
            session: { id: "SESSION-123" },
          },
          consent: {
            acceptedAt: NOW,
            termsVersion: CHECKOUT_TERMS_VERSION,
            privacyVersion: CHECKOUT_PRIVACY_VERSION,
          },
        },
      },
      filters: [
        { kind: "eq", column: "id", value: "payment-1" },
        {
          kind: "eq",
          column: "updated_at",
          value: "2026-07-27T12:00:01.000Z",
        },
        { kind: "neq", column: "status", value: "captured" },
      ],
      selected: "id",
    });
  });

  it("returns a generic gateway error and releases only its own lock", async () => {
    const db = installDatabase([
      {
        data: {
          id: "payment-1",
          updated_at: "2026-07-27T12:00:01.000Z",
        },
        error: null,
      },
      { data: null, error: null },
    ]);
    mocks.getPaymentByToken.mockResolvedValue(
      payment({
        status: "failed",
        mpgs_session_id: "PREVIOUS-SESSION",
      }),
    );
    mocks.createCheckoutSession.mockRejectedValue(
      new Error("gateway leaked apiPassword=top-secret"),
    );

    const response = await POST(makeRequest(validBody));
    const body = await response.json();

    expect(response.status).toBe(502);
    expect(body).toEqual({
      error: "We couldn't start the payment. Please try again.",
    });
    expect(JSON.stringify(body)).not.toContain("top-secret");
    expect(db.operations).toHaveLength(2);
    expect(db.operations[1]).toEqual({
      table: "payments",
      payload: {
        status: "failed",
        mpgs_session_id: "PREVIOUS-SESSION",
      },
      filters: [
        { kind: "eq", column: "id", value: "payment-1" },
        {
          kind: "eq",
          column: "updated_at",
          value: "2026-07-27T12:00:01.000Z",
        },
      ],
    });
  });

  it("returns a generic server error when session persistence fails", async () => {
    installDatabase([
      {
        data: {
          id: "payment-1",
          updated_at: "2026-07-27T12:00:01.000Z",
        },
        error: null,
      },
      {
        data: null,
        error: { message: "constraint detail must stay private" },
      },
    ]);

    const response = await POST(makeRequest(validBody));
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({
      error: "We couldn't start the payment. Please try again.",
    });
    expect(JSON.stringify(body)).not.toContain("constraint detail");
  });

  it("reports a persistence race when the claimed row no longer matches", async () => {
    installDatabase([
      {
        data: {
          id: "payment-1",
          updated_at: "2026-07-27T12:00:01.000Z",
        },
        error: null,
      },
      { data: null, error: null },
    ]);

    const response = await POST(makeRequest(validBody));

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      error: "We couldn't start the payment. Please try again.",
    });
  });
});
