"use server";

import { getLocale, getTranslations } from "next-intl/server";
import { localeRedirect } from "@/lib/i18n/redirect";
import { env } from "@/lib/env";
import { checkAndRecordRateLimit } from "@/lib/data/rate-limit";
import { getRequestIpHash, scopedRateKey } from "@/lib/security/request";
import { toRetryMinutes } from "@/lib/security/retry-after";
import {
  requestResetSchema,
  resetPasswordSchema,
} from "@/lib/validation/account";
// Change-password schemas (current + new [+ OTP]); shared with the admin.
import {
  changePasswordSchema,
  startChangePasswordSchema,
} from "@/lib/validation/admin";
import {
  createAndSendResetCode,
  verifyAndReset,
} from "@/lib/auth/password-reset";
import { getCustomerUser } from "@/lib/customer/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { PasswordStepState } from "./password-change-state";

function formString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "");
}

export async function requestCustomerResetAction(formData: FormData) {
  const locale = await getLocale();
  const t = await getTranslations("serverActions");

  const parsed = requestResetSchema.safeParse({
    email: formString(formData, "email"),
  });
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? t("checkForm");
    localeRedirect(
      `/forgot-password?error=${encodeURIComponent(message)}`,
      locale,
    );
  }

  const ipHash = await getRequestIpHash();
  const rate = await checkAndRecordRateLimit(
    "password-reset-request",
    scopedRateKey(ipHash, parsed.data.email),
    { max: 5, windowMinutes: 30 },
  );
  if (!rate.allowed) {
    const message = t("rateLimited", {
      minutes: toRetryMinutes(rate.retryAfterSeconds),
    });
    localeRedirect(
      `/forgot-password?error=${encodeURIComponent(message)}`,
      locale,
    );
  }

  const email = parsed.data.email;
  const base = locale === "en" ? "" : `/${locale}`;
  const resetUrl = `${env.siteUrl}${base}/reset-password?email=${encodeURIComponent(email)}`;
  await createAndSendResetCode({ email, audience: "customer", resetUrl });

  localeRedirect(
    `/reset-password?email=${encodeURIComponent(email)}&sent=1`,
    locale,
  );
}

export async function resetCustomerPasswordAction(formData: FormData) {
  const locale = await getLocale();
  const t = await getTranslations("serverActions");
  const email = formString(formData, "email");

  const back = (message: string): never =>
    localeRedirect(
      `/reset-password?email=${encodeURIComponent(email)}&error=${encodeURIComponent(message)}`,
      locale,
    );

  const parsed = resetPasswordSchema.safeParse({
    email,
    code: formString(formData, "code"),
    password: formString(formData, "password"),
    confirm: formString(formData, "confirm"),
  });
  if (!parsed.success) {
    return back(parsed.error.issues[0]?.message ?? t("checkForm"));
  }

  const ipHash = await getRequestIpHash();
  const rate = await checkAndRecordRateLimit(
    "password-reset-verify",
    scopedRateKey(ipHash, email),
    { max: 10, windowMinutes: 15 },
  );
  if (!rate.allowed) {
    return back(
      t("rateLimited", { minutes: toRetryMinutes(rate.retryAfterSeconds) }),
    );
  }

  const result = await verifyAndReset({
    email: parsed.data.email,
    code: parsed.data.code,
    newPassword: parsed.data.password,
    audience: "customer",
  });

  if (!result.ok) {
    const messages: Record<typeof result.reason, string> = {
      invalid: t("resetInvalidCode"),
      expired: t("resetCodeExpired"),
      too_many: t("resetTooMany"),
      server: t("resetServerError"),
    };
    return back(messages[result.reason]);
  }

  localeRedirect("/login?reset=1", locale);
}

/* ---- Logged-in customer: 2-step change password from the account area ---- */

/** Send the OTP to the signed-in customer (shared by step 1 + "resend"). */
async function sendCustomerOtp(email: string, locale: string) {
  const base = locale === "en" ? "" : `/${locale}`;
  const resetUrl = `${env.siteUrl}${base}/reset-password?email=${encodeURIComponent(email)}`;
  await createAndSendResetCode({ email, audience: "customer", resetUrl });
}

/**
 * Step 1: verify the current password + new-password pair, then email a code.
 * Returns state (no redirect) so the client wizard can advance to step 2.
 */
