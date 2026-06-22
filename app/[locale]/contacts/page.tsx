import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Contact from "@/components/Contact";
import PageHero from "@/components/PageHero";
import SiteShell from "@/components/SiteShell";

export const metadata: Metadata = {
  title: "Contact Beyond Borders",
  description:
    "Contact Beyond Borders in Colombo for private Sri Lanka tour planning.",
};

export default async function ContactsPage() {
  const t = await getTranslations("contactPage");

  return (
    <SiteShell>
      <main>
        <PageHero
          title={t("heroTitle")}
          label={t("heroLabel")}
          showBreadcrumbs={false}
          image="/assets/images/heroes/contact-header.jpg"
          summary={t("heroSummary")}
        />
        <Contact />
      </main>
    </SiteShell>
  );
}
