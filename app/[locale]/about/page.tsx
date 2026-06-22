import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import About from "@/components/About";
import CTASection from "@/components/CTASection";
import HeroSlideshow from "@/components/HeroSlideshow";
import SiteShell from "@/components/SiteShell";

const ABOUT_HERO_IMAGES = [
  "/assets/images/heroes/aboutpage/hero1.jpg",
  "/assets/images/heroes/aboutpage/hero2.jpg",
  "/assets/images/heroes/aboutpage/hero3.jpg",
  "/assets/images/heroes/aboutpage/hero4.jpg",
  "/assets/images/heroes/aboutpage/hero5.jpg",
];

export const metadata: Metadata = {
  title: "About Beyond Borders",
  description:
    "Meet Beyond Borders, a Colombo-based Sri Lanka travel partner designing private journeys with local care.",
};

export default async function AboutPage() {
  const t = await getTranslations("aboutPage");
  const features = t.raw("features") as { title: string; text: string }[];

  return (
    <SiteShell>
      <main>
        <section className="page-hero">
          <HeroSlideshow images={ABOUT_HERO_IMAGES} />
          <div className="container page-hero-inner">
            <h1 className="display page-hero-title">{t("heroTitle")}</h1>
            <p>{t("heroLead")}</p>
          </div>
        </section>
        <About />
        <section className="section section-paper about-offer-section">
          <div className="container">
            <div className="about-offer-head" data-reveal>
              <span className="section-kicker">{t("offerKicker")}</span>
              <h2 className="display display-lg">{t("offerHeading")}</h2>
            </div>
            <div className="about-offer-grid" data-reveal-group="cards">
              {features.map((feature, index) => (
                <article className="about-offer-item" key={feature.title}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <h3>{feature.title}</h3>
                  <p>{feature.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
        <CTASection
          title={t("ctaTitle")}
          text={t("ctaText")}
        />
      </main>
    </SiteShell>
  );
}
