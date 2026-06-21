import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import PageHero from "@/components/PageHero";
import SiteShell from "@/components/SiteShell";
import { loginAction } from "../account/actions";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your Beyond Borders account.",
};

type LoginPageProps = {
  searchParams: Promise<{ error?: string; next?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { error, next } = await searchParams;
  const t = await getTranslations("auth");
  const registerHref = next ? `/register?next=${encodeURIComponent(next)}` : "/register";

  return (
    <SiteShell>
      <main>
        <PageHero
          title={t("loginTitle")}
          label="Beyond Borders"
          image="/assets/images/heroes/pricing-header.jpg"
          summary={t("loginSummary")}
        />
        <section className="section section-paper">
          <div className="container" style={{ maxWidth: "560px" }}>
            <form className="booking-form" action={loginAction}>
              {next ? <input type="hidden" name="next" value={next} /> : null}
              <div className="form-grid">
                <div className="form-field full">
                  <label htmlFor="login-email">{t("email")}</label>
                  <input id="login-email" name="email" type="email" autoComplete="email" required />
                </div>
                <div className="form-field full">
                  <label htmlFor="login-password">{t("password")}</label>
                  <input id="login-password" name="password" type="password" autoComplete="current-password" required />
                </div>
              </div>
              <div className="booking-submit-row">
                <button className="btn btn-primary" type="submit">{t("signIn")}</button>
                {error ? <p className="form-note" aria-live="polite">{error}</p> : null}
              </div>
              <p className="form-note">
                {t("newHere")} <Link href={registerHref}>{t("createAccountLink")}</Link>.
              </p>
            </form>
          </div>
        </section>
      </main>
    </SiteShell>
  );
}
