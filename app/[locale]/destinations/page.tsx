import type { Metadata } from "next";
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
  const destinations = await getPublishedDestinations();

  return (
    <SiteShell>
      <main>
        <section className="page-hero">
          <HeroSlideshow images={DESTINATION_HERO_IMAGES} />
          <div className="container page-hero-inner">
            <h1 className="display page-hero-title">Destinations</h1>
            <p>
              A full island grid of ancient capitals, tea country, coastal
              forts, national parks, surf beaches and city arrivals.
            </p>
          </div>
        </section>
        <section className="section section-sand route-destinations">
          <div className="container">
            <div className="route-section-head" data-reveal>
              <span className="section-kicker">All destinations</span>
              <h1 className="display display-lg">
                Every chapter can stand alone, or become part of one held route.
              </h1>
              <p className="lead">
                Use these destination pages as building blocks. Beyond Borders
                will connect the timing, transfers and stays into a private
                journey that feels seamless.
              </p>
            </div>
            <DestinationGrid destinations={destinations} />
          </div>
        </section>
        <CTASection
          title="Not sure which regions fit?"
          text="Tell us your travel dates and style, and we will suggest the island rhythm that makes the most sense."
        />
      </main>
    </SiteShell>
  );
}