export async function startCustomerPasswordChangeAction(
  _prev: PasswordStepState,
  formData: FormData,
): Promise<PasswordStepState> {
  const locale = await getLocale();
  const t = await getTranslations("serverActions");
  const session = await getCustomerUser();
  if (!session) {
    localeRedirect("/login?next=/account", locale);
  }
  const email = session.user.email;

  const parsed = startChangePasswordSchema.safeParse({
    oldPassword: formString(formData, "oldPassword"),
    password: formString(formData, "password"),
    confirm: formString(formData, "confirm"),
  });
  if (!parsed.success) {
    return { ok: false, note: parsed.error.issues[0]?.message ?? t("checkForm") };
  }

  // Confirm the current password before advancing / emailing a code.
  const supabase = await createSupabaseServerClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password: parsed.data.oldPassword,
  });
  if (signInError) {
    return { ok: false, note: t("currentPasswordWrong") };
  }

  const ipHash = await getRequestIpHash();
  const rate = await checkAndRecordRateLimit(
    "customer-password-change-otp",
    scopedRateKey(ipHash, email),
    { max: 5, windowMinutes: 30 },
  );
  if (!rate.allowed) {
    return {
      ok: false,
      note: t("rateLimited", { minutes: toRetryMinutes(rate.retryAfterSeconds) }),
    };
  }

  await sendCustomerOtp(email, locale);

  const tAuth = await getTranslations("auth");
  return { ok: true, note: tAuth("codeSentTo", { email }) };
}

/** Step 2 "resend": email a fresh code without re-entering passwords. */
export async function resendCustomerPasswordOtpAction(
  _prev: PasswordStepState,
  _formData: FormData,
): Promise<PasswordStepState> {
  const locale = await getLocale();
  const t = await getTranslations("serverActions");
  const session = await getCustomerUser();
  if (!session) {
    localeRedirect("/login?next=/account", locale);
  }
  const email = session.user.email;

  const ipHash = await getRequestIpHash();
  const rate = await checkAndRecordRateLimit(
    "customer-password-change-otp",
    scopedRateKey(ipHash, email),
    { max: 5, windowMinutes: 30 },
  );
  if (!rate.allowed) {
    return {
      ok: false,
      note: t("rateLimited", { minutes: toRetryMinutes(rate.retryAfterSeconds) }),
    };
  }

  await sendCustomerOtp(email, locale);

  const tAuth = await getTranslations("auth");
  return { ok: true, note: tAuth("codeSentTo", { email }) };
}

/**
 * Step 2: verify the emailed code (with the carried current + new passwords)
 * and apply the change. Returns state so the wizard can toast + reset inline.
 */
export async function changeCustomerPasswordAction(
  _prev: PasswordStepState,
  formData: FormData,
): Promise<PasswordStepState> {
  const locale = await getLocale();
  const t = await getTranslations("serverActions");
  const session = await getCustomerUser();
  if (!session) {
    localeRedirect("/login?next=/account", locale);
  }
  const email = session.user.email;

  const parsed = changePasswordSchema.safeParse({
    oldPassword: formString(formData, "oldPassword"),
    password: formString(formData, "password"),
    confirm: formString(formData, "confirm"),
    code: formString(formData, "code"),
  });
  if (!parsed.success) {
    return { ok: false, note: parsed.error.issues[0]?.message ?? t("checkForm") };
  }

  const ipHash = await getRequestIpHash();
  const rate = await checkAndRecordRateLimit(
    "customer-password-change",
    scopedRateKey(ipHash, email),
    { max: 10, windowMinutes: 15 },
  );
  if (!rate.allowed) {
    return {
      ok: false,
      note: t("rateLimited", { minutes: toRetryMinutes(rate.retryAfterSeconds) }),
    };
  }

  // 1) Confirm the current password by re-authenticating.
  const supabase = await createSupabaseServerClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password: parsed.data.oldPassword,
  });
  if (signInError) {
    return { ok: false, note: t("currentPasswordWrong") };
  }

  // 2) Verify the emailed code and apply the new password.
  const result = await verifyAndReset({
    email,
    code: parsed.data.code,
    newPassword: parsed.data.password,
    audience: "customer",
  });
  if (!result.ok) {
    const messages: Record<typeof result.reason, string> = {
      invalid: t("resetInvalidCode"),
      expired: t("resetCodeExpired"),
      too_many: t("resetTooMany"),
      server: t("resetServerError"),
    };
    return { ok: false, note: messages[result.reason] };
  }

  // 3) Refresh the session with the new password so they stay signed in.
  await supabase.auth.signInWithPassword({
    email,
    password: parsed.data.password,
  });

  const tAuth = await getTranslations("auth");
  return { ok: true, note: tAuth("passwordChangedNote") };
}
