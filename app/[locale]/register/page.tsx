import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import AuthShell from "@/components/AuthShell";
import AuthErrorToast from "@/components/AuthErrorToast";
import PasswordInput from "@/components/PasswordInput";
import RegisterContactFields from "@/components/RegisterContactFields";
import SubmitButton from "@/components/SubmitButton";
import { registerAction } from "../account/actions";

export const metadata: Metadata = {
  title: "Create an account",
  description:
    "Register to reserve a Beyond Borders journey and pay securely online.",
};

type RegisterPageProps = {
  searchParams: Promise<{ error?: string; next?: string }>;
};

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const { error, next } = await searchParams;
  const t = await getTranslations("auth");
  const loginHref = next ? `/login?next=${encodeURIComponent(next)}` : "/login";

  return (
    <AuthShell
      title={t("registerTitle")}
      subtitle={t("registerSummary")}
      asideVariant="register"
      footer={
        <p>
          {t("haveAccount")} <Link href={loginHref}>{t("signIn")}</Link>
        </p>
      }
    >
      <AuthErrorToast error={error} />
      <form className="auth-form" action={registerAction}>
        {next ? <input type="hidden" name="next" value={next} /> : null}
        {/* Honeypot — hidden from humans; bots fill it and are rejected. */}
        <input
          type="text"
          name="company"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          style={{
            position: "absolute",
            left: "-9999px",
            width: "1px",
            height: "1px",
            opacity: 0,
          }}
        />

        <div className="auth-grid-2">
          <div className="auth-field">
            <label htmlFor="reg-first">{t("firstName")}</label>
            <input
              id="reg-first"
              name="firstName"
              type="text"
              autoComplete="given-name"
              required
            />
          </div>
          <div className="auth-field">
            <label htmlFor="reg-last">{t("lastName")}</label>
            <input
              id="reg-last"
              name="lastName"
              type="text"
              autoComplete="family-name"
              required
            />
          </div>
        </div>

        <div className="auth-field">
          <label htmlFor="reg-email">{t("email")}</label>
          <input
            id="reg-email"
            name="email"
            type="email"
            autoComplete="email"
            required
          />
        </div>

        {/* Country first, then Mobile (auto-prefilled with the country's
            dialling code), then DOB — all in one client island. */}
        <RegisterContactFields />

        <div className="auth-grid-2">
          <div className="auth-field">
            <label htmlFor="reg-passport">{t("passportNumber")}</label>
            <input
              id="reg-passport"
              name="passportNumber"
              type="text"
              autoComplete="off"
              required
            />
          </div>
          <div className="auth-field">
            <label htmlFor="reg-passport-exp">{t("passportExpiry")}</label>
            <input
              id="reg-passport-exp"
              name="passportExpiry"
              type="date"
              required
            />
          </div>
        </div>

        <div className="auth-grid-2">
          <div className="auth-field">
            <label htmlFor="reg-password">{t("password")}</label>
            <PasswordInput
              id="reg-password"
              name="password"
              autoComplete="new-password"
              minLength={8}
              required
            />
          </div>
          <div className="auth-field">
            <label htmlFor="reg-confirm-password">{t("confirmPassword")}</label>
            <PasswordInput
              id="reg-confirm-password"
              name="confirmPassword"
              autoComplete="new-password"
              minLength={8}
              required
            />
          </div>
        </div>

        {error ? (
          <p className="auth-alert" role="alert">
            {error}
          </p>
        ) : null}
        <SubmitButton className="btn btn-primary auth-submit">
          {t("createAccount")}
        </SubmitButton>
      </form>
    </AuthShell>
  );
}
