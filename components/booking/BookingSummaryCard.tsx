"use client";

import { useTranslations } from "next-intl";
import { useBookingTravellers } from "./booking-quote-store";

type BookingSummaryCardProps = {
  /** Per-traveller price; null when the package has no instant-checkout price. */
  amount: number | null;
  currency: string;
};

/**
 * The payment-summary card in the booking page sidebar. Client island so the
 * total tracks the traveller count typed in the booking form live (via the
 * shared quote store) — pricing is per traveller, so total = price × count.
 */
export function BookingSummaryCard({ amount, currency }: BookingSummaryCardProps) {
  const t = useTranslations("bookingPage");
  const travellers = useBookingTravellers();

  return (
    <div className="booking-summary-card">
      <span className="booking-form-label">{t("paymentSummary")}</span>
      <h2>{t("amountConfirmed")}</h2>
      <div className="booking-total-row">
        <span>{t("perTraveller")}</span>
        <strong>
          {amount != null ? `${currency} ${amount.toLocaleString()}` : "TBD"}
        </strong>
      </div>
      <div className="booking-total-row">
        <span>{t("travellers")}</span>
        <strong>{travellers}</strong>
      </div>
      <div className="booking-total-row">
        <span>{t("packageTotal")}</span>
        <strong>
          {amount != null
            ? `${currency} ${(amount * travellers).toLocaleString()}`
            : "TBD"}
        </strong>
      </div>
      <div className="booking-total-row">
        <span>{t("paymentStatus")}</span>
        <strong>{t("notCharged")}</strong>
      </div>
      <p>{t("prepareNote")}</p>
    </div>
  );
}
