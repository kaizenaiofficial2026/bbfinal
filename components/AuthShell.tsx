import type { ReactNode } from "react";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import RemovePreloadLock from "@/components/RemovePreloadLock";

type AuthShellProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  /** The account-switch / helper links rendered under the form. */
  footer?: ReactNode;
};

/**
 * Focused split-panel auth screen (login / register / password flows):
 * a warm brand-gradient marketing panel beside a clean form panel. Replaces the
 * old full-hero + stacked-form layout. Renders its own minimal shell (no site
 * nav/footer) for a distraction-free sign-in, à la the inspiration design.
 */
export default async function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: AuthShellProps) {
  const t = await getTranslations("auth");

  return (
    <main className="auth-shell">
      <RemovePreloadLock />
      <div className="auth-card">
        <Link className="auth-back-home" href="/" aria-label="Back to home">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M15 18l-6-6 6-6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>
        <aside className="auth-aside">
          <Link className="auth-aside-brand" href="/" aria-label="Beyond Borders home">
            <Image
              src="/assets/images/brand/logo.png"
              alt="Beyond Borders"
              width={150}
              height={73}
              priority
            />
          </Link>
          <div className="auth-aside-copy">
            <span className="auth-aside-kicker">{t("asideKicker")}</span>
            <p className="auth-aside-headline">{t("asideHeadline")}</p>
          </div>
        </aside>

        <section className="auth-panel">
          <Link className="auth-panel-brand" href="/" aria-label="Beyond Borders home">
            <Image
              src="/assets/images/brand/logo.png"
              alt="Beyond Borders"
              width={132}
              height={64}
            />
          </Link>
          <h1 className="auth-title">{title}</h1>
          {subtitle ? <p className="auth-subtitle">{subtitle}</p> : null}
          {children}
          {footer ? <div className="auth-footer">{footer}</div> : null}
        </section>
      </div>
    </main>
  );
}
