import type { Metadata } from "next";
import About from "@/components/About";
import CTASection from "@/components/CTASection";
import HeroSlideshow from "@/components/HeroSlideshow";
import SiteShell from "@/components/SiteShell";

const FEATURES = [
  {
    title: "Tailor-Made Trips",
    text: "Every trip is uniquely designed around your needs, pace, interests, and travel style.",
  },
  {
    title: "Local Expertise",
    text: "Our Colombo-based planners bring deep knowledge of Sri Lanka’s landscapes, culture, routes, and hidden gems.",
  },
  {
    title: "Unbeatable Value",
    text: "We curate premium travel experiences with trusted partners while keeping your journey practical and worthwhile.",
  },
  {
    title: "End-to-End Support",
    text: "From planning to final departure, our team stays reachable and supportive throughout your journey.",
  },
];

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

export default function AboutPage() {
  return (
    <SiteShell>
      <main>
        <section className="page-hero">
          <HeroSlideshow images={ABOUT_HERO_IMAGES} />
          <div className="container page-hero-inner">
            <h1 className="display page-hero-title">About Us</h1>
            <p>
              A Colombo-based travel house crafting private Sri Lanka journeys
              with polish, care and local fluency.
            </p>
          </div>
        </section>
        <About />
        <section className="section section-paper about-offer-section">
          <div className="container">
            <div className="about-offer-head" data-reveal>
              <span className="section-kicker">What We Offer</span>
              <h2 className="display display-lg">Why Travel With Us</h2>
            </div>
            <div className="about-offer-grid" data-reveal-group="cards">
              {FEATURES.map((feature, index) => (
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
          title="Let the island open at your pace."
          text="Tell us how you like to travel, and a Beyond Borders planner will shape the first route around you."
        />
      </main>
    </SiteShell>
  );
}
