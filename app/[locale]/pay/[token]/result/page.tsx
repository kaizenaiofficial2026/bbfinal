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
  let paid = false;

  if (payment?.bookings && env.paymentsEnabled) {
    // Idempotent: safe even if the webhook already finalized this payment, or
    // the customer refreshes this page — no duplicate receipt is sent.
    const result = await reconcilePayment(payment);
    paid = result.captured;
    message = result.captured ? t("resultReceived") : t("resultNotConfirmed");
  } else if (payment?.bookings) {
    paid = payment.status === "captured" || payment.bookings.status === "paid";
    message = t("resultDisabled");
  }

  const booking = payment?.bookings ?? null;
  const displayAmount = booking?.quoted_amount ?? payment?.amount ?? 0;
  const displayCurrency = booking?.currency ?? payment?.currency ?? "USD";

  return (
    <SiteShell>
      <main>
        <PageHero
          title={t("resultTitle")}
          label={booking?.reference ?? "Beyond Borders"}
          image="/assets/images/heroes/pricing-header.jpg"
          summary={message}
        />
        <section className="section section-paper">
          <div className="container pay-layout">
            {booking ? (
              <article className="booking-summary-card">
                <span className="booking-form-label">{t("orderSummary")}</span>
                <h1>{booking.tour_packages?.title ?? t("defaultBooking")}</h1>
                <div className="booking-total-row">
                  <span>{t("reference")}</span>
                  <strong>{booking.reference}</strong>
                </div>
                <div className="booking-total-row">
                  <span>{t("traveller")}</span>
                  <strong>{booking.traveller_name}</strong>
                </div>
                <div className="booking-total-row">
                  <span>{t("amount")}</span>
                  <strong>
                    {displayCurrency} {displayAmount.toFixed(2)}
                  </strong>
                </div>
                <div className="booking-total-row">
                  <span>{t("status")}</span>
                  <strong>{paid ? t("paid") : payment?.status}</strong>
                </div>
                {paid ? <p className="form-note">{t("alreadyPaid")}</p> : null}
              </article>
            ) : null}
            <Link className="btn btn-primary" href="/contacts">
              {t("contactTeam")}
            </Link>
          </div>
        </section>
      </main>
    </SiteShell>
  );
}
