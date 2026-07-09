import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import PageHero from "@/components/PageHero";
import SiteShell from "@/components/SiteShell";
import { getPaymentByToken, orderReference } from "@/lib/data/payments";
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

  const bookings = payment?.bookings ?? [];
  if (bookings.length && env.paymentsEnabled) {
    // Idempotent: safe even if the webhook already finalized this payment, or
    // the customer refreshes this page — no duplicate receipt is sent.
    const result = await reconcilePayment(payment!);
    paid = result.captured;
    message = result.captured ? t("resultReceived") : t("resultNotConfirmed");
  } else if (bookings.length) {
    paid =
      payment!.status === "captured" || bookings.every((b) => b.status === "paid");
    message = t("resultDisabled");
  }

  const hasOrder = bookings.length > 0;
  const single = bookings.length === 1;
  const reference = payment ? orderReference(payment) : "";

  return (
    <SiteShell>
      <main>
        <PageHero
          title={t("resultTitle")}
          label={reference || "Beyond Borders"}
          image="/assets/images/heroes/pricing-header.jpg"
          summary={message}
        />
        <section className="section section-paper">
          <div className="container pay-layout">
            {hasOrder && payment ? (
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
                  <strong>{paid ? t("paid") : payment.status}</strong>
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
