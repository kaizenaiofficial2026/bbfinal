import { notFound } from "next/navigation";
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

  const expired = isExpired(payment.pay_token_expires_at);
  const paid = payment.status === "captured" || payment.bookings.status === "paid";
  const canPay = env.paymentsEnabled && !expired && !paid;

  return (
    <SiteShell>
      <main>
        <PageHero
          title="Secure payment"
          label={payment.bookings.reference}
          image="/assets/images/heroes/pricing-header.jpg"
          summary="Complete payment through Beyond Borders' hosted bank checkout."
        />
        <section className="section section-paper">
          <div className="container pay-layout">
            <article className="booking-summary-card">
              <span className="booking-form-label">Payment request</span>
              <h1>{payment.bookings.tour_packages?.title ?? "Beyond Borders booking"}</h1>
              <div className="booking-total-row">
                <span>Traveller</span>
                <strong>{payment.bookings.traveller_name}</strong>
              </div>
              <div className="booking-total-row">
                <span>Amount</span>
                <strong>{payment.currency} {payment.amount.toFixed(2)}</strong>
              </div>
              <div className="booking-total-row">
                <span>Status</span>
                <strong>{paid ? "Paid" : expired ? "Expired" : payment.status}</strong>
              </div>
              {canPay ? (
                <PayButton token={token} scriptUrl={getHostedCheckoutScriptUrl()} />
              ) : null}
              {!env.paymentsEnabled ? (
                <p className="form-note">Payments are not enabled yet. The team can confirm this booking manually.</p>
              ) : null}
              {expired ? <p className="form-note">This payment link has expired. Please request a fresh link.</p> : null}
              {paid ? <p className="form-note">This booking is already marked paid.</p> : null}
            </article>
          </div>
        </section>
      </main>
    </SiteShell>
  );
}
