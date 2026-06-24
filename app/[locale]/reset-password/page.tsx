import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import PageHero from "@/components/PageHero";
import SiteShell from "@/components/SiteShell";
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
    <SiteShell>
      <main>
        <PageHero
          title={t("resetTitle")}
          label="Beyond Borders"
          image="/assets/images/heroes/pricing-header.jpg"
          summary={t("resetSummary")}
        />
        <section className="section section-paper">
          <div className="container" style={{ maxWidth: "560px" }}>
            <form
              className="booking-form"
              action={resetCustomerPasswordAction}
            >
              <input type="hidden" name="email" value={email} />
              {sent ? (
                <p className="form-note" aria-live="polite">
                  {t("resetSentNote")}
                </p>
              ) : null}
              <div className="form-grid">
                <div className="form-field full">
                  <label htmlFor="rp-email">{t("email")}</label>
                  <input
                    id="rp-email"
                    type="email"
                    value={email}
                    disabled
                  />
                </div>
                <div className="form-field full">
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
                <div className="form-field full">
                  <label htmlFor="rp-password">{t("newPassword")}</label>
                  <input
                    id="rp-password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    minLength={8}
                    required
                  />
                </div>
                <div className="form-field full">
                  <label htmlFor="rp-confirm">{t("confirmPassword")}</label>
                  <input
                    id="rp-confirm"
                    name="confirm"
                    type="password"
                    autoComplete="new-password"
                    minLength={8}
                    required
                  />
                </div>
              </div>
              <div className="booking-submit-row">
                <button className="btn btn-primary" type="submit">
                  {t("resetCta")}
                </button>
                {error ? (
                  <p className="form-note" aria-live="polite">
                    {error}
                  </p>
                ) : null}
              </div>
              <p className="form-note">
                <Link href="/forgot-password">{t("resendCode")}</Link>
              </p>
            </form>
          </div>
        </section>
      </main>
    </SiteShell>
  );
}
