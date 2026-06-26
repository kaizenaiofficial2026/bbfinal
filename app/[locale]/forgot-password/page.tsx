import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import AuthShell from "@/components/AuthShell";
import AuthErrorToast from "@/components/AuthErrorToast";
import SubmitButton from "@/components/SubmitButton";
import { requestCustomerResetAction } from "../account/password-actions";

export const metadata: Metadata = {
  title: "Forgot password",
  description: "Reset your Beyond Borders account password.",
};

type ForgotPasswordPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function ForgotPasswordPage({
  searchParams,
}: ForgotPasswordPageProps) {
  const { error } = await searchParams;
  const t = await getTranslations("auth");

  return (
    <AuthShell
      title={t("forgotTitle")}
      subtitle={t("forgotSummary")}
      footer={
        <p>
          <Link href="/login">{t("backToLogin")}</Link>
        </p>
      }
    >
      <AuthErrorToast error={error} />
      <form className="auth-form" action={requestCustomerResetAction}>
        <div className="auth-field">
          <label htmlFor="fp-email">{t("email")}</label>
          <input
            id="fp-email"
            name="email"
            type="email"
            autoComplete="email"
            required
          />
        </div>
        {error ? (
          <p className="auth-alert" role="alert">
            {error}
          </p>
        ) : null}
        <SubmitButton className="btn btn-primary auth-submit">
          {t("forgotCta")}
        </SubmitButton>
      </form>
    </AuthShell>
  );
}
