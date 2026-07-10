import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import PageHero from "@/components/PageHero";
import SiteShell from "@/components/SiteShell";
import { requireCustomer } from "@/lib/customer/auth";
import CartView from "./CartView";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("cart");
  return { title: t("title") };
}

export default async function CartPage() {
  // The cart is signed-in only. Gate the route itself (not just the floating-cart
  // button / checkout action) so a guest — or a deactivated user — can't open it
  // by URL and see leftover items. Redirects to /login, returning to /cart after.
  await requireCustomer("/cart");

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
