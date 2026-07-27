import "server-only";

import { timingSafeEqual } from "crypto";
import { env } from "@/lib/env";

const MPGS_API_VERSION = "100";
const MPGS_TIMEOUT_MS = 10_000;
const MAX_GATEWAY_RESPONSE_BYTES = 1_000_000;
const MAX_AMOUNT = 999_999_999_999.99;
const TEST_GATEWAY_HOST = "test-seylan.mtf.gateway.mastercard.com";
const ALLOWED_GATEWAY_HOSTS = new Set([
  TEST_GATEWAY_HOST,
  "seylan.gateway.mastercard.com",
]);

export type CheckoutOrder = {
  orderId: string;
  amount: number;
  currency: string;
  description: string;
  returnUrl: string;
};

export type MpgsErrorCode =
  | "PAYMENTS_DISABLED"
  | "INVALID_CONFIGURATION"
  | "INVALID_REQUEST"
  | "GATEWAY_TIMEOUT"
  | "GATEWAY_UNAVAILABLE"
  | "GATEWAY_REJECTED"
  | "INVALID_GATEWAY_RESPONSE";

const SAFE_ERROR_MESSAGES: Record<MpgsErrorCode, string> = {
  PAYMENTS_DISABLED: "Payments are currently unavailable.",
  INVALID_CONFIGURATION: "The payment service is not configured.",
  INVALID_REQUEST: "The payment request could not be processed.",
  GATEWAY_TIMEOUT: "The payment gateway timed out. Please try again.",
  GATEWAY_UNAVAILABLE:
    "The payment gateway is temporarily unavailable. Please try again.",
  GATEWAY_REJECTED:
    "The payment gateway could not process this request. Please try again or contact us.",
  INVALID_GATEWAY_RESPONSE:
    "The payment gateway returned an invalid response. Please try again.",
};

/**
 * A deliberately safe error boundary for callers such as the create-session
 * route. Gateway response bodies can contain operational details, so their
 * explanations are never copied into this public error.
 */
export class MpgsError extends Error {
  readonly code: MpgsErrorCode;
  readonly gatewayStatus?: number;

  constructor(code: MpgsErrorCode, gatewayStatus?: number) {
    super(SAFE_ERROR_MESSAGES[code]);
    this.name = "MpgsError";
    this.code = code;
    this.gatewayStatus = gatewayStatus;
  }
}

type PaymentConfig = {
  baseUrl: string;
  merchantId: string;
  apiPassword: string;
  merchantName: string;
  currency: string;
};

type JsonObject = Record<string, unknown>;

export type MpgsOrderResponse = JsonObject & {
  result?: string;
  status?: string;
  amount?: string | number;
  totalCapturedAmount?: string | number;
  totalRefundedAmount?: string | number;
  currency?: string;
  transaction?: Array<{
    transaction?: {
      id?: string;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  }>;
};

function configurationError(): never {
  throw new MpgsError("INVALID_CONFIGURATION");
}

function invalidRequest(): never {
  throw new MpgsError("INVALID_REQUEST");
}

function gatewayBaseUrl() {
  let parsed: URL;

  try {
    parsed = new URL(env.mpgsBaseUrl);
  } catch {
    return configurationError();
  }

  const hostname = parsed.hostname.toLowerCase();
  const isBareOrigin =
    parsed.pathname === "/" &&
    parsed.search === "" &&
    parsed.hash === "" &&
    parsed.username === "" &&
    parsed.password === "" &&
    parsed.port === "";

  if (
    parsed.protocol !== "https:" ||
    !isBareOrigin ||
    !ALLOWED_GATEWAY_HOSTS.has(hostname)
  ) {
    return configurationError();
  }

  // A production deployment must never be capable of presenting an MTF
  // checkout. VERCEL_ENV distinguishes a production deployment from a preview
  // build, both of which normally have NODE_ENV=production.
  if (process.env.VERCEL_ENV === "production" && hostname === TEST_GATEWAY_HOST) {
    return configurationError();
  }

  return parsed.origin;
}

function assertPaymentConfig(): PaymentConfig {
  if (!env.paymentsEnabled) {
    throw new MpgsError("PAYMENTS_DISABLED");
  }

  const baseUrl = gatewayBaseUrl();
  const merchantId = env.mpgsMerchantId;
  const apiPassword = env.mpgsApiPassword;
  const merchantName = env.mpgsMerchantName;
  const currency = env.mpgsCurrency;
  const notificationSecret = env.mpgsWebhookSecret;

  if (
    env.mpgsApiVersion !== MPGS_API_VERSION ||
    typeof merchantId !== "string" ||
    !/^[A-Za-z0-9._-]{1,64}$/.test(merchantId) ||
    (process.env.VERCEL_ENV === "production" && /^TEST/i.test(merchantId)) ||
    typeof apiPassword !== "string" ||
    apiPassword.length === 0 ||
    apiPassword.length > 512 ||
    /[\r\n\0]/.test(apiPassword) ||
    typeof merchantName !== "string" ||
    merchantName.length === 0 ||
    merchantName.length > 100 ||
    merchantName.trim() !== merchantName ||
    /[\u0000-\u001f\u007f]/.test(merchantName) ||
    typeof currency !== "string" ||
    !/^[A-Z]{3}$/.test(currency) ||
    (process.env.VERCEL_ENV === "production" &&
      (typeof notificationSecret !== "string" ||
        notificationSecret.length !== 32))
  ) {
    return configurationError();
  }

  return {
    baseUrl,
    merchantId,
    apiPassword,
    merchantName,
    currency,
  };
}

function endpoint(config: PaymentConfig, resourcePath: string) {
  return `${config.baseUrl}/api/rest/version/${MPGS_API_VERSION}/merchant/${encodeURIComponent(config.merchantId)}${resourcePath}`;
}

function authHeader(config: PaymentConfig) {
  return `Basic ${Buffer.from(
    `merchant.${config.merchantId}:${config.apiPassword}`,
  ).toString("base64")}`;
}

function validateText(
  value: unknown,
  options: { maxLength: number; trim?: boolean },
) {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value.length > options.maxLength ||
    /[\u0000-\u001f\u007f]/.test(value) ||
    (options.trim && value.trim() !== value)
  ) {
    return invalidRequest();
  }

  // encodeURIComponent throws for malformed surrogate pairs. Checking it here
  // makes order ids safe to use as an encoded REST path segment later.
  try {
    encodeURIComponent(value);
  } catch {
    return invalidRequest();
  }

  return value;
}

