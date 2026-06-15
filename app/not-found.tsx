import type { Metadata } from "next";
import Link from "next/link";
import SiteShell from "@/components/SiteShell";

export const metadata: Metadata = {
  title: "Page not found",
  description:
    "The page you are looking for has moved or no longer exists. Explore Beyond Borders destinations and tours instead.",
};

export default function NotFound() {
  return (
    <SiteShell>
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
            <span className="section-kicker">Error 404</span>
            <h1 className="display display-lg">This route isn’t on our map.</h1>
            <p className="lead" style={{ maxWidth: "52ch" }}>
              The page you were looking for has moved, changed, or never existed.
              Let’s get you back to planning your journey through Sri Lanka.
            </p>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "0.75rem",
                justifyContent: "center",
              }}
            >
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
          </div>
        </section>
      </main>
    </SiteShell>
  );
}
