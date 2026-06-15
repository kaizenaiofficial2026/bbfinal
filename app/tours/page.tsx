import type { Metadata } from "next";
import CTASection from "@/components/CTASection";
import PageHero from "@/components/PageHero";
import SiteShell from "@/components/SiteShell";
import TourPackageList from "@/components/TourPackageList";
import { tourPackages } from "@/lib/travel";

export const metadata: Metadata = {
  title: "Tours",
  description:
    "Explore Beyond Borders Sri Lanka tour packages with transfers, breakfast and dedicated assistance included.",
};

export default function ToursPage() {
  return (
    <SiteShell>
      <main className="tours-page">
        <PageHero
          title="Tour Packages"
          label="Signature journeys"
          image="/assets/images/heroes/pricing-header.jpg"
          summary="Curated Sri Lanka journeys, tailored around your pace and preferences."
          showBreadcrumbs={false}
          showLabel={false}
        />
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
            <TourPackageList packages={tourPackages} />
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
