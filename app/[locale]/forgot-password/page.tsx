import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import PageHero from "@/components/PageHero";
import SiteShell from "@/components/SiteShell";
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
    <SiteShell>
      <main>
        <PageHero
          title={t("forgotTitle")}
          label="Beyond Borders"
          image="/assets/images/heroes/pricing-header.jpg"
          summary={t("forgotSummary")}
        />
        <section className="section section-paper">
          <div className="container" style={{ maxWidth: "560px" }}>
            <form className="booking-form" action={requestCustomerResetAction}>
              <div className="form-grid">
                <div className="form-field full">
                  <label htmlFor="fp-email">{t("email")}</label>
                  <input
                    id="fp-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                  />
                </div>
              </div>
              <div className="booking-submit-row">
                <button className="btn btn-primary" type="submit">
                  {t("forgotCta")}
                </button>
                {error ? (
                  <p className="form-note" aria-live="polite">
                    {error}
                  </p>
                ) : null}
              </div>
              <p className="form-note">
                <Link href="/login">{t("backToLogin")}</Link>
              </p>
            </form>
          </div>
        </section>
      </main>
    </SiteShell>
  );
}
