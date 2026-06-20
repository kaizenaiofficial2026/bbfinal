"use client";

import { useActionState, useState } from "react";
import { submitBooking } from "@/app/actions";
import { initialBookingState } from "@/app/action-state";

type BookingRequestFormProps = {
  packageId: string;
  packageTitle: string;
};

export default function BookingRequestForm({
  packageId,
  packageTitle,
}: BookingRequestFormProps) {
  const [state, formAction, pending] = useActionState(
    submitBooking,
    initialBookingState,
  );
  const [startedAt] = useState(() => Date.now());

  return (
    <form className="booking-form" action={formAction}>
      <input type="hidden" name="tourPackageId" value={packageId} />
      <input type="hidden" name="packageTitle" value={packageTitle} />
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
            <span className="booking-form-label">Payment timing</span>
            <h2>Secure link after planner review</h2>
          </div>
          <strong>TBD</strong>
        </div>
        <p>
          No card details are collected here. Beyond Borders confirms the final
          total first, then emails a single-use hosted checkout link.
        </p>
      </div>

      <div className="booking-submit-row">
        <button className="btn btn-primary" type="submit" disabled={pending}>
          {pending ? "Sending…" : "Send booking request"}
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
          {state.reference ? ` Reference: ${state.reference}` : ""}
        </p>
      </div>
    </form>
  );
}
