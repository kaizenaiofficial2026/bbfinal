import { describe, expect, it } from "vitest";
import { convertCharge } from "@/lib/payments/currency";

describe("convertCharge", () => {
  it("passes through when already in the gateway currency", () => {
    expect(convertCharge(5000, "LKR", "LKR", 300)).toEqual({
      amount: 5000,
      currency: "LKR",
    });
  });

  it("converts a USD price to LKR at the configured rate", () => {
    expect(convertCharge(999, "USD", "LKR", 300)).toEqual({
      amount: 299700,
      currency: "LKR",
    });
  });

  it("rounds the converted amount to 2 decimals", () => {
    expect(convertCharge(10.1, "USD", "LKR", 300.5)).toEqual({
      amount: 3035.05,
      currency: "LKR",
    });
  });

  it("leaves an unsupported pairing unchanged (gateway will reject it)", () => {
    expect(convertCharge(100, "EUR", "LKR", 300)).toEqual({
      amount: 100,
      currency: "EUR",
    });
  });
});
