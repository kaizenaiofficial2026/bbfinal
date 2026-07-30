import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const WEBHOOK_SECRET = "w".repeat(32);

const { mockEnv } = vi.hoisted(() => ({
  mockEnv: {
    paymentsEnabled: true,
    mpgsBaseUrl: "https://test-seylan.mtf.gateway.mastercard.com",
    mpgsApiVersion: "100",
    mpgsMerchantId: "MERCHANT_123",
    mpgsApiPassword: "test-api-password",
    mpgsMerchantName: "Beyond Borders",
    mpgsCurrency: "USD",
    mpgsWebhookSecret: "w".repeat(32),
    siteUrl: "https://www.beyondborders.lk",
  } as {
    paymentsEnabled: boolean;
    mpgsBaseUrl: string;
    mpgsApiVersion: string;
    mpgsMerchantId: string | undefined;
    mpgsApiPassword: string | undefined;
    mpgsMerchantName: string;
    mpgsCurrency: string;
    mpgsWebhookSecret: string | undefined;
    siteUrl: string;
  },
}));

vi.mock("@/lib/env", () => ({
  env: mockEnv,
}));

import {
  createCheckoutSession,
  getHostedCheckoutScriptUrl,
  MpgsError,
  retrieveOrder,
  verifyWebhook,
} from "@/lib/payments/mpgs";

const fetchMock = vi.fn<typeof fetch>();

const validOrder = () => ({
  orderId: "BB-ORD-1001",
  amount: 125.5,
  currency: "USD",
  description: "Beyond Borders order BB-ORD-1001",
  returnUrl:
    "https://www.beyondborders.lk/pay/pay-token-123/result?source=checkout",
});

function jsonResponse(
  payload: unknown,
  init: { status?: number; headers?: HeadersInit } = {},
) {
  return new Response(JSON.stringify(payload), {
    status: init.status ?? 200,
    headers: {
      "content-type": "application/json",
      ...init.headers,
    },
  });
}

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
  Object.assign(mockEnv, {
    paymentsEnabled: true,
    mpgsBaseUrl: "https://test-seylan.mtf.gateway.mastercard.com",
    mpgsApiVersion: "100",
    mpgsMerchantId: "MERCHANT_123",
    mpgsApiPassword: "test-api-password",
    mpgsMerchantName: "Beyond Borders",
    mpgsCurrency: "USD",
    mpgsWebhookSecret: WEBHOOK_SECRET,
    siteUrl: "https://www.beyondborders.lk",
  });
  delete process.env.VERCEL_ENV;
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  delete process.env.VERCEL_ENV;
});

