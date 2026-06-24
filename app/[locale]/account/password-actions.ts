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
import {
  createAndSendResetCode,
  verifyAndReset,
} from "@/lib/auth/password-reset";

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
