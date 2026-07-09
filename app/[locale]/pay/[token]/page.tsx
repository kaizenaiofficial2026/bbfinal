import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import PageHero from "@/components/PageHero";
import PaymentMethods from "@/components/PaymentMethods";
import SiteShell from "@/components/SiteShell";
import { getPaymentByToken, orderReference } from "@/lib/data/payments";
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

  if (!payment?.bookings?.length) notFound();

  const [t, tc] = await Promise.all([
    getTranslations("pay"),
    getTranslations("common"),
  ]);
  const bookings = payment.bookings;
  const single = bookings.length === 1;
  const reference = orderReference(payment);
  const expired = isExpired(payment.pay_token_expires_at);
  const paid =
    payment.status === "captured" || bookings.every((b) => b.status === "paid");
  const canPay = env.paymentsEnabled && !expired && !paid;

  return (
    <SiteShell>
      <main>
        <PageHero
          title={t("heroTitle")}
          label={reference}
          image="/assets/images/heroes/pricing-header.jpg"
          summary={t("heroSummary")}
        />
        <section className="section section-paper">
          <div className="container pay-layout">
            <article className="booking-summary-card">
              <span className="booking-form-label">{t("orderSummary")}</span>
              <h1>
                {single
                  ? (bookings[0].tour_packages?.title ?? t("defaultBooking"))
                  : t("order")}
              </h1>

              <div className="booking-total-row">
                <span>{t("reference")}</span>
                <strong>{reference}</strong>
              </div>
              <div className="booking-total-row">
                <span>{t("traveller")}</span>
                <strong>{bookings[0].traveller_name}</strong>
              </div>

              {/* Line items: one per booking in the order. */}
              {bookings.map((b) => (
                <div className="booking-total-row booking-line-item" key={b.id}>
                  <span>{b.tour_packages?.title ?? t("defaultBooking")}</span>
                  <strong>
                    {b.currency} {(b.quoted_amount ?? 0).toFixed(2)}
                  </strong>
                </div>
              ))}

              <div className="booking-total-row booking-total-final">
                <span>{single ? t("amount") : t("total")}</span>
                <strong>
                  {payment.currency} {payment.amount.toFixed(2)}
                </strong>
              </div>

              <div className="booking-total-row">
                <span>{t("status")}</span>
                <strong>
                  {paid ? t("paid") : expired ? t("expired") : payment.status}
                </strong>
              </div>

              {canPay ? (
                <PayButton token={token} scriptUrl={getHostedCheckoutScriptUrl()} />
              ) : null}
              {!env.paymentsEnabled ? (
                <p className="form-note">{t("notEnabled")}</p>
              ) : null}
              {expired ? <p className="form-note">{t("expiredNote")}</p> : null}
              {paid ? <p className="form-note">{t("alreadyPaid")}</p> : null}

              <PaymentMethods label={tc("weAccept")} />
            </article>
          </div>
        </section>
      </main>
    </SiteShell>
  );
}
