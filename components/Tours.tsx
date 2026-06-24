import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { TourPackage } from "@/lib/data/types";
import { formatPackagePrice } from "@/lib/format/price";

const imageFocus: Record<string, string> = {
  "glamour-of-sri-lanka": "center center",
  "sunbath-on-sands-standard": "center center",
  "a-classic-of-the-city": "center center",
};

type ToursProps = {
  packages: TourPackage[];
};

export default function Tours({ packages }: ToursProps) {
  const t = useTranslations("home.tours");

  return (
    <section className="luxury-packages-section" id="tours">
      <div className="container">
        <div className="luxury-packages-header">
          <h2 className="display display-lg">{t("heading")}</h2>
        </div>

        <div className="luxury-package-grid" data-reveal-group="package-cards">
          {packages.map((tour) => {
            const price = formatPackagePrice(tour.priceAmount, tour.currency);
            return (
              <article className="luxury-package-card" key={tour.slug}>
                <Link
                  className="luxury-package-link"
                  href={`/tours#${tour.slug}`}
                  aria-label={`View ${tour.title} package`}
                >
                  <Image
                    className="luxury-package-image"
                    src={tour.image}
                    alt={tour.title}
                    fill
                    sizes="(max-width: 720px) 100vw, (max-width: 1280px) 50vw, 50vw"
                    style={{ objectPosition: imageFocus[tour.slug] }}
                  />
                  <div className="luxury-card-overlay" />
                  <div className="luxury-card-content">
                    <h3>{tour.title}</h3>
                    <p>{tour.summary}</p>
                    {price ? (
                      <span className="luxury-card-price">
                        {t("from")} {price}
                      </span>
                    ) : null}
                    <span className="luxury-explore-btn">{t("explore")}</span>
                  </div>
                </Link>
              </article>
            );
          })}
        </div>
        <div className="luxury-swipe-cue" aria-hidden="true">
          <span>{t("swipe")}</span>
          <svg viewBox="0 0 24 24" fill="none">
            <path
              d="M5 12h14M13 6l6 6-6 6"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.8"
            />
          </svg>
        </div>

        <div className="luxury-packages-more">
          <Link className="luxury-more-btn" href="/tours">
            {t("viewMore")}
          </Link>
        </div>
      </div>
    </section>
  );
}