function validateAmount(value: number) {
  if (
    !Number.isFinite(value) ||
    value <= 0 ||
    value > MAX_AMOUNT
  ) {
    return invalidRequest();
  }

  const minorUnits = Math.round(value * 100);
  const precisionDelta = Math.abs(value * 100 - minorUnits);

  if (!Number.isSafeInteger(minorUnits) || precisionDelta > 1e-7) {
    return invalidRequest();
  }

  return (minorUnits / 100).toFixed(2);
}

function validateReturnUrl(value: string) {
  if (typeof value !== "string" || value.length === 0 || value.length > 2_048) {
    return invalidRequest();
  }

  let returnUrl: URL;
  let siteUrl: URL;

  try {
    returnUrl = new URL(value);
    siteUrl = new URL(env.siteUrl);
  } catch {
    return invalidRequest();
  }

  const localDevelopmentUrl =
    process.env.VERCEL_ENV !== "production" &&
    returnUrl.protocol === "http:" &&
    (returnUrl.hostname === "localhost" || returnUrl.hostname === "127.0.0.1");

  if (
    (returnUrl.protocol !== "https:" && !localDevelopmentUrl) ||
    returnUrl.username !== "" ||
    returnUrl.password !== "" ||
    returnUrl.hash !== "" ||
    returnUrl.origin !== siteUrl.origin
  ) {
    return invalidRequest();
  }

  return returnUrl.toString();
}

function validateCheckoutOrder(order: CheckoutOrder, config: PaymentConfig) {
  if (!order || typeof order !== "object") {
    return invalidRequest();
  }

  const orderId = validateText(order.orderId, {
    maxLength: 40,
    trim: true,
  });
  const description = validateText(order.description, {
    maxLength: 127,
    trim: true,
  });

  if (
    typeof order.currency !== "string" ||
    !/^[A-Z]{3}$/.test(order.currency) ||
    order.currency !== config.currency
  ) {
    return invalidRequest();
  }

  return {
    orderId,
    amount: validateAmount(order.amount),
    currency: order.currency,
    description,
    returnUrl: validateReturnUrl(order.returnUrl),
  };
}

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isSensitiveGatewayKey(
  normalizedKey: string,
  normalizedParentKey = "",
) {
  return (
    normalizedKey.startsWith("error") ||
    normalizedKey.includes("authorization") ||
    normalizedKey.includes("password") ||
    normalizedKey.includes("secret") ||
    normalizedKey === "apikey" ||
    normalizedKey.endsWith("accesstoken") ||
    normalizedKey.endsWith("credential") ||
    normalizedKey.endsWith("credentials") ||
    ["pan", "cardnumber", "cvc", "cvv", "cardsecuritycode"].includes(
      normalizedKey,
    ) ||
    (normalizedParentKey === "card" &&
      ["number", "expiry", "nameoncard", "securitycode"].includes(
        normalizedKey,
      ))
  );
}

function safeGatewayValue(
  value: unknown,
  depth = 0,
  parentKey = "",
): unknown {
  if (depth > 20) {
    return "[TRUNCATED]";
  }

  if (Array.isArray(value)) {
    return value.map((entry) =>
      safeGatewayValue(entry, depth + 1, parentKey),
    );
  }

  if (!isJsonObject(value)) {
    return value;
  }

  const safe: JsonObject = {};
  for (const [key, entry] of Object.entries(value)) {
    const normalizedKey = key.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (
      key === "__proto__" ||
      key === "prototype" ||
      key === "constructor"
    ) {
      continue;
    }
    if (isSensitiveGatewayKey(normalizedKey, parentKey)) {
      safe[key] = "[REDACTED]";
      continue;
    }
    safe[key] = safeGatewayValue(entry, depth + 1, normalizedKey);
  }
  return safe;
}

