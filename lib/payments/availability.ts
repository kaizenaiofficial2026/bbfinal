import "server-only";

import { createHash, timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env";

const SHA256_HEX = /^[a-f0-9]{64}$/i;

export function isCanaryPaymentToken(token: string) {
  const configured = env.mpgsCanaryTokenSha256;
  if (
    typeof token !== "string" ||
    token.length === 0 ||
    typeof configured !== "string" ||
    !SHA256_HEX.test(configured)
  ) {
    return false;
  }

  const expected = Buffer.from(configured, "hex");
  const received = createHash("sha256").update(token, "utf8").digest();
  return timingSafeEqual(expected, received);
}

export function canInitiatePayment(token: string) {
  return env.paymentsEnabled || isCanaryPaymentToken(token);
}
