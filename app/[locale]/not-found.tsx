import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import SiteShell from "@/components/SiteShell";

export const metadata: Metadata = {
  title: "Page not found",
  description:
    "The page you are looking for has moved or no longer exists. Explore Beyond Borders destinations and tours instead.",
};

export default function NotFound() {
  const t = useTranslations("notFound");

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
            <span className="section-kicker">{t("kicker")}</span>
            <h1 className="display display-lg">{t("heading")}</h1>
            <p className="lead" style={{ maxWidth: "52ch" }}>
              {t("lead")}
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
                {t("backHome")}
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
                {t("exploreDestinations")}
              </Link>
              <Link className="btn btn-line" href="/tours">
                {t("viewTours")}
              </Link>
            </div>
          </div>
        </section>
      </main>
    </SiteShell>
  );
}
