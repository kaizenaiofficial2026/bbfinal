"use client";

import { useActionState, useCallback, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import Select, { type SelectOption } from "./Select";
import Combobox, { type ComboboxOption } from "./Combobox";
import Spinner from "./Spinner";
import { useSubmitFeedback } from "./useSubmitFeedback";
import { submitEnquiry } from "@/app/actions";
import { initialEnquiryState } from "@/app/action-state";
import { COUNTRIES, dialCodeForCountry } from "@/lib/data/countries";

export default function ContactForm() {
  const t = useTranslations("contactPage");
  const tAuth = useTranslations("auth");
  const locale = useLocale();
  const [state, formAction, pending] = useActionState(
    submitEnquiry,
    initialEnquiryState,
  );
  const feedback = useSubmitFeedback(
    pending,
    state.ok,
    state.note,
    initialEnquiryState.note,
  );
  const [startedAt] = useState(() => Date.now());

  // Full country list with locale-aware names and flags; selecting a country
  // pre-fills the phone field with its calling code (see onCountryChange).
  const regionNames = useMemo(() => {
    try {
      return new Intl.DisplayNames([locale], { type: "region" });
    } catch {
      return null;
    }
  }, [locale]);

  const countryOptions = useMemo<ComboboxOption[]>(() => {
    return COUNTRIES.map((c) => {
      let localized: string | undefined;
      try {
        localized = regionNames?.of(c.code);
      } catch {
        localized = undefined;
      }
      const label = localized && localized !== c.code ? localized : c.name;
      return {
        value: c.name, // stored value = canonical English name
        label, // shown = locale-aware name
        iconCode: c.code,
        keywords: `${c.code} ${c.name} ${c.dial}`,
      };
    }).sort((a, b) => a.label.localeCompare(b.label, locale));
  }, [regionNames, locale]);

  const initialCode = useMemo(
    () => COUNTRIES.find((c) => c.name === state.values?.country)?.code ?? "",
    [state.values?.country],
  );
  const [countryCode, setCountryCode] = useState(initialCode);
  const [phone, setPhone] = useState(state.values?.phone ?? "");

  const onCountryChange = useCallback(
    (_value: string, option?: ComboboxOption) => {
      const code = option?.iconCode ?? "";
      const newDial = dialCodeForCountry(code);
      const oldDial = dialCodeForCountry(countryCode);
      setCountryCode(code);
      if (newDial) {
        // Swap in the new calling code, stripping ONLY the exact previous
        // "+<oldDial>" prefix so we never eat digits of the typed number.
        setPhone((prev) => {
          const stripRe = oldDial ? new RegExp(`^\\+${oldDial}\\s*`) : /^\+\s*/;
          const rest = prev.replace(stripRe, "");
          return `+${newDial} ${rest}`;
        });
      }
    },
    [countryCode],
  );

  // Labels are localized; values stay in canonical English so the inquiry the
  // team receives is consistent regardless of the customer's language.
  const packageOptions: SelectOption[] = [
    { label: t("packageSelect"), value: "" },
    { label: t("packageSunbath"), value: "Sunbath on Sands Standard" },
    { label: t("packageGlamour"), value: "Glamour of Sri Lanka" },
    { label: t("packageClassic"), value: "A Classic of the City" },
    { label: t("packageHeart"), value: "The Heart of City" },
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
        <Combobox
          name="country"
          label={t("country")}
          placeholder={tAuth("countrySearchPlaceholder")}
          options={countryOptions}
          defaultValue={state.values?.country}
          onChange={onCountryChange}
          emptyText={tAuth("noCountryMatches")}
          required
        />

        <div className="form-field">
          <label htmlFor="phone">{t("phone")}</label>
          <input
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            placeholder="+94 77 000 0000"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
        </div>

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
        <button
          className="btn btn-primary"
          type="submit"
          disabled={pending}
          aria-busy={pending}
        >
          {pending ? <Spinner /> : null}
          {pending ? t("sending") : t("sendEnquiry")}
          {!pending ? (
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
              <path
                d="M5 12h14M13 6l6 6-6 6"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : null}
        </button>
        <p
          className={`form-note${
            feedback === "error"
              ? " is-error"
              : feedback === "success"
                ? " is-success"
                : ""
          }`}
          id="formNote"
          aria-live="polite"
        >
          {state.note || t("shareHint")}
        </p>
      </div>
    </form>
  );
}
