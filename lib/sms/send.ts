import "server-only";

import { env } from "@/lib/env";
import { sendSms, type SmsResult } from "./client";

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

/** Pure builder for the "customer inquiry" SMS (business-facing). */
export function buildInquirySms(input: { reference: string; date?: Date }): string {
  return [
    "Dear BEYOND BORDERS,",
    `Transaction Order Number "${input.reference}".`,
    "You have received a customer inquiry.",
    `Date ${formatColomboDateTime(input.date)}`,
  ].join("\n");
}

/** Notify the business team that a payment was received. Fail-soft. */
export function sendPaymentSms(input: {
  reference: string;
  amount: number;
  currency: string;
}): Promise<SmsResult> {
  return sendSms({
    to: env.smsTeamContact ?? "",
    message: buildPaymentSms(input),
  });
}

/** Notify the business team that a custom inquiry was submitted. Fail-soft. */
export function sendInquirySms(input: { reference: string }): Promise<SmsResult> {
  return sendSms({
    to: env.smsTeamContact ?? "",
    message: buildInquirySms(input),
  });
}
