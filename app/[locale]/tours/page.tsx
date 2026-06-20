import type { Metadata } from "next";
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
  const packages = await getPublishedPackages();

  return (
    <SiteShell>
      <main className="tours-page">
        <section className="page-hero">
          <HeroSlideshow images={TOUR_HERO_IMAGES} />
          <div className="container page-hero-inner">
            <h1 className="display page-hero-title">Tour Packages</h1>
            <p>
              Curated Sri Lanka journeys, tailored around your pace and
              preferences.
            </p>
          </div>
        </section>
        <section className="section section-paper route-tours">
          <div className="container">
            <div className="route-section-head">
              <span className="section-kicker">Tour packages</span>
              <h1 className="display display-lg">
                Choose the structure, then let us shape the details.
              </h1>
              <p className="lead">
                Each journey begins with a carefully crafted framework, then
                evolves around your interests, travel style and preferred pace.
              </p>
            </div>
            <TourPackageList packages={packages} />
          </div>
        </section>
        <CTASection
          title="Prefer a custom route?"
          text="Use the tour package that feels closest, then share your dates, comfort level and must-see places."
          action="Send an enquiry"
        />
      </main>
    </SiteShell>
  );
}