describe("createCheckoutSession", () => {
  it("uses Seylan Hosted Checkout v100 with exact Basic auth and request fields", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        result: "SUCCESS",
        successIndicator: "indicator-1",
        session: { id: "SESSION0001", version: "abc" },
      }),
    );

    const result = await createCheckoutSession(validOrder());

    expect(result).toEqual({
      id: "SESSION0001",
      raw: {
        result: "SUCCESS",
        successIndicator: "indicator-1",
        session: { id: "SESSION0001", version: "abc" },
      },
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(
      "https://test-seylan.mtf.gateway.mastercard.com/api/rest/version/100/merchant/MERCHANT_123/session",
    );
    expect(init).toMatchObject({
      method: "POST",
      cache: "no-store",
      redirect: "error",
      headers: {
        Accept: "application/json",
        Authorization: `Basic ${Buffer.from(
          "merchant.MERCHANT_123:test-api-password",
        ).toString("base64")}`,
        "Content-Type": "application/json",
      },
    });
    expect(init?.signal).toBeInstanceOf(AbortSignal);
    expect(JSON.parse(String(init?.body))).toEqual({
      apiOperation: "INITIATE_CHECKOUT",
      interaction: {
        operation: "PURCHASE",
        returnUrl:
          "https://www.beyondborders.lk/pay/pay-token-123/result?source=checkout",
        merchant: { name: "Beyond Borders" },
      },
      order: {
        id: "BB-ORD-1001",
        amount: "125.50",
        currency: "USD",
        description: "Beyond Borders order BB-ORD-1001",
      },
    });
  });

  it("uses the allowlisted production Seylan host", async () => {
    process.env.VERCEL_ENV = "production";
    mockEnv.mpgsBaseUrl = "https://seylan.gateway.mastercard.com";
    fetchMock.mockResolvedValue(
      jsonResponse({ result: "SUCCESS", session: { id: "LIVE-SESSION" } }),
    );

    await expect(createCheckoutSession(validOrder())).resolves.toMatchObject({
      id: "LIVE-SESSION",
    });
    expect(fetchMock.mock.calls[0][0]).toBe(
      "https://seylan.gateway.mastercard.com/api/rest/version/100/merchant/MERCHANT_123/session",
    );
    expect(getHostedCheckoutScriptUrl()).toBe(
      "https://seylan.gateway.mastercard.com/static/checkout/checkout.min.js",
    );
  });

  it("redacts sensitive fields from the successful raw audit payload", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        result: "SUCCESS",
        session: { id: "SESSION0001" },
        authorization: "Basic should-not-survive",
        credentials: { password: "should-not-survive" },
        error: { explanation: "internal gateway detail" },
        sourceOfFunds: {
          provided: {
            card: {
              number: "512345xxxxxx0008",
              expiry: { month: "01", year: "40" },
              nameOnCard: "Test Traveller",
              scheme: "MASTERCARD",
            },
          },
        },
      }),
    );

    const result = await createCheckoutSession(validOrder());

    expect(result.raw).toMatchObject({
      authorization: "[REDACTED]",
      credentials: "[REDACTED]",
      error: "[REDACTED]",
      sourceOfFunds: {
        provided: {
          card: {
            number: "[REDACTED]",
            expiry: "[REDACTED]",
            nameOnCard: "[REDACTED]",
            scheme: "MASTERCARD",
          },
        },
      },
    });
    expect(JSON.stringify(result.raw)).not.toContain("should-not-survive");
    expect(JSON.stringify(result.raw)).not.toContain("internal gateway detail");
    expect(JSON.stringify(result.raw)).not.toContain("512345");
    expect(JSON.stringify(result.raw)).not.toContain("Test Traveller");
  });

  it.each([
    {
      name: "HTTP gateway rejection",
      response: () =>
        new Response("API password invalid: top-secret-value", { status: 401 }),
      code: "GATEWAY_REJECTED",
    },
    {
      name: "a 200 result=ERROR response",
      response: () =>
        jsonResponse({
          result: "ERROR",
          error: { explanation: "merchant password top-secret-value" },
        }),
      code: "GATEWAY_REJECTED",
    },
    {
      name: "a non-JSON success response",
      response: () => new Response("<html>upstream error</html>", { status: 200 }),
      code: "INVALID_GATEWAY_RESPONSE",
    },
    {
      name: "a success response without a session id",
      response: () => jsonResponse({ result: "SUCCESS", session: {} }),
      code: "INVALID_GATEWAY_RESPONSE",
    },
  ])("returns a safe typed error for $name", async ({ response, code }) => {
    fetchMock.mockResolvedValue(response());

    const error = await createCheckoutSession(validOrder()).catch(
      (caught: unknown) => caught,
    );

    expect(error).toBeInstanceOf(MpgsError);
    expect(error).toMatchObject({ code });
    expect((error as Error).message).not.toContain("top-secret-value");
    expect((error as Error).message).not.toContain("password invalid");
    expect((error as Error).message).not.toContain("<html>");
  });

  it("maps network failures to a safe unavailable error", async () => {
    fetchMock.mockRejectedValue(
      new Error(
        "request failed with Authorization: Basic dXNlcjp0b3Atc2VjcmV0",
      ),
    );

    const error = await createCheckoutSession(validOrder()).catch(
      (caught: unknown) => caught,
    );

    expect(error).toMatchObject({ code: "GATEWAY_UNAVAILABLE" });
    expect((error as Error).message).not.toContain("Authorization");
    expect((error as Error).message).not.toContain("dXNlcj");
  });

  it("aborts a gateway request after the bounded timeout", async () => {
    vi.useFakeTimers();
    fetchMock.mockImplementation(
      (_url, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener(
            "abort",
            () => reject(new DOMException("aborted", "AbortError")),
            { once: true },
          );
        }),
    );

    const assertion = expect(
      createCheckoutSession(validOrder()),
    ).rejects.toMatchObject({
      code: "GATEWAY_TIMEOUT",
    });

    await vi.advanceTimersByTimeAsync(10_000);
    await assertion;
  });

  it.each([
    ["missing merchant id", { mpgsMerchantId: undefined }],
    ["missing API password", { mpgsApiPassword: undefined }],
    ["unsupported API version", { mpgsApiVersion: "99" }],
    ["invalid configured currency", { mpgsCurrency: "usd" }],
    [
      "an unapproved gateway hostname",
      { mpgsBaseUrl: "https://seylan.gateway.mastercard.com.attacker.test" },
    ],
    [
      "a gateway URL containing a path",
      {
        mpgsBaseUrl:
          "https://test-seylan.mtf.gateway.mastercard.com/unapproved-path",
      },
    ],
  ])("fails closed for %s", async (_name, override) => {
    Object.assign(mockEnv, override);

    await expect(createCheckoutSession(validOrder())).rejects.toMatchObject({
      code: "INVALID_CONFIGURATION",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects the MTF gateway in a Vercel production deployment", async () => {
    process.env.VERCEL_ENV = "production";

    await expect(createCheckoutSession(validOrder())).rejects.toMatchObject({
      code: "INVALID_CONFIGURATION",
    });
    expect(() => getHostedCheckoutScriptUrl()).toThrow(
      expect.objectContaining({ code: "INVALID_CONFIGURATION" }),
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("requires the gateway-issued 32-character webhook secret in production", async () => {
    process.env.VERCEL_ENV = "production";
    mockEnv.mpgsBaseUrl = "https://seylan.gateway.mastercard.com";
    mockEnv.mpgsWebhookSecret = "not-a-production-secret";

    await expect(createCheckoutSession(validOrder())).rejects.toMatchObject({
      code: "INVALID_CONFIGURATION",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects a test merchant id on the production gateway", async () => {
    process.env.VERCEL_ENV = "production";
    mockEnv.mpgsBaseUrl = "https://seylan.gateway.mastercard.com";
    mockEnv.mpgsMerchantId = "TESTMERCHANT123";

    await expect(createCheckoutSession(validOrder())).rejects.toMatchObject({
      code: "INVALID_CONFIGURATION",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("fails closed when payments are disabled", async () => {
    mockEnv.paymentsEnabled = false;

    await expect(createCheckoutSession(validOrder())).rejects.toMatchObject({
      code: "PAYMENTS_DISABLED",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("permits an explicitly allowlisted canary while payments are disabled", async () => {
    mockEnv.paymentsEnabled = false;
    fetchMock.mockResolvedValue(
      jsonResponse({ result: "SUCCESS", session: { id: "CANARY-SESSION" } }),
    );

    await expect(
      createCheckoutSession(validOrder(), {
        allowWhenPaymentsDisabled: true,
      }),
    ).resolves.toMatchObject({ id: "CANARY-SESSION" });
  });

  it.each([
    ["a zero amount", { amount: 0 }],
    ["a non-finite amount", { amount: Number.POSITIVE_INFINITY }],
    ["more than two decimal places", { amount: 10.009 }],
    ["a mismatched currency", { currency: "LKR" }],
    ["a lowercase currency", { currency: "usd" }],
    ["an empty order id", { orderId: "" }],
    ["an overlong order id", { orderId: "A".repeat(41) }],
    ["an overlong description", { description: "A".repeat(128) }],
    [
      "a cross-origin return URL",
      { returnUrl: "https://payments.attacker.test/complete" },
    ],
    [
      "a return URL with credentials",
      { returnUrl: "https://user:password@www.beyondborders.lk/complete" },
    ],
    [
      "an insecure public return URL",
      { returnUrl: "http://www.beyondborders.lk/complete" },
    ],
  ])("does not contact MPGS for %s", async (_name, override) => {
    await expect(
      createCheckoutSession({ ...validOrder(), ...override }),
    ).rejects.toMatchObject({ code: "INVALID_REQUEST" });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("retrieveOrder", () => {
  it("encodes the order id as one path segment and uses authenticated GET", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        result: "SUCCESS",
        status: "CAPTURED",
        amount: 125.5,
        currency: "USD",
      }),
    );

    await expect(retrieveOrder("BB Order/100?")).resolves.toEqual({
      result: "SUCCESS",
      status: "CAPTURED",
      amount: 125.5,
      currency: "USD",
    });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(
      "https://test-seylan.mtf.gateway.mastercard.com/api/rest/version/100/merchant/MERCHANT_123/order/BB%20Order%2F100%3F",
    );
    expect(init).toMatchObject({
      method: "GET",
      cache: "no-store",
      redirect: "error",
      headers: {
        Accept: "application/json",
        Authorization: `Basic ${Buffer.from(
          "merchant.MERCHANT_123:test-api-password",
        ).toString("base64")}`,
      },
    });
  });

  it("returns failed order state for reconciliation instead of treating it as API failure", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ result: "FAILURE", status: "FAILED" }),
    );

    await expect(retrieveOrder("BB-ORD-1001")).resolves.toEqual({
      result: "FAILURE",
      status: "FAILED",
    });
  });

  it("does not retry a failed read implicitly", async () => {
    fetchMock.mockResolvedValue(
      new Response("gateway unavailable", { status: 503 }),
    );

    await expect(retrieveOrder("BB-ORD-1001")).rejects.toMatchObject({
      code: "GATEWAY_REJECTED",
      gatewayStatus: 503,
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("still reconciles in-flight money after new payments are disabled", async () => {
    mockEnv.paymentsEnabled = false;
    fetchMock.mockResolvedValue(
      jsonResponse({
        result: "SUCCESS",
        status: "CAPTURED",
        amount: 1,
        currency: "USD",
      }),
    );

    await expect(retrieveOrder("BB-CANARY-1")).resolves.toMatchObject({
      status: "CAPTURED",
    });
  });
});

describe("verifyWebhook", () => {
  it("accepts the exact configured notification secret", () => {
    expect(verifyWebhook(WEBHOOK_SECRET)).toBe(true);
  });

  it.each([null, "", "wrong-secret", `${WEBHOOK_SECRET}-longer`])(
    "rejects a missing or mismatched notification secret (%s)",
    (received) => {
      expect(verifyWebhook(received)).toBe(false);
    },
  );

  it("fails closed when no webhook secret is configured", () => {
    mockEnv.mpgsWebhookSecret = undefined;
    expect(verifyWebhook(WEBHOOK_SECRET)).toBe(false);
  });
});
