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
          title="Tours"
          label="Signature journeys"
          image="/assets/images/heroes/pricing-header.jpg"
          summary="Four concise Sri Lanka tour styles, each with airport transfer, daily breakfast and Beyond Borders assistance."
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
                These packages are starting points: a beach break, a polished
                capital stay, a classic city visit or a compact Colombo escape.
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
