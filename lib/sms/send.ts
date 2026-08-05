import "server-only";

import { env } from "@/lib/env";
import { normalizeMsisdn, sendSms } from "./client";

/** "21/06/2026 11:14:46 AM" in Sri Lanka time, matching the agreed template. */
export function formatColomboDateTime(date: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Colombo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).formatToParts(date);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";

  const dayPeriod = get("dayPeriod").toUpperCase();
  return `${get("day")}/${get("month")}/${get("year")} ${get("hour")}:${get("minute")}:${get("second")} ${dayPeriod}`;
}

/** "USD 1,999.00" — currency code + grouped, 2-decimal amount. */
export function formatSmsAmount(currency: string, amount: number): string {
  const value = amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${currency} ${value}`;
}

/** Pure builder for the "payment received" SMS (business-facing). */
export function buildPaymentSms(input: {
  reference: string;
  amount: number;
  currency: string;
  date?: Date;
}): string {
  return [
    "Dear BEYOND BORDERS,",
    `You have received a payment of ${formatSmsAmount(input.currency, input.amount)}`,
    `Date ${formatColomboDateTime(input.date)}`,
    `Transaction Order Number "${input.reference}".`,
  ].join("\n");
}

/** Pure builder for the "payment received" SMS from the customer's point of view. */
export function buildCustomerPaymentSms(input: {
  customerName: string;
  reference: string;
  amount: number;
  currency: string;
  date?: Date;
}): string {
  return [
    `Dear ${input.customerName},`,
    `We have received your payment of ${formatSmsAmount(input.currency, input.amount)}`,
    `Date ${formatColomboDateTime(input.date)}`,
    `Transaction Order Number "${input.reference}".`,
  ].join("\n");
}

/** Pure builder for the "customer inquiry" SMS (business-facing). */
export function buildInquirySms(input: { reference: string; date?: Date }): string {
  return [
    "Dear BEYOND BORDERS,",
    `Transaction Order Number "${input.reference}".`,
    "You have received a customer inquiry.",
    `Date ${formatColomboDateTime(input.date)}`,
  ].join("\n");
}

/**
 * Split a comma-separated recipient list into individual numbers.
 *
 * Duplicates are dropped so a number listed twice (or written two ways —
 * `+94771234567` and `0771234567` are the same phone) is only texted once.
 * De-duplication keys on the normalised MSISDN and falls back to the raw string
 * for anything unroutable, which `sendSms` skips anyway.
 */
export function parseSmsRecipients(raw: string | null | undefined): string[] {
  const seen = new Set<string>();
  const recipients: string[] = [];

  for (const part of (raw ?? "").split(",")) {
    const value = part.trim();
    if (!value) continue;
    const key = normalizeMsisdn(value) ?? value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    recipients.push(value);
  }

  return recipients;
}

/**
 * Resolve the business recipients for one event, falling back to the single
 * legacy SMS_TEAM_CONTACT.
 *
 * The fallback is `||`, NOT `??`, on purpose: a variable that exists but is
 * blank — easy to produce by clearing a value in the dashboard instead of
 * deleting the row — means "not configured", exactly like unset. With `??` the
 * blank string would win the fallback and the event would text nobody.
 *
 * The empty case is logged because a successful send is silent: without this
 * line, "configured correctly" and "sending to nobody" produce identical output
 * and a misconfiguration can only be found by submitting a real inquiry.
 */
function businessRecipients(
  event: "payment" | "inquiry",
  configured: string | undefined,
): string[] {
  const recipients = parseSmsRecipients(configured || env.smsTeamContact);

  if (recipients.length === 0) {
    console.info(`[sms skipped] no business recipients configured for ${event}`);
  }

  return recipients;
}

/**
 * Notify a payment was received. Sends one message per recipient, each
 * fail-soft:
 *  - every business number in SMS_PAYMENT_CONTACTS, business-worded;
 *  - the customer (their own number, if we have one), customer-worded.
 */
export async function sendPaymentSms(input: {
  reference: string;
  amount: number;
  currency: string;
  customerName?: string | null;
  customerPhone?: string | null;
}): Promise<void> {
  const businessMessage = buildPaymentSms(input);
  // Sequential, not Promise.all: the Dialog gateway takes one message per call
  // and a failure is logged-and-swallowed inside sendSms, so one bad number
  // never stops the rest of the list.
  for (const to of businessRecipients("payment", env.smsPaymentContacts)) {
    await sendSms({ to, message: businessMessage });
  }

  const customerPhone = input.customerPhone?.trim();
  if (customerPhone) {
    await sendSms({
      to: customerPhone,
      message: buildCustomerPaymentSms({
        customerName: input.customerName?.trim() || "Customer",
        reference: input.reference,
        amount: input.amount,
        currency: input.currency,
      }),
    });
  }
}

/**
 * Notify the business team that a custom inquiry was submitted — one message per
 * number in SMS_INQUIRY_CONTACTS. Never the customer (that stays email-only).
 * Fail-soft.
 */
export async function sendInquirySms(input: {
  reference: string;
}): Promise<void> {
  const message = buildInquirySms(input);
  for (const to of businessRecipients("inquiry", env.smsInquiryContacts)) {
    await sendSms({ to, message });
  }
}
