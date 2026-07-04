import { describe, expect, it } from "vitest";
import {
  buildInquirySms,
  buildPaymentSms,
  formatColomboDateTime,
  formatSmsAmount,
} from "@/lib/sms/send";
import { normalizeMsisdn } from "@/lib/sms/client";

describe("normalizeMsisdn (Dialog format)", () => {
  it("produces 94XXXXXXXXX from the common input shapes", () => {
    expect(normalizeMsisdn("+94771234567")).toBe("94771234567");
    expect(normalizeMsisdn("0771234567")).toBe("94771234567");
    expect(normalizeMsisdn("94771234567")).toBe("94771234567");
    expect(normalizeMsisdn("+94 76 097 9222")).toBe("94760979222");
  });
});

// 05:44:46 UTC + 5:30 (Asia/Colombo) = 11:14:46 on 21/06/2026 — matches the
// reference timestamp in the agreed templates.
const FIXED = new Date("2026-06-21T05:44:46Z");

describe("formatColomboDateTime", () => {
  it("formats DD/MM/YYYY hh:mm:ss A in Sri Lanka time", () => {
    expect(formatColomboDateTime(FIXED)).toBe("21/06/2026 11:14:46 AM");
  });
});

describe("formatSmsAmount", () => {
  it("groups thousands and pins 2 decimals with the currency code", () => {
    expect(formatSmsAmount("USD", 1999)).toBe("USD 1,999.00");
    expect(formatSmsAmount("LKR", 250000)).toBe("LKR 250,000.00");
    expect(formatSmsAmount("USD", 1999.5)).toBe("USD 1,999.50");
  });
});

describe("buildPaymentSms", () => {
  it("matches the business payment template", () => {
    const message = buildPaymentSms({
      reference: "BB-ABC123",
      amount: 1999,
      currency: "USD",
      date: FIXED,
    });

    expect(message).toBe(
      [
        "Dear BEYOND BORDERS,",
        "You have received a payment of USD 1,999.00",
        "Date 21/06/2026 11:14:46 AM",
        'Transaction Order Number "BB-ABC123".',
      ].join("\n"),
    );
    expect(message.length).toBeLessThanOrEqual(621);
  });
});

describe("buildInquirySms", () => {
  it("matches the business inquiry template", () => {
    const message = buildInquirySms({ reference: "BB-INQ-AB12CD", date: FIXED });

    expect(message).toBe(
      [
        "Dear BEYOND BORDERS,",
        'Transaction Order Number "BB-INQ-AB12CD".',
        "You have received a customer inquiry.",
        "Date 21/06/2026 11:14:46 AM",
      ].join("\n"),
    );
    expect(message.length).toBeLessThanOrEqual(621);
  });
});
