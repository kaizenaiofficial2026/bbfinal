import "server-only";

import { env } from "@/lib/env";

export type SmsResult = {
  skipped: boolean;
};

/**
 * SMS is usable only when explicitly enabled AND the credentials + recipient are
 * configured. Mirrors the email transport's fail-soft contract (getMailTransport).
 */
export function canUseSms(): boolean {
  return Boolean(
    env.smsEnabled && env.smsUserId && env.smsApiKey && env.smsTeamContact,
  );
}

/**
 * Low-level send via the smslenz.lk API. Fail-soft by design: it never throws —
 * a missing config or a gateway error is logged and reported as skipped, so the
 * inquiry / payment flows that call it are never interrupted by SMS problems.
 *
 * smslenz expects: user_id, api_key, sender_id, contact (+94…), message (≤621).
 * Sent as JSON here; if a tenant rejects JSON, swap the body/header for
 * `new URLSearchParams(payload)` + form-urlencoded (params are identical).
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

  const payload = {
    user_id: env.smsUserId,
    api_key: env.smsApiKey,
    sender_id: env.smsSenderId,
    contact: to,
    message,
  };

  try {
    const response = await fetch(env.smsBaseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      // Do NOT follow redirects: smslenz answers unauthenticated/invalid requests
      // with a 302 to its homepage. Following it would land on a 200 and report a
      // false success. With manual handling a 3xx stays non-ok below.
      redirect: "manual",
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.error(`[sms failed] ${response.status} ${detail}`.trim());
      return { skipped: true };
    }

    return { skipped: false };
  } catch (error) {
    console.error("[sms error]", error);
    return { skipped: true };
  }
}
