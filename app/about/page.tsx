import type { Metadata } from "next";
import About from "@/components/About";
import CTASection from "@/components/CTASection";
import PageHero from "@/components/PageHero";
import SiteShell from "@/components/SiteShell";

const FEATURES = [
  {
    title: "Tailor-made routes",
    text: "Every itinerary is shaped around your pace, taste and reason for travelling.",
  },
  {
    title: "Colombo-based planning",
    text: "Local planners coordinate routes, hotels, guides and transfers across the island.",
  },
  {
    title: "Private movement",
    text: "Airport pickup and private transfers keep each travel day calm and comfortable.",
  },
  {
    title: "On-trip assistance",
    text: "A dedicated Beyond Borders assistant stays reachable throughout your journey.",
  },
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
        <PageHero
          title="About"
          label="The Travel Partner"
          image="/assets/images/heroes/about-header.jpg"
          summary="A Colombo-based travel house crafting private Sri Lanka journeys with polish, care and local fluency."
        />
        <About />
        <section className="section section-paper feature-section">
          <div className="container">
            <div className="route-section-head" data-reveal>
              <span className="section-kicker">Why travel with us</span>
              <h2 className="display display-lg">
                The quiet details that make a journey feel held.
              </h2>
            </div>
            <div className="feature-grid" data-reveal-group>
              {FEATURES.map((feature, index) => (
                <article className="feature-card" key={feature.title}>
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
