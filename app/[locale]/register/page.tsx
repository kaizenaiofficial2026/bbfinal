import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import PageHero from "@/components/PageHero";
import SiteShell from "@/components/SiteShell";
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
    <SiteShell>
      <main>
        <PageHero
          title={t("registerTitle")}
          label="Beyond Borders"
          image="/assets/images/heroes/pricing-header.jpg"
          summary={t("registerSummary")}
        />
        <section className="section section-paper">
          <div className="container" style={{ maxWidth: "560px" }}>
            <form className="booking-form" action={registerAction}>
              {next ? <input type="hidden" name="next" value={next} /> : null}
              <div className="form-grid">
                <div className="form-field full">
                  <label htmlFor="register-name">{t("fullName")}</label>
                  <input id="register-name" name="fullName" type="text" autoComplete="name" required />
                </div>
                <div className="form-field full">
                  <label htmlFor="register-email">{t("email")}</label>
                  <input id="register-email" name="email" type="email" autoComplete="email" required />
                </div>
                <div className="form-field full">
                  <label htmlFor="register-phone">{t("phone")}</label>
                  <input id="register-phone" name="phone" type="tel" autoComplete="tel" placeholder="+94 77 000 0000" />
                </div>
                <div className="form-field full">
                  <label htmlFor="register-password">{t("password")}</label>
                  <input id="register-password" name="password" type="password" autoComplete="new-password" minLength={8} required />
                </div>
              </div>
              <div className="booking-submit-row">
                <button className="btn btn-primary" type="submit">{t("createAccount")}</button>
                {error ? <p className="form-note" aria-live="polite">{error}</p> : null}
              </div>
              <p className="form-note">
                {t("haveAccount")} <Link href={loginHref}>{t("signIn")}</Link>.
              </p>
            </form>
          </div>
        </section>
      </main>
    </SiteShell>
  );
}
