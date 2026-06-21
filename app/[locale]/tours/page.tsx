import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import CTASection from "@/components/CTASection";
import HeroSlideshow from "@/components/HeroSlideshow";
import SiteShell from "@/components/SiteShell";
import TourPackageList from "@/components/TourPackageList";
import { getPublishedPackages } from "@/lib/data/packages";

const TOUR_HERO_IMAGES = [
  "/assets/images/heroes/tourpage/tour1.jpg",
  "/assets/images/heroes/tourpage/tour2.jpg",
  "/assets/images/heroes/tourpage/tour3.jpg",
  "/assets/images/heroes/tourpage/tour4.jpg",
];

export const metadata: Metadata = {
  title: "Tours",
  description:
    "Explore Beyond Borders Sri Lanka tour packages with transfers, breakfast and dedicated assistance included.",
};

export default async function ToursPage() {
  const [packages, t] = await Promise.all([
    getPublishedPackages(),
    getTranslations("toursPage"),
  ]);

  return (
    <SiteShell>
      <main className="tours-page">
        <section className="page-hero">
          <HeroSlideshow images={TOUR_HERO_IMAGES} />
          <div className="container page-hero-inner">
            <h1 className="display page-hero-title">{t("heroTitle")}</h1>
            <p>{t("heroLead")}</p>
          </div>
        </section>
        <section className="section section-paper route-tours">
          <div className="container">
            <div className="route-section-head">
              <span className="section-kicker">{t("kicker")}</span>
              <h1 className="display display-lg">{t("heading")}</h1>
              <p className="lead">{t("lead")}</p>
            </div>
            <TourPackageList packages={packages} />
          </div>
        </section>
        <CTASection
          title={t("ctaTitle")}
          text={t("ctaText")}
          action={t("ctaAction")}
        />
      </main>
    </SiteShell>
  );
}
