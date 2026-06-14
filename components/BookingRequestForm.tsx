"use client";

import { useState } from "react";

type BookingRequestFormProps = {
  packageTitle: string;
};

export default function BookingRequestForm({
  packageTitle,
}: BookingRequestFormProps) {
  const [prepared, setPrepared] = useState(false);

  return (
    <form
      className="booking-form"
      onSubmit={(event) => {
        event.preventDefault();
        setPrepared(true);
      }}
    >
      <div className="booking-form-section">
        <span className="booking-form-label">Traveller details</span>
        <div className="form-grid">
          <div className="form-field">
            <label htmlFor="booking-name">Name</label>
            <input
              id="booking-name"
              name="name"
              type="text"
              autoComplete="name"
              placeholder="Your name"
            />
          </div>
          <div className="form-field">
            <label htmlFor="booking-email">Email</label>
            <input
              id="booking-email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
            />
          </div>
          <div className="form-field">
            <label htmlFor="booking-phone">Phone</label>
            <input
              id="booking-phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              placeholder="+94 77 000 0000"
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
            <span className="booking-form-label">Mock payment details</span>
            <h2>Payment details preview</h2>
          </div>
          <strong>TBD</strong>
        </div>
        <p>
          This preview does not process, validate, store or submit card details.
          Beyond Borders will confirm the final total and secure payment
          instructions after review.
        </p>
        <div className="booking-card-preview" aria-hidden="true">
          <span>Beyond Borders</span>
          <strong>•••• •••• •••• ••••</strong>
          <div>
            <small>MM / YY</small>
            <small>CVC</small>
          </div>
        </div>
        <div className="booking-mock-fields">
          <div className="form-field">
            <label htmlFor="mock-card-number">Card number</label>
            <input
              id="mock-card-number"
              type="text"
              placeholder="Mock field only"
              readOnly
            />
          </div>
          <div className="form-field">
            <label htmlFor="mock-card-expiry">Expiry</label>
            <input
              id="mock-card-expiry"
              type="text"
              placeholder="MM / YY"
              readOnly
            />
          </div>
          <div className="form-field">
            <label htmlFor="mock-card-cvc">CVC</label>
            <input
              id="mock-card-cvc"
              type="text"
              placeholder="CVC"
              readOnly
            />
          </div>
        </div>
      </div>

      <div className="booking-submit-row">
        <button className="btn btn-primary" type="submit">
          Prepare booking request
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
          {prepared
            ? "Booking request prepared. A Beyond Borders planner will confirm package total and payment instructions."
            : "Frontend-only booking preview. No payment will be taken here."}
        </p>
      </div>
    </form>
  );
}
