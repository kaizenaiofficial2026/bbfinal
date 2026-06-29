import { describe, expect, it } from "vitest";
import { formatPackagePrice } from "@/lib/format/price";
import {
  formatCurrency,
  formatDate,
  statusLabel,
  statusTone,
} from "@/lib/admin/format";

describe("formatPackagePrice", () => {
  it("returns null when no amount is set (quote-only packages)", () => {
    expect(formatPackagePrice(null)).toBeNull();
    expect(formatPackagePrice(undefined)).toBeNull();
  });

  it("formats with a thousands separator and the currency code", () => {
    expect(formatPackagePrice(999, "USD")).toBe("USD 999");
    expect(formatPackagePrice(320000, "USD")).toBe("USD 320,000");
  });

  it("defaults to USD and upper-cases the code", () => {
    expect(formatPackagePrice(1450)).toBe("USD 1,450");
    expect(formatPackagePrice(500, "usd")).toBe("USD 500");
  });
});

describe("formatCurrency", () => {
  it("returns an em dash for null amounts", () => {
    expect(formatCurrency(null, "USD")).toBe("—");
  });

  it("includes the amount and the upper-cased currency code", () => {
    const out = formatCurrency(1999, "usd");
    expect(out).toContain("USD");
    expect(out).toContain("1,999");
  });
});

describe("formatDate", () => {
  it("returns an em dash for empty/invalid input", () => {
    expect(formatDate(null)).toBe("—");
    expect(formatDate("not-a-date")).toBe("—");
  });

  it("formats an ISO date as DD Mon YYYY", () => {
    expect(formatDate("2026-06-25")).toBe("25 Jun 2026");
  });
});

describe("statusLabel / statusTone", () => {
  it("maps known statuses to friendly labels", () => {
    expect(statusLabel("active")).toBe("Active");
    expect(statusLabel("inactive")).toBe("Inactive");
    expect(statusLabel("awaiting_payment")).toBe("Awaiting payment");
    expect(statusLabel("verified")).toBe("Verified");
  });

  it("title-cases unknown statuses as a fallback", () => {
    expect(statusLabel("some_new_state")).toBe("Some new state");
  });

  it("maps statuses to the correct tone", () => {
    expect(statusTone("active")).toBe("positive");
    expect(statusTone("verified")).toBe("positive");
    expect(statusTone("inactive")).toBe("danger");
    expect(statusTone("cancelled")).toBe("danger");
    expect(statusTone("pending")).toBe("warning");
    expect(statusTone("anything-else")).toBe("neutral");
  });
});
