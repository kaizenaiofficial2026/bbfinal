import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import PageHero from "@/components/PageHero";
import SiteShell from "@/components/SiteShell";
import { getPaymentByToken } from "@/lib/data/payments";
import { env } from "@/lib/env";
import { getHostedCheckoutScriptUrl } from "@/lib/payments/mpgs";
import { isExpired } from "@/lib/security/request";
import PayButton from "./PayButton";

type PayPageProps = {
  params: Promise<{ token: string }>;
};

export default async function PayPage({ params }: PayPageProps) {
  const { token } = await params;
  const payment = await getPaymentByToken(token);

  if (!payment?.bookings) notFound();

  const t = await getTranslations("pay");
  const expired = isExpired(payment.pay_token_expires_at);
  const paid = payment.status === "captured" || payment.bookings.status === "paid";
  const canPay = env.paymentsEnabled && !expired && !paid;

  return (
    <SiteShell>
      <main>
        <PageHero
          title={t("heroTitle")}
          label={payment.bookings.reference}
          image="/assets/images/heroes/pricing-header.jpg"
          summary={t("heroSummary")}
        />
        <section className="section section-paper">
          <div className="container pay-layout">
            <article className="booking-summary-card">
              <span className="booking-form-label">{t("paymentRequest")}</span>
              <h1>{payment.bookings.tour_packages?.title ?? t("defaultBooking")}</h1>
              <div className="booking-total-row">
                <span>{t("traveller")}</span>
                <strong>{payment.bookings.traveller_name}</strong>
              </div>
              <div className="booking-total-row">
                <span>{t("amount")}</span>
                <strong>{payment.currency} {payment.amount.toFixed(2)}</strong>
              </div>
              <div className="booking-total-row">
                <span>{t("status")}</span>
                <strong>{paid ? t("paid") : expired ? t("expired") : payment.status}</strong>
              </div>
              {canPay ? (
                <PayButton token={token} scriptUrl={getHostedCheckoutScriptUrl()} />
              ) : null}
              {!env.paymentsEnabled ? (
                <p className="form-note">{t("notEnabled")}</p>
              ) : null}
              {expired ? <p className="form-note">{t("expiredNote")}</p> : null}
              {paid ? <p className="form-note">{t("alreadyPaid")}</p> : null}
            </article>
          </div>
        </section>
      </main>
    </SiteShell>
  );
}
