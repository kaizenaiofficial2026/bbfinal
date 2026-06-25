import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import AuthShell from "@/components/AuthShell";
import PasswordInput from "@/components/PasswordInput";
import SubmitButton from "@/components/SubmitButton";
import { resetCustomerPasswordAction } from "../account/password-actions";

export const metadata: Metadata = {
  title: "Reset password",
  description: "Set a new password for your Beyond Borders account.",
};

type ResetPasswordPageProps = {
  searchParams: Promise<{ email?: string; error?: string; sent?: string }>;
};

export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  const { email = "", error, sent } = await searchParams;
  const t = await getTranslations("auth");

  return (
    <AuthShell
      title={t("resetTitle")}
      subtitle={t("resetSummary")}
      footer={
        <p>
          <Link href="/forgot-password">{t("resendCode")}</Link>
        </p>
      }
    >
      <form className="auth-form" action={resetCustomerPasswordAction}>
        <input type="hidden" name="email" value={email} />
        {sent ? (
          <p className="auth-success" role="status">
            {t("resetSentNote")}
          </p>
        ) : null}
        <div className="auth-field">
          <label htmlFor="rp-email">{t("email")}</label>
          <input id="rp-email" type="email" value={email} disabled />
        </div>
        <div className="auth-field">
          <label htmlFor="rp-code">{t("codeLabel")}</label>
          <input
            id="rp-code"
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="\d{6}"
            maxLength={6}
            required
          />
        </div>
        <div className="auth-field">
          <label htmlFor="rp-password">{t("newPassword")}</label>
          <PasswordInput
            id="rp-password"
            name="password"
            autoComplete="new-password"
            minLength={8}
            required
          />
        </div>
        <div className="auth-field">
          <label htmlFor="rp-confirm">{t("confirmPassword")}</label>
          <PasswordInput
            id="rp-confirm"
            name="confirm"
            autoComplete="new-password"
            minLength={8}
            required
          />
        </div>
        {error ? (
          <p className="auth-alert" role="alert">
            {error}
          </p>
        ) : null}
        <SubmitButton className="btn btn-primary auth-submit">
          {t("resetCta")}
        </SubmitButton>
      </form>
    </AuthShell>
  );
}
