import { beforeEach, describe, expect, it, vi } from "vitest";

// getRequestIpHash() reads next/headers; stub it so the module imports cleanly.
const headerGet = vi.fn();
vi.mock("next/headers", () => ({
  headers: vi.fn(async () => ({ get: headerGet })),
}));

import {
  generateBookingReference,
  generateInquiryReference,
  generateToken,
  getRequestIpHash,
  isExpired,
} from "@/lib/security/request";

describe("generateToken", () => {
  it("produces URL-safe base64 with no padding", () => {
    const token = generateToken(32);
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(token).not.toContain("=");
  });

  it("produces a unique value on each call", () => {
    expect(generateToken()).not.toBe(generateToken());
  });
});

describe("isExpired", () => {
  it("is true for a past timestamp and false for a future one", () => {
    expect(isExpired(new Date(Date.now() - 1000).toISOString())).toBe(true);
    expect(isExpired(new Date(Date.now() + 60_000).toISOString())).toBe(false);
  });
});

describe("reference generators", () => {
  it("booking references look like BB-XXXXXX", () => {
    expect(generateBookingReference()).toMatch(/^BB-[0-9A-F]{6}$/);
  });

  it("inquiry references look like BB-INQ-XXXXXX", () => {
    expect(generateInquiryReference()).toMatch(/^BB-INQ-[0-9A-F]{6}$/);
  });
});

describe("getRequestIpHash", () => {
  beforeEach(() => {
    headerGet.mockReset();
  });

  it("returns a deterministic 64-char sha256 hex for a given IP", async () => {
    headerGet.mockImplementation((name: string) =>
      name === "x-real-ip" ? "203.0.113.7" : null,
    );
    const a = await getRequestIpHash();
    const b = await getRequestIpHash();
    expect(a).toMatch(/^[0-9a-f]{64}$/);
    expect(a).toBe(b);
  });

  it("returns a deterministic shared bucket with no IP headers (fail-closed)", async () => {
    headerGet.mockReturnValue(null);
    const a = await getRequestIpHash();
    const b = await getRequestIpHash();
    expect(a).toMatch(/^[0-9a-f]{64}$/);
    // Must be STABLE across requests, not a random per-request hash — otherwise
    // the per-IP volume caps (countRecent*ByIp) would silently never trigger.
    expect(a).toBe(b);
  });
});
