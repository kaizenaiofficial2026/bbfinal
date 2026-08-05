import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildCustomerPaymentSms,
  buildInquirySms,
  buildPaymentSms,
  formatColomboDateTime,
  formatSmsAmount,
  parseSmsRecipients,
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
      reference: "BB-ORD-1233",
      amount: 1999,
      currency: "USD",
      date: FIXED,
    });

    expect(message).toBe(
      [
        "Dear BEYOND BORDERS,",
        "You have received a payment of USD 1,999.00",
        "Date 21/06/2026 11:14:46 AM",
        'Transaction Order Number "BB-ORD-1233".',
      ].join("\n"),
    );
    expect(message.length).toBeLessThanOrEqual(621);
  });
});

describe("buildCustomerPaymentSms", () => {
  it("greets the customer and words the receipt from their point of view", () => {
    const message = buildCustomerPaymentSms({
      customerName: "Asha Perera",
      reference: "BB-ORD-1233",
      amount: 1999,
      currency: "USD",
      date: FIXED,
    });

    expect(message).toBe(
      [
        "Dear Asha Perera,",
        "We have received your payment of USD 1,999.00",
        "Date 21/06/2026 11:14:46 AM",
        'Transaction Order Number "BB-ORD-1233".',
      ].join("\n"),
    );
    expect(message.length).toBeLessThanOrEqual(621);
  });
});

describe("parseSmsRecipients", () => {
  it("splits a comma-separated list and trims each number", () => {
    expect(parseSmsRecipients("+94760979197, +94773409246,+94743902959")).toEqual([
      "+94760979197",
      "+94773409246",
      "+94743902959",
    ]);
  });

  it("treats an empty / unset list as no recipients", () => {
    expect(parseSmsRecipients("")).toEqual([]);
    expect(parseSmsRecipients(null)).toEqual([]);
    expect(parseSmsRecipients(undefined)).toEqual([]);
    expect(parseSmsRecipients(" , ,")).toEqual([]);
  });

  it("texts a repeated number once, however it is written", () => {
    // +94771234567 and 0771234567 are the same phone — one message, not two.
    expect(
      parseSmsRecipients("+94771234567, 0771234567, +94771234567"),
    ).toEqual(["+94771234567"]);
  });

  it("keeps a single number working (the legacy SMS_TEAM_CONTACT shape)", () => {
    expect(parseSmsRecipients("+94764632369")).toEqual(["+94764632369"]);
  });
});

/**
 * `env` snapshots process.env at module load, so each case sets the recipient
 * lists first and re-imports. The gateway client is mocked to record who would
 * have been texted without touching Dialog.
 */
async function loadSendWith(vars: Record<string, string>) {
  vi.resetModules();
  for (const [key, value] of Object.entries(vars)) vi.stubEnv(key, value);

  const sent: { to: string; message: string }[] = [];
  vi.doMock("@/lib/sms/client", () => ({
    sendSms: async ({ to, message }: { to: string; message: string }) => {
      sent.push({ to, message });
      return { skipped: false };
    },
    normalizeMsisdn: (value: string) => value.replace(/\D/g, "") || null,
  }));

  const mod = await import("@/lib/sms/send");
  return { sent, ...mod };
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.doUnmock("@/lib/sms/client");
  vi.resetModules();
});

