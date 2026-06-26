import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import BodyScrollReset from "@/components/BodyScrollReset";

export const metadata: Metadata = {
  title: "Page not found",
  description:
    "The page you are looking for has moved or no longer exists. Explore Beyond Borders destinations and tours instead.",
};

/**
 * Root-level (global) not-found boundary. Catches every unmatched route that
 * escapes the [locale] segment — deep unknown paths like /a/b/c, unknown
 * /admin/* URLs and anything the locale router can't place — which would
 * otherwise fall through to Next.js's bare default 404.
 *
 * It renders standalone: the public Header/Footer rely on the client intl
 * context that only exists inside [locale]/layout, which does NOT wrap this
 * boundary, so this page brings its own brand mark and chrome. Copy is plain
 * English (no i18n runtime dependency) on purpose — this is the last line of
 * defence and must never itself fail. In-locale 404s (e.g. an unknown
 * destination slug) still render the richer, translated app/[locale]/not-found.
 */
export default function GlobalNotFound() {
  return (
    <main className="notfound-shell">
      <BodyScrollReset />
      <div className="grain" aria-hidden="true" />
      <section className="notfound-panel">
        <Link
          href="/"
          className="notfound-brand"
          aria-label="Beyond Borders home"
        >
          <Image
            src="/assets/images/brand/logo.png"
            alt="Beyond Borders"
            width={168}
            height={82}
            priority
            unoptimized
          />
        </Link>
        <span className="section-kicker">Error 404</span>
        <h1 className="display display-lg">This route isn&apos;t on our map.</h1>
        <p className="lead">
          The page you were looking for has moved, changed, or never existed.
          Let&apos;s get you back to planning your journey through Sri Lanka.
        </p>
        <div className="notfound-actions">
          <Link className="btn btn-primary" href="/">
            Back to home
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
              <path
                d="M5 12h14M13 6l6 6-6 6"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
          <Link className="btn btn-line" href="/destinations">
            Explore destinations
          </Link>
          <Link className="btn btn-line" href="/tours">
            View tours
          </Link>
        </div>
      </section>
    </main>
  );
}
