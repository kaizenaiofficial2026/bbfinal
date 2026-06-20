import Link from "next/link";
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
  const payment = await getPaymentByToken(token);
  let message = "We could not find this payment request.";

  if (payment?.bookings && env.paymentsEnabled) {
    // Idempotent: safe even if the webhook already finalized this payment, or
    // the customer refreshes this page — no duplicate receipt is sent.
    const result = await reconcilePayment(payment);
    message = result.captured
      ? "Payment received. Thank you."
      : "The bank did not confirm a captured payment. Please contact the team if this seems wrong.";
  } else if (payment?.bookings) {
    message = "Payments are disabled. This return page is ready for MPGS once credentials are enabled.";
  }

  return (
    <SiteShell>
      <main>
        <PageHero
          title="Payment result"
          label="Beyond Borders"
          image="/assets/images/heroes/pricing-header.jpg"
          summary={message}
        />
        <section className="section section-paper">
          <div className="container">
            <Link className="btn btn-primary" href="/contacts">Contact the team</Link>
          </div>
        </section>
      </main>
    </SiteShell>
  );
}
