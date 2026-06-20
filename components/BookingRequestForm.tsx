"use client";

import { useActionState, useState } from "react";
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
  const [state, formAction, pending] = useActionState(
    submitBooking,
    initialBookingState,
  );
  const [startedAt] = useState(() => Date.now());

  return (
    <form className="booking-form" action={formAction}>
      <input type="hidden" name="tourPackageId" value={packageId} />
      <input type="hidden" name="startedAt" value={startedAt} />
      <div className="visually-hidden" aria-hidden="true">
        <label htmlFor="booking-company">Company</label>
        <input
          id="booking-company"
          name="company"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>
      <div className="booking-form-section">
        <span className="booking-form-label">Journey details</span>
        <div className="form-grid">
          <div className="form-field">
            <label htmlFor="booking-package">Package</label>
            <input
              id="booking-package"
              name="package"
              type="text"
              value={packageTitle}
              readOnly
            />
          </div>
          <div className="form-field">
            <label htmlFor="booking-dates">Travel dates</label>
            <input
              id="booking-dates"
              name="dates"
              type="text"
              placeholder="Preferred month or exact dates"
            />
          </div>
          <div className="form-field">
            <label htmlFor="booking-travellers">Travellers</label>
            <input
              id="booking-travellers"
              name="travellers"
              type="number"
              min="1"
              placeholder="2"
            />
          </div>
          <div className="form-field full">
            <label htmlFor="booking-notes">Special requests</label>
            <textarea
              id="booking-notes"
              name="notes"
              placeholder="Tell us about room preferences, celebrations, accessibility needs or flight timing."
            />
          </div>
        </div>
      </div>

      <div className="booking-payment-preview">
        <div className="booking-payment-head">
          <div>
            <span className="booking-form-label">Total due now</span>
            <h2>Secure hosted checkout</h2>
          </div>
          <strong>
            {currency} {amount.toFixed(2)}
          </strong>
        </div>
        <p>
          You&apos;ll be taken to our bank&apos;s secure checkout to complete
          payment. No card details are stored by Beyond Borders.
        </p>
      </div>

      <div className="booking-submit-row">
        <button className="btn btn-primary" type="submit" disabled={pending}>
          {pending ? "Starting…" : `Reserve & pay ${currency} ${amount.toFixed(2)}`}
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
