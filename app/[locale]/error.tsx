"use client";

import Link from "next/link";
import { useEffect } from "react";

/**
 * Public error boundary for the localized site. Server components and server
 * actions (booking, enquiry, custom quote) throw on unexpected failures; without
 * this, a visitor would drop onto Next.js's raw, unstyled error screen. This keeps
 * them on a branded page with a recoverable "Try again". It is a client component
 * (error boundaries must be), so it can't use the async SiteShell — it renders a
 * self-contained centered layout instead.
 */
export default function SiteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[site error]", error);
  }, [error]);

  return (
    <main>
      <section className="section section-paper">
        <div
          className="container"
          style={{
            minHeight: "min(72vh, 720px)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            gap: "1.25rem",
          }}
        >
          <span className="section-kicker">Something went wrong</span>
          <h1 className="display display-lg">We hit a snag</h1>
          <p className="lead" style={{ maxWidth: "52ch" }}>
            An unexpected error occurred while loading this page. Please try
            again — if it keeps happening, our team is here to help.
          </p>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "0.75rem",
              justifyContent: "center",
            }}
          >
            <button className="btn btn-primary" type="button" onClick={reset}>
              Try again
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
                <path
                  d="M5 12h14M13 6l6 6-6 6"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <Link className="btn btn-line" href="/">
              Back home
            </Link>
            <Link className="btn btn-line" href="/contacts">
              Contact us
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