describe("sendPaymentSms fan-out", () => {
  it("texts every business number plus the customer", async () => {
    const { sent, sendPaymentSms } = await loadSendWith({
      SMS_PAYMENT_CONTACTS: "+94760979197,+94773409246,+94743902959",
    });

    await sendPaymentSms({
      reference: "BB-ORD-1233",
      amount: 1999,
      currency: "USD",
      customerName: "Asha Perera",
      customerPhone: "+94771234567",
    });

    expect(sent.map((s) => s.to)).toEqual([
      "+94760979197",
      "+94773409246",
      "+94743902959",
      "+94771234567",
    ]);
    // Business numbers get the business wording; the customer gets theirs.
    expect(sent[0].message.startsWith("Dear BEYOND BORDERS,")).toBe(true);
    expect(sent[3].message.startsWith("Dear Asha Perera,")).toBe(true);
  });

  it("still texts the business list when we have no customer number", async () => {
    const { sent, sendPaymentSms } = await loadSendWith({
      SMS_PAYMENT_CONTACTS: "+94760979197,+94773409246",
    });

    await sendPaymentSms({
      reference: "BB-ORD-1234",
      amount: 10,
      currency: "USD",
      customerPhone: null,
    });

    expect(sent.map((s) => s.to)).toEqual(["+94760979197", "+94773409246"]);
  });

  it("falls back to SMS_TEAM_CONTACT when the payment list is BLANK", async () => {
    // A variable that exists but is empty means "not configured" — with `??`
    // the blank string would win and the business would be texted nobody.
    const { sent, sendPaymentSms } = await loadSendWith({
      SMS_PAYMENT_CONTACTS: "",
      SMS_TEAM_CONTACT: "+94764632369",
    });

    await sendPaymentSms({ reference: "BB-ORD-1", amount: 10, currency: "USD" });

    expect(sent.map((s) => s.to)).toEqual(["+94764632369"]);
  });

  it("says so in the log when nobody is configured", async () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    const { sent, sendPaymentSms } = await loadSendWith({
      SMS_PAYMENT_CONTACTS: "",
      SMS_TEAM_CONTACT: "",
    });

    await sendPaymentSms({ reference: "BB-ORD-2", amount: 10, currency: "USD" });

    // A silent no-op is indistinguishable from a working send, so it must log.
    expect(sent).toEqual([]);
    expect(info).toHaveBeenCalledWith(
      "[sms skipped] no business recipients configured for payment",
    );
    info.mockRestore();
  });

  it("falls back to SMS_TEAM_CONTACT when no payment list is set", async () => {
    const { sent, sendPaymentSms } = await loadSendWith({
      SMS_TEAM_CONTACT: "+94764632369",
    });

    await sendPaymentSms({
      reference: "BB-ORD-1235",
      amount: 10,
      currency: "USD",
    });

    expect(sent.map((s) => s.to)).toEqual(["+94764632369"]);
  });
});

describe("sendInquirySms fan-out", () => {
  it("texts the inquiry list only — never the customer", async () => {
    const { sent, sendInquirySms } = await loadSendWith({
      SMS_INQUIRY_CONTACTS: "+94760979197,+94760979220",
      SMS_PAYMENT_CONTACTS: "+94773409246",
    });

    await sendInquirySms({ reference: "BB-INQ-1055" });

    // The payment-only number must NOT be in here.
    expect(sent.map((s) => s.to)).toEqual(["+94760979197", "+94760979220"]);
    expect(sent[0].message).toContain("customer inquiry");
  });

  it("falls back to SMS_TEAM_CONTACT when no inquiry list is set", async () => {
    const { sent, sendInquirySms } = await loadSendWith({
      SMS_TEAM_CONTACT: "+94764632369",
    });

    await sendInquirySms({ reference: "BB-INQ-1056" });

    expect(sent.map((s) => s.to)).toEqual(["+94764632369"]);
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

describe("sendSms timeout", () => {
  it("gives up instead of hanging when the gateway never answers", async () => {
    vi.resetModules();
    for (const [key, value] of Object.entries({
      SMS_ENABLED: "true",
      SMS_USERNAME: "user",
      SMS_PASSWORD: "pass",
      SMS_MASK: "BB Tours SL",
      SMS_TEAM_CONTACT: "+94771234567",
    })) {
      vi.stubEnv(key, value);
    }
    const { sendSms } = await import("@/lib/sms/client");

    const errorLog = vi.spyOn(console, "error").mockImplementation(() => {});
    // A gateway that accepts the connection and then goes silent: the request
    // only ever settles because our own AbortController fires.
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation((_url, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () =>
            reject(new Error("aborted")),
          );
        }),
      );
    vi.useFakeTimers();

    const pending = sendSms({ to: "+94771234567", message: "hello" });
    await vi.advanceTimersByTimeAsync(10_000);

    // Fail-soft: reported as skipped, never thrown at the payment flow.
    await expect(pending).resolves.toEqual({ skipped: true });
    expect(errorLog).toHaveBeenCalledWith(
      expect.stringContaining("timed out"),
    );

    vi.useRealTimers();
    fetchSpy.mockRestore();
    errorLog.mockRestore();
  });
});
