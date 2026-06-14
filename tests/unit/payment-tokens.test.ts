import { describe, expect, it } from "vitest";
import { createMpgsOrderId, createPayToken } from "@/lib/payments/tokens";

describe("payment tokens", () => {
  it("creates URL-safe pay tokens", () => {
    const token = createPayToken();

    expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(token.length).toBeGreaterThan(32);
  });

  it("prefixes MPGS order ids with the booking reference", () => {
    expect(createMpgsOrderId("BB-ABC123")).toMatch(/^BB-ABC123-\d+$/);
  });
});
