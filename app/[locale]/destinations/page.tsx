import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import CTASection from "@/components/CTASection";
import DestinationGrid from "@/components/DestinationGrid";
import HeroSlideshow from "@/components/HeroSlideshow";
import SiteShell from "@/components/SiteShell";
import { getPublishedDestinations } from "@/lib/data/destinations";

const DESTINATION_HERO_IMAGES = [
  "/assets/images/heroes/destinationpage/dest1.jpg",
  "/assets/images/heroes/destinationpage/dest2.jpg",
  "/assets/images/heroes/destinationpage/dest3.jpg",
  "/assets/images/heroes/destinationpage/dest4.jpg",
  "/assets/images/heroes/destinationpage/dest5.jpg",
];

export const metadata: Metadata = {
  title: "Destinations",
  description:
    "Browse Sri Lanka destinations curated by Beyond Borders, from Colombo and Kandy to Yala, Galle, Bentota and the cultural triangle.",
};

export default async function DestinationsPage() {
  const [destinations, t] = await Promise.all([
    getPublishedDestinations(),
    getTranslations("destinationsPage"),
  ]);

  return (
    <SiteShell>
      <main>
        <section className="page-hero">
          <HeroSlideshow images={DESTINATION_HERO_IMAGES} />
          <div className="container page-hero-inner">
            <h1 className="display page-hero-title">{t("heroTitle")}</h1>
            <p>{t("heroLead")}</p>
          </div>
        </section>
        <section className="section section-sand route-destinations">
          <div className="container">
            <div className="route-section-head" data-reveal>
              <span className="section-kicker">{t("kicker")}</span>
              <h1 className="display display-lg">{t("heading")}</h1>
              <p className="lead">{t("lead")}</p>
            </div>
            <DestinationGrid destinations={destinations} />
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
