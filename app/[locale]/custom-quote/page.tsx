import type { Metadata } from "next";
import CustomInquiryForm from "@/components/CustomInquiryForm";
import PageHero from "@/components/PageHero";
import SiteShell from "@/components/SiteShell";

export const metadata: Metadata = {
  title: "Custom quote",
  description:
    "Request a bespoke Beyond Borders Sri Lanka quote — packages, hotels, air tickets or transport, tailored to you.",
};

export default function CustomQuotePage() {
  return (
    <SiteShell>
      <main>
        <PageHero
          title="Request a custom quote"
          label="Bespoke journeys"
          image="/assets/images/heroes/pricing-header.jpg"
          summary="Tell us what you need — a package, hotel, air ticket or transport — and our team will reply with a tailored quote."
        />
        <section className="section section-paper">
          <div className="container" style={{ maxWidth: "880px" }}>
            <CustomInquiryForm />
          </div>
        </section>
      </main>
    </SiteShell>
  );
}
