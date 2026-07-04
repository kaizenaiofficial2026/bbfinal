import "server-only";

import { env } from "@/lib/env";
import { sendSms } from "./client";

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
 * Notify a payment was received. Sends TWO messages, each fail-soft:
 *  - the business team (designated env number), business-worded;
 *  - the customer (their own number, if we have one), customer-worded.
 */
export async function sendPaymentSms(input: {
  reference: string;
  amount: number;
  currency: string;
  customerName?: string | null;
  customerPhone?: string | null;
}): Promise<void> {
  await sendSms({
    to: env.smsTeamContact ?? "",
    message: buildPaymentSms(input),
  });

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

/** Notify the business team that a custom inquiry was submitted. Fail-soft. */
export async function sendInquirySms(input: {
  reference: string;
}): Promise<void> {
  await sendSms({
    to: env.smsTeamContact ?? "",
    message: buildInquirySms(input),
  });
}
