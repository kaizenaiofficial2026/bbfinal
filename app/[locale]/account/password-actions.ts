"use server";

import { getLocale, getTranslations } from "next-intl/server";
import { localeRedirect } from "@/lib/i18n/redirect";
import { env } from "@/lib/env";
import { checkAndRecordRateLimit } from "@/lib/data/rate-limit";
import { getRequestIpHash } from "@/lib/security/request";
import {
  requestResetSchema,
  resetPasswordSchema,
} from "@/lib/validation/account";
// Generic change-password schema (current + new + OTP); shared with the admin.
import { changePasswordSchema } from "@/lib/validation/admin";
import {
  createAndSendResetCode,
  verifyAndReset,
} from "@/lib/auth/password-reset";
import { getCustomerUser } from "@/lib/customer/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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
  const rate = await checkAndRecordRateLimit("password-reset-request", ipHash, {
    max: 5,
    windowMinutes: 30,
  });
  if (!rate.allowed) {
    localeRedirect(
      `/forgot-password?error=${encodeURIComponent(t("waitMoment"))}`,
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
  const rate = await checkAndRecordRateLimit("password-reset-verify", ipHash, {
    max: 10,
    windowMinutes: 15,
  });
  if (!rate.allowed) {
    return back(t("waitMoment"));
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

/* ---- Logged-in customer: change password from the account area ---- */

export async function sendCustomerPasswordOtpAction() {
  const locale = await getLocale();
  const session = await getCustomerUser();
  if (!session) {
    localeRedirect("/login?next=/account", locale);
  }
  const email = session.user.email;

  const ipHash = await getRequestIpHash();
  const rate = await checkAndRecordRateLimit(
    "customer-password-change-otp",
    ipHash,
    { max: 5, windowMinutes: 30 },
  );
  if (!rate.allowed) {
    const t = await getTranslations("serverActions");
    localeRedirect(
      `/account?error=${encodeURIComponent(t("waitMoment"))}`,
      locale,
    );
  }

  const base = locale === "en" ? "" : `/${locale}`;
  const resetUrl = `${env.siteUrl}${base}/reset-password?email=${encodeURIComponent(email)}`;
  await createAndSendResetCode({ email, audience: "customer", resetUrl });

  localeRedirect("/account?sent=1", locale);
}

export async function changeCustomerPasswordAction(formData: FormData) {
  const locale = await getLocale();
  const t = await getTranslations("serverActions");
  const session = await getCustomerUser();
  if (!session) {
    localeRedirect("/login?next=/account", locale);
  }
  const email = session.user.email;

  const back = (message: string): never =>
    localeRedirect(`/account?error=${encodeURIComponent(message)}`, locale);

  const parsed = changePasswordSchema.safeParse({
    oldPassword: formString(formData, "oldPassword"),
    password: formString(formData, "password"),
    confirm: formString(formData, "confirm"),
    code: formString(formData, "code"),
  });
  if (!parsed.success) {
    return back(parsed.error.issues[0]?.message ?? t("checkForm"));
  }

  const ipHash = await getRequestIpHash();
  const rate = await checkAndRecordRateLimit(
    "customer-password-change",
    ipHash,
    { max: 10, windowMinutes: 15 },
  );
  if (!rate.allowed) {
    return back(t("waitMoment"));
  }

  // 1) Confirm the current password by re-authenticating.
  const supabase = await createSupabaseServerClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password: parsed.data.oldPassword,
  });
  if (signInError) {
    return back(t("currentPasswordWrong"));
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
    return back(messages[result.reason]);
  }

  // 3) Refresh the session with the new password so they stay signed in.
  await supabase.auth.signInWithPassword({
    email,
    password: parsed.data.password,
  });

  localeRedirect("/account?changed=1", locale);
}
