import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import PageHero from "@/components/PageHero";
import SiteShell from "@/components/SiteShell";
import { getPaymentByToken } from "@/lib/data/payments";
import { env } from "@/lib/env";
import { reconcilePayment } from "@/lib/payments/reconcile";

type ResultPageProps = {
  params: Promise<{ token: string }>;
};

export default async function PaymentResultPage({ params }: ResultPageProps) {
  const { token } = await params;
  const [payment, t] = await Promise.all([
    getPaymentByToken(token),
    getTranslations("pay"),
  ]);
  let message = t("resultNotFound");

  if (payment?.bookings && env.paymentsEnabled) {
    // Idempotent: safe even if the webhook already finalized this payment, or
    // the customer refreshes this page — no duplicate receipt is sent.
    const result = await reconcilePayment(payment);
    message = result.captured ? t("resultReceived") : t("resultNotConfirmed");
  } else if (payment?.bookings) {
    message = t("resultDisabled");
  }

  return (
    <SiteShell>
      <main>
        <PageHero
          title={t("resultTitle")}
          label="Beyond Borders"
          image="/assets/images/heroes/pricing-header.jpg"
          summary={message}
        />
        <section className="section section-paper">
          <div className="container">
            <Link className="btn btn-primary" href="/contacts">{t("contactTeam")}</Link>
          </div>
        </section>
      </main>
    </SiteShell>
  );
}
