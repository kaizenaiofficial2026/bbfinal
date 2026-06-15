"use client";

import { useActionState, useState } from "react";
import Select, { type SelectOption } from "./Select";
import { submitEnquiry, initialEnquiryState } from "@/app/actions";

const COUNTRY_OPTIONS: SelectOption[] = [
  { label: "Select your country", value: "" },
  { label: "🇱🇰 Sri Lanka", value: "Sri Lanka" },
  { label: "🇮🇳 India", value: "India" },
  { label: "🇲🇻 Maldives", value: "Maldives" },
  { label: "🇦🇪 United Arab Emirates", value: "United Arab Emirates" },
  { label: "🇸🇦 Saudi Arabia", value: "Saudi Arabia" },
  { label: "🇶🇦 Qatar", value: "Qatar" },
  { label: "🇰🇼 Kuwait", value: "Kuwait" },
  { label: "🇴🇲 Oman", value: "Oman" },
  { label: "🇧🇭 Bahrain", value: "Bahrain" },
  { label: "🇬🇧 United Kingdom", value: "United Kingdom" },
  { label: "🇦🇺 Australia", value: "Australia" },
  { label: "🇨🇦 Canada", value: "Canada" },
  { label: "🇺🇸 United States", value: "United States" },
  { label: "🇸🇬 Singapore", value: "Singapore" },
  { label: "🇲🇾 Malaysia", value: "Malaysia" },
  { label: "🌍 Other", value: "Other" },
];

const PACKAGE_OPTIONS: SelectOption[] = [
  { label: "Select a package (optional)", value: "" },
  { label: "Sunbath on Sands Standard", value: "Sunbath on Sands Standard" },
  { label: "Glamour of Sri Lanka", value: "Glamour of Sri Lanka" },
  { label: "A Classic of the City", value: "A Classic of the City" },
  { label: "The Heart of City", value: "The Heart of City" },
  { label: "Custom Package", value: "Custom Package" },
];

export default function ContactForm() {
  const [state, formAction, pending] = useActionState(
    submitEnquiry,
    initialEnquiryState,
  );
  const [startedAt] = useState(() => Date.now());

  return (
    <form className="contact-form" id="contactForm" data-reveal action={formAction}>
      <input type="hidden" name="startedAt" value={startedAt} />
      <div className="visually-hidden" aria-hidden="true">
        <label htmlFor="company">Company</label>
        <input id="company" name="company" type="text" tabIndex={-1} autoComplete="off" />
      </div>
      <div className="form-grid">
        <div className="form-field">
          <label htmlFor="name">Name</label>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            placeholder="Your name"
            required
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
            required
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
            required
          />
        </div>

        <Select
          name="country"
          label="Country"
          options={COUNTRY_OPTIONS}
        />

        <Select
          name="package"
          label="Package of Interest"
          options={PACKAGE_OPTIONS}
          className="full"
        />

        <div className="form-field full">
          <label htmlFor="message">Travel notes</label>
          <textarea
            id="message"
            name="message"
            placeholder="Tell us your dates, travel style and must-see places."
            required
          />
        </div>
      </div>
      <div className="form-actions">
        <button className="btn btn-primary" type="submit" disabled={pending}>
          {pending ? "Sending…" : "Send Enquiry"}
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
