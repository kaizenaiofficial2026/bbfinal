import "server-only";

import { createHash } from "node:crypto";
import { env } from "@/lib/env";

export type SmsResult = {
  skipped: boolean;
};

/**
 * SMS is usable only when explicitly enabled AND the Dialog credentials +
 * recipient are configured. Mirrors the email transport's fail-soft contract
 * (getMailTransport).
 */
export function canUseSms(): boolean {
  return Boolean(
    env.smsEnabled &&
      env.smsUsername &&
      env.smsPassword &&
      env.smsMask &&
      env.smsTeamContact,
  );
}

/**
 * Normalise a phone number to the Dialog MSISDN format: digits only, prefixed
 * with the Sri Lanka country code `94` and no leading `+`. Handles the common
 * inputs — `+94771234567`, `0771234567`, `94771234567`, `771234567`.
 */
export function normalizeMsisdn(input: string): string | null {
  const trimmed = input.trim();
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length < 9) return null;

  // Already Sri Lankan.
  if (digits.startsWith("94")) return digits;

  // A LOCAL number: either 0771234567 or the bare 9-digit 771234567. Only these
  // may be given the 94 country code.
  const local = digits.startsWith("0") ? digits.slice(1) : digits;
  const isLocalShape =
    (digits.startsWith("0") || !trimmed.startsWith("+")) &&
    local.length === 9 &&
    local.startsWith("7");
  if (isLocalShape) return `94${local}`;

  // Anything else is a FOREIGN number. Blindly prefixing 94 turned a UK
  // "07700 900123" into a valid Sri Lankan MSISDN belonging to a stranger, who
  // then received the customer's name, order reference and amount. The Dialog
  // gateway only delivers to Sri Lankan networks, so skip instead of misrouting.
  return null;
}

/** Dialog's `CREATED` header timestamp: `YYYY-MM-DDTHH:mm:ss` (no milliseconds). */
function createdTimestamp(): string {
  return new Date().toISOString().replace(/\.\d+Z$/, "");
}

/**
 * Low-level send via the Dialog RichCommunication gateway. Fail-soft by design:
 * it never throws — a missing config or a gateway error is logged and reported
 * as skipped, so the inquiry / payment flows that call it are never interrupted
 * by SMS problems.
 *
 * Auth is per request (no login / token): headers USER (username), DIGEST
 * (MD5 of the password) and CREATED (timestamp). The body carries one message
 * with the registered `mask` as the sender. The gateway answers HTTP 200 even
 * for logical failures, so success is a top-level `resultCode` of 0.
 */
export async function sendSms({
  to,
  message,
}: {
  to: string;
  message: string;
}): Promise<SmsResult> {
  if (!canUseSms()) {
    console.info("[sms skipped] not configured");
    return { skipped: true };
  }

  // Never guess a recipient: an unroutable/foreign number is skipped rather than
  // coerced into a Sri Lankan MSISDN that belongs to somebody else.
  const msisdn = normalizeMsisdn(to);
  if (!msisdn) {
    console.info("[sms skipped] not a deliverable Sri Lankan number");
    return { skipped: true };
  }

  const digest = createHash("md5")
    .update(env.smsPassword ?? "")
    .digest("hex");

  const body = {
    messages: [
      {
        clientRef: Date.now(),
        number: msisdn,
        mask: env.smsMask,
        text: message,
      },
    ],
  };

  try {
    const response = await fetch(env.smsBaseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        USER: env.smsUsername ?? "",
        DIGEST: digest,
        CREATED: createdTimestamp(),
      },
      body: JSON.stringify(body),
      redirect: "manual",
    });

    const raw = await response.text().catch(() => "");

    if (!response.ok) {
      console.error(`[sms failed] HTTP ${response.status} ${raw}`.trim());
      return { skipped: true };
    }

    let resultCode: unknown;
    try {
      resultCode = (JSON.parse(raw) as { resultCode?: unknown }).resultCode;
    } catch {
      resultCode = undefined;
    }

    if (resultCode !== 0) {
      console.error(
        `[sms failed] gateway resultCode=${String(resultCode)} ${raw}`.trim(),
      );
      return { skipped: true };
    }

    return { skipped: false };
  } catch (error) {
    console.error("[sms error]", error);
    return { skipped: true };
  }
}
