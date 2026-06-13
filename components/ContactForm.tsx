"use client";

import { useActionState } from "react";
import Select from "./Select";
import { submitEnquiry, initialEnquiryState } from "@/app/actions";

const JOURNEY_OPTIONS = [
  "Glamour of Sri Lanka",
  "Sunbath on Sands",
  "A Classic of the City",
  "The Heart of City",
  "Custom journey",
];

export default function ContactForm() {
  const [state, formAction, pending] = useActionState(
    submitEnquiry,
    initialEnquiryState,
  );

  return (
    <form className="contact-form" id="contactForm" data-reveal action={formAction}>
      <div className="form-grid">
        <div className="form-field">
          <label htmlFor="name">Name</label>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            placeholder="Your name"
          />
        </div>
        <div className="form-field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
          />
        </div>
        <div className="form-field">
          <label htmlFor="phone">Phone</label>
          <input
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            placeholder="+1 555 000 0000"
          />
        </div>

        <Select
          name="package"
          label="Journey style"
          options={JOURNEY_OPTIONS}
        />

        <div className="form-field full">
          <label htmlFor="message">Travel notes</label>
          <textarea
            id="message"
            name="message"
            placeholder="Tell us your dates, travel style and must-see places."
          />
        </div>
      </div>
      <div className="form-actions">
        <button className="btn btn-primary" type="submit" disabled={pending}>
          {pending ? "Sending…" : "Send enquiry"}
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
        <p className="form-note" id="formNote" aria-live="polite">
          {state.note}
        </p>
      </div>
    </form>
  );
}
