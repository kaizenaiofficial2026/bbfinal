import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import AuthShell from "@/components/AuthShell";
import AuthErrorToast from "@/components/AuthErrorToast";
import PasswordInput from "@/components/PasswordInput";
import SubmitButton from "@/components/SubmitButton";
import { loginAction } from "../account/actions";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your Beyond Borders account.",
};

type LoginPageProps = {
  searchParams: Promise<{ error?: string; next?: string; reset?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { error, next, reset } = await searchParams;
  const t = await getTranslations("auth");
  const registerHref = next
    ? `/register?next=${encodeURIComponent(next)}`
    : "/register";

  return (
    <AuthShell
      title={t("loginTitle")}
      subtitle={t("loginSummary")}
      footer={
        <>
          <p>
            {t("newHere")}{" "}
            <Link href={registerHref}>{t("createAccountLink")}</Link>
          </p>
          <p>
            <Link href="/forgot-password">{t("forgotLink")}</Link>
          </p>
        </>
      }
    >
      <AuthErrorToast error={error} />
      <form className="auth-form" action={loginAction}>
        {next ? <input type="hidden" name="next" value={next} /> : null}
        {reset ? (
          <p className="auth-success" role="status">
            {t("resetSuccessNote")}
          </p>
        ) : null}
        <div className="auth-field">
          <label htmlFor="login-email">{t("email")}</label>
          <input
            id="login-email"
            name="email"
            type="email"
            autoComplete="email"
            required
          />
        </div>
        <div className="auth-field">
          <label htmlFor="login-password">{t("password")}</label>
          <PasswordInput
            id="login-password"
            name="password"
            autoComplete="current-password"
            required
          />
        </div>
        {error ? (
          <p className="auth-alert" role="alert">
            {error}
          </p>
        ) : null}
        <SubmitButton className="btn btn-primary auth-submit">
          {t("signIn")}
        </SubmitButton>
      </form>
    </AuthShell>
  );
}
