import "server-only";

import { createHmac, timingSafeEqual } from "crypto";
import { env } from "@/lib/env";

export type CheckoutOrder = {
  orderId: string;
  amount: number;
  currency: string;
  description: string;
  returnUrl: string;
};

function assertPaymentConfig() {
  if (!env.paymentsEnabled) {
    throw new Error("Payments are currently disabled.");
  }

  if (!env.mpgsMerchantId || !env.mpgsApiPassword) {
    throw new Error("MPGS credentials are not configured.");
  }
}

function endpoint(path: string) {
  return `${env.mpgsBaseUrl}/api/rest/version/${env.mpgsApiVersion}/merchant/${env.mpgsMerchantId}${path}`;
}

function authHeader() {
  return `Basic ${Buffer.from(
    `merchant.${env.mpgsMerchantId}:${env.mpgsApiPassword}`,
  ).toString("base64")}`;
}

export async function createCheckoutSession(order: CheckoutOrder) {
  assertPaymentConfig();

  const response = await fetch(endpoint("/session"), {
    method: "POST",
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      apiOperation: "INITIATE_CHECKOUT",
      interaction: {
        operation: "PURCHASE",
        returnUrl: order.returnUrl,
        merchant: {
          name: env.mpgsMerchantName,
        },
      },
      order: {
        id: order.orderId,
        amount: order.amount.toFixed(2),
        currency: order.currency,
        description: order.description,
      },
    }),
  });

  const payload = await response.json();

  if (!response.ok || payload.result === "ERROR") {
    throw new Error(payload.error?.explanation ?? "Unable to create checkout session.");
  }

  const sessionId = payload.session?.id;

  if (!sessionId) {
    throw new Error("MPGS did not return a session id.");
  }

  return {
    id: String(sessionId),
    raw: payload,
  };
}

export async function retrieveOrder(orderId: string) {
  assertPaymentConfig();

  const response = await fetch(endpoint(`/order/${encodeURIComponent(orderId)}`), {
    headers: {
      Authorization: authHeader(),
    },
  });
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error?.explanation ?? "Unable to retrieve MPGS order.");
  }

  return payload;
}

/**
 * Verify an MPGS webhook ("Online Notification") signature.
 *
 * IMPORTANT: the exact signing scheme is gateway-specific and MUST be confirmed
 * against Seylan's MPGS Merchant Administration configuration before go-live.
 * This implements the common pattern — HMAC-SHA256 of the raw request body
 * keyed with the configured Notification Secret, compared in constant time.
 * If Seylan uses a different header or algorithm, only this function and the
 * header lookup in the webhook route need to change.
 *
 * Fails closed: returns false (→ 401) whenever the secret is unset, the
 * signature header is missing, or the digests do not match, so an unverified
 * notification can never finalize a payment.
 */
export function verifyWebhook(payload: string, signature: string | null) {
  if (!env.mpgsWebhookSecret) {
    return false;
  }

  if (!signature) {
    return false;
  }

  const digest = createHmac("sha256", env.mpgsWebhookSecret)
    .update(payload)
    .digest("hex");
  const expected = Buffer.from(digest, "hex");

  let received: Buffer;
  try {
    received = Buffer.from(signature.replace(/^sha256=/, ""), "hex");
  } catch {
    return false;
  }

  if (expected.length === 0 || expected.length !== received.length) {
    return false;
  }

  return timingSafeEqual(expected, received);
}

export function getHostedCheckoutScriptUrl() {
  return `${env.mpgsBaseUrl}/static/checkout/checkout.min.js`;
}
