import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import SiteShell from "@/components/SiteShell";
import { TermsContent } from "@/components/TermsContent";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description:
    "Beyond Borders booking and payment terms and conditions, including refunds and credit-card fraud guidelines.",
};

// Legal copy is intentionally English-only (not machine-translated).
export default function TermsPage() {
  return (
    <SiteShell>
      <main>
        <PageHero
          title="Terms & Conditions"
          label="Legal"
          image="/assets/images/heroes/pricing-header.jpg"
          summary="Please review the terms that apply to your Beyond Borders booking and payment."
        />
        <section className="section section-paper">
          <div className="container" style={{ maxWidth: "880px" }}>
            <TermsContent />
          </div>
        </section>
      </main>
    </SiteShell>
  );
}
