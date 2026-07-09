import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import PageHero from "@/components/PageHero";
import SiteShell from "@/components/SiteShell";
import CartView from "./CartView";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("cart");
  return { title: t("title") };
}

export default async function CartPage() {
  const t = await getTranslations("cart");

  return (
    <SiteShell>
      <main>
        <PageHero
          title={t("title")}
          label="Beyond Borders"
          image="/assets/images/heroes/pricing-header.jpg"
          showBreadcrumbs={false}
          summary={t("heroSummary")}
        />
        <section className="section section-paper">
          <div className="container">
            <CartView />
          </div>
        </section>
      </main>
    </SiteShell>
  );
}
