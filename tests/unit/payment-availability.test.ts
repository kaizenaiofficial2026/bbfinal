import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockEnv } = vi.hoisted(() => ({
  mockEnv: {
    paymentsEnabled: false,
    mpgsCanaryTokenSha256: undefined as string | undefined,
  },
}));

vi.mock("@/lib/env", () => ({
  env: mockEnv,
}));

import {
  canInitiatePayment,
  isCanaryPaymentToken,
} from "@/lib/payments/availability";

const CANARY_TOKEN = "private-production-canary-token";
const CANARY_SHA256 =
  "a5b8677667c6896272eb03ae886f317b4da8be2d10affa77da61c02589b00c2e";

beforeEach(() => {
  mockEnv.paymentsEnabled = false;
  mockEnv.mpgsCanaryTokenSha256 = undefined;
});

describe("payment initiation availability", () => {
  it("allows every valid payment flow when payments are globally enabled", () => {
    mockEnv.paymentsEnabled = true;
    expect(canInitiatePayment("ordinary-token")).toBe(true);
  });

  it("allows only the token matching the configured SHA-256 canary digest", () => {
    mockEnv.mpgsCanaryTokenSha256 = CANARY_SHA256;

    expect(isCanaryPaymentToken(CANARY_TOKEN)).toBe(true);
    expect(canInitiatePayment(CANARY_TOKEN)).toBe(true);
    expect(canInitiatePayment("another-token")).toBe(false);
  });

  it.each([
    undefined,
    "",
    "not-hex",
    "a".repeat(63),
    "a".repeat(65),
  ])("fails closed for an invalid configured digest (%s)", (configured) => {
    mockEnv.mpgsCanaryTokenSha256 = configured;
    expect(canInitiatePayment(CANARY_TOKEN)).toBe(false);
  });
});
