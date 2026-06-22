import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import CustomInquiryForm from "@/components/CustomInquiryForm";
import PageHero from "@/components/PageHero";
import SiteShell from "@/components/SiteShell";

export const metadata: Metadata = {
  title: "Custom quote",
  description:
    "Request a bespoke Beyond Borders Sri Lanka quote — packages, hotels, air tickets or transport, tailored to you.",
};

export default async function CustomQuotePage() {
  const t = await getTranslations("customQuote");

  return (
    <SiteShell>
      <main>
        <PageHero
          title={t("heroTitle")}
          label={t("heroLabel")}
          image="/assets/images/heroes/pricing-header.jpg"
          summary={t("heroSummary")}
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
