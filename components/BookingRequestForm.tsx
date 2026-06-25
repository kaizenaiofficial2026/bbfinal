"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";
import { submitBooking } from "@/app/actions";
import { initialBookingState } from "@/app/action-state";

type BookingRequestFormProps = {
  packageId: string;
  packageTitle: string;
  amount: number;
  currency: string;
};

export default function BookingRequestForm({
  packageId,
  packageTitle,
  amount,
  currency,
}: BookingRequestFormProps) {
  const t = useTranslations("bookingPage");
  const [state, formAction, pending] = useActionState(
    submitBooking,
    initialBookingState,
  );
  const [startedAt] = useState(() => Date.now());
  const formattedAmount = `${currency} ${amount.toFixed(2)}`;

  return (
    <form className="booking-form" action={formAction}>
      <input type="hidden" name="tourPackageId" value={packageId} />
      <input type="hidden" name="startedAt" value={startedAt} />
      <div className="visually-hidden" aria-hidden="true">
        <label htmlFor="booking-company">{t("company")}</label>
        <input
          id="booking-company"
          name="company"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>
      <div className="booking-form-section">
        <span className="booking-form-label">{t("journeyDetails")}</span>
        <div className="form-grid">
          <div className="form-field">
            <label htmlFor="booking-package">{t("package")}</label>
            <input
              id="booking-package"
              name="package"
              type="text"
              value={packageTitle}
              readOnly
            />
          </div>
          <div className="form-field">
            <label htmlFor="booking-dates">{t("travelDates")}</label>
            <input
              id="booking-dates"
              name="dates"
              type="text"
              placeholder={t("travelDatesPlaceholder")}
              defaultValue={state.values?.dates}
            />
          </div>
          <div className="form-field">
            <label htmlFor="booking-travellers">{t("travellers")}</label>
            <input
              id="booking-travellers"
              name="travellers"
              type="number"
              min="1"
              placeholder="2"
              defaultValue={state.values?.travellers}
            />
          </div>
          <div className="form-field full">
            <label htmlFor="booking-notes">{t("specialRequests")}</label>
            <textarea
              id="booking-notes"
              name="notes"
              placeholder={t("specialRequestsPlaceholder")}
              defaultValue={state.values?.notes}
            />
          </div>
        </div>
      </div>

      <div className="booking-payment-preview">
        <div className="booking-payment-head">
          <div>
            <span className="booking-form-label">{t("totalDueNow")}</span>
            <h2>{t("secureCheckout")}</h2>
          </div>
          <strong>{formattedAmount}</strong>
        </div>
        <p>{t("checkoutNote")}</p>
      </div>

      <div className="booking-submit-row">
        <button className="btn btn-primary" type="submit" disabled={pending}>
          {pending ? t("starting") : t("reservePay", { amount: formattedAmount })}
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
            <path
              d="M5 12h14M13 6l6 6-6 6"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <p className="form-note" aria-live="polite">
          {state.note}
        </p>
      </div>
    </form>
  );
}
