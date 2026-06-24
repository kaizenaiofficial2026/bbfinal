import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { TourPackage } from "@/lib/data/types";
import { formatPackagePrice } from "@/lib/format/price";

type TourPackageListProps = {
  packages: TourPackage[];
};

export default function TourPackageList({ packages }: TourPackageListProps) {
  const t = useTranslations("toursList");

  return (
    <div className="tour-package-grid" data-reveal-group="package-cards">
      {packages.map((tour) => {
        const price = formatPackagePrice(tour.priceAmount, tour.currency);
        return (
          <article className="tour-package-card" id={tour.slug} key={tour.slug}>
            <div className="tour-package-image">
              <Image
                src={tour.image}
                alt={tour.title}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1220px) 50vw, 580px"
              />
            </div>
            <div className="tour-package-body">
              <h2>{tour.title}</h2>
              <p>{tour.summary}</p>
              <div className="tour-meta">
                <span>{tour.duration}</span>
                <span>{tour.tier}</span>
                <span>{tour.hotels}</span>
                <span>{tour.destinations}</span>
              </div>
              {price ? (
                <p className="tour-package-price">
                  <span>{t("from")}</span> {price}
                </p>
              ) : null}
              <Link
                className="tour-package-button"
                href={`/booking/${tour.slug}`}
              >
                {t("viewDetails")}
              </Link>
            </div>
          </article>
        );
      })}
      <article
        className="tour-package-card tour-package-card-custom"
        key="custom-quote"
      >
        <div className="tour-package-body">
          <span className="section-kicker">{t("customKicker")}</span>
          <h2>{t("customHeading")}</h2>
          <p>{t("customText")}</p>
          <Link className="tour-package-button" href="/custom-quote">
            {t("customCta")}
          </Link>
        </div>
      </article>
    </div>
  );
}