async function readGatewayPayload(response: Response): Promise<JsonObject> {
  const declaredLength = Number(response.headers.get("content-length"));
  if (
    Number.isFinite(declaredLength) &&
    declaredLength > MAX_GATEWAY_RESPONSE_BYTES
  ) {
    throw new MpgsError("INVALID_GATEWAY_RESPONSE");
  }

  const body = await response.text();
  if (Buffer.byteLength(body, "utf8") > MAX_GATEWAY_RESPONSE_BYTES) {
    throw new MpgsError("INVALID_GATEWAY_RESPONSE");
  }

  // Never parse or surface an error body. It may include a gateway explanation
  // with authentication or merchant-account detail.
  if (!response.ok) {
    throw new MpgsError("GATEWAY_REJECTED", response.status);
  }

  let payload: unknown;
  try {
    payload = JSON.parse(body);
  } catch {
    throw new MpgsError("INVALID_GATEWAY_RESPONSE");
  }

  if (!isJsonObject(payload)) {
    throw new MpgsError("INVALID_GATEWAY_RESPONSE");
  }

  return payload;
}

async function requestGateway(
  url: string,
  init: Omit<RequestInit, "signal">,
): Promise<JsonObject> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), MPGS_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      ...init,
      cache: "no-store",
      redirect: "error",
      signal: controller.signal,
    });
    return await readGatewayPayload(response);
  } catch (caught) {
    if (caught instanceof MpgsError) {
      throw caught;
    }
    if (controller.signal.aborted) {
      throw new MpgsError("GATEWAY_TIMEOUT");
    }
    throw new MpgsError("GATEWAY_UNAVAILABLE");
  } finally {
    clearTimeout(timeout);
  }
}

export async function createCheckoutSession(order: CheckoutOrder) {
  const config = assertPaymentConfig();
  const checkoutOrder = validateCheckoutOrder(order, config);

  const payload = await requestGateway(endpoint(config, "/session"), {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: authHeader(config),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      apiOperation: "INITIATE_CHECKOUT",
      interaction: {
        operation: "PURCHASE",
        returnUrl: checkoutOrder.returnUrl,
        merchant: {
          name: config.merchantName,
        },
      },
      order: {
        id: checkoutOrder.orderId,
        amount: checkoutOrder.amount,
        currency: checkoutOrder.currency,
        description: checkoutOrder.description,
      },
    }),
  });

  if (payload.result !== "SUCCESS") {
    throw new MpgsError("GATEWAY_REJECTED");
  }

  const sessionId = isJsonObject(payload.session)
    ? payload.session.id
    : undefined;

  if (
    (typeof sessionId !== "string" && typeof sessionId !== "number") ||
    String(sessionId).length === 0 ||
    String(sessionId).length > 2_048 ||
    /[\u0000-\u001f\u007f]/.test(String(sessionId))
  ) {
    throw new MpgsError("INVALID_GATEWAY_RESPONSE");
  }

  return {
    id: String(sessionId),
    raw: safeGatewayValue(payload) as JsonObject,
  };
}

export async function retrieveOrder(
  orderId: string,
): Promise<MpgsOrderResponse> {
  const config = assertPaymentConfig();
  const safeOrderId = validateText(orderId, {
    maxLength: 40,
    trim: true,
  });

  const payload = await requestGateway(
    endpoint(config, `/order/${encodeURIComponent(safeOrderId)}`),
    {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: authHeader(config),
      },
    },
  );

  if (payload.result === "ERROR") {
    throw new MpgsError("GATEWAY_REJECTED");
  }

  return safeGatewayValue(payload) as MpgsOrderResponse;
}

/**
 * Verify an MPGS webhook ("Online Notification").
 *
 * Per Seylan's MPGS Merchant Administration, for HTTPS notification URLs the
 * gateway sends the configured Notification Secret verbatim in the custom
 * header `X-Notification-Secret`. The sender is authenticated by comparing that
 * header against our stored secret in constant time — there is no HMAC.
 *
 * Fails closed: returns false (→ 401) whenever the secret is unset, the header
 * is missing, or the values differ, so an unverified notification can never
 * finalize a payment.
 */
export function verifyWebhook(receivedSecret: string | null) {
  if (!env.mpgsWebhookSecret || !receivedSecret) {
    return false;
  }

  const expected = Buffer.from(env.mpgsWebhookSecret);
  const received = Buffer.from(receivedSecret);

  if (expected.length === 0 || expected.length !== received.length) {
    return false;
  }

  return timingSafeEqual(expected, received);
}

export function getHostedCheckoutScriptUrl() {
  return `${gatewayBaseUrl()}/static/checkout/checkout.min.js`;
}
