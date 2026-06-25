"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";
import Select, { type SelectOption } from "./Select";
import { submitEnquiry } from "@/app/actions";
import { initialEnquiryState } from "@/app/action-state";

export default function ContactForm() {
  const t = useTranslations("contactPage");
  const [state, formAction, pending] = useActionState(
    submitEnquiry,
    initialEnquiryState,
  );
  const [startedAt] = useState(() => Date.now());

  const countryOptions: SelectOption[] = [
    { label: t("countrySelect"), value: "" },
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
    { label: `🌍 ${t("other")}`, value: "Other" },
  ];

  const packageOptions: SelectOption[] = [
    { label: t("packageSelect"), value: "" },
    { label: "Sunbath on Sands Standard", value: "Sunbath on Sands Standard" },
    { label: "Glamour of Sri Lanka", value: "Glamour of Sri Lanka" },
    { label: "A Classic of the City", value: "A Classic of the City" },
    { label: "The Heart of City", value: "The Heart of City" },
    { label: t("customPackage"), value: "Custom Package" },
  ];

  return (
    <form className="contact-form" id="contactForm" data-reveal action={formAction}>
      <input type="hidden" name="startedAt" value={startedAt} />
      <div className="visually-hidden" aria-hidden="true">
        <label htmlFor="company">{t("company")}</label>
        <input id="company" name="company" type="text" tabIndex={-1} autoComplete="off" />
      </div>
      <div className="form-grid">
        <div className="form-field">
          <label htmlFor="name">{t("name")}</label>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            placeholder={t("namePlaceholder")}
            defaultValue={state.values?.name}
            required
          />
        </div>
        <div className="form-field">
          <label htmlFor="email">{t("email")}</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            defaultValue={state.values?.email}
            required
          />
        </div>
        <div className="form-field">
          <label htmlFor="phone">{t("phone")}</label>
          <input
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            placeholder="+1 555 000 0000"
            defaultValue={state.values?.phone}
            required
          />
        </div>

        <Select
          name="country"
          label={t("country")}
          options={countryOptions}
          defaultValue={state.values?.country}
        />

        <Select
          name="package"
          label={t("packageOfInterest")}
          options={packageOptions}
          className="full"
          defaultValue={state.values?.package}
        />

        <div className="form-field full">
          <label htmlFor="message">{t("travelNotes")}</label>
          <textarea
            id="message"
            name="message"
            placeholder={t("messagePlaceholder")}
            defaultValue={state.values?.message}
            required
          />
        </div>
      </div>
      <div className="form-actions">
        <button className="btn btn-primary" type="submit" disabled={pending}>
          {pending ? t("sending") : t("sendEnquiry")}
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
