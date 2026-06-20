import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/PageHero";
import SiteShell from "@/components/SiteShell";
import { registerAction } from "@/app/account/actions";

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
  const loginHref = next ? `/login?next=${encodeURIComponent(next)}` : "/login";

  return (
    <SiteShell>
      <main>
        <PageHero
          title="Create your account"
          label="Beyond Borders"
          image="/assets/images/heroes/pricing-header.jpg"
          summary="Register to reserve a journey. Accounts are reviewed by our team before booking."
        />
        <section className="section section-paper">
          <div className="container" style={{ maxWidth: "560px" }}>
            <form className="booking-form" action={registerAction}>
              {next ? <input type="hidden" name="next" value={next} /> : null}
              <div className="form-grid">
                <div className="form-field full">
                  <label htmlFor="register-name">Full name</label>
                  <input id="register-name" name="fullName" type="text" autoComplete="name" required />
                </div>
                <div className="form-field full">
                  <label htmlFor="register-email">Email</label>
                  <input id="register-email" name="email" type="email" autoComplete="email" required />
                </div>
                <div className="form-field full">
                  <label htmlFor="register-phone">Phone</label>
                  <input id="register-phone" name="phone" type="tel" autoComplete="tel" placeholder="+94 77 000 0000" />
                </div>
                <div className="form-field full">
                  <label htmlFor="register-password">Password</label>
                  <input id="register-password" name="password" type="password" autoComplete="new-password" minLength={8} required />
                </div>
              </div>
              <div className="booking-submit-row">
                <button className="btn btn-primary" type="submit">Create account</button>
                {error ? <p className="form-note" aria-live="polite">{error}</p> : null}
              </div>
              <p className="form-note">
                Already have an account? <Link href={loginHref}>Sign in</Link>.
              </p>
            </form>
          </div>
        </section>
      </main>
    </SiteShell>
  );
}
