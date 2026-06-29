"use client";

import { useCallback, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import Combobox, { type ComboboxOption } from "./Combobox";
import DateField from "./DateField";
import { COUNTRIES, dialCodeForCountry } from "@/lib/data/countries";
import { todayIso } from "@/lib/validation/dates";

// Country → City → Mobile → Date of birth for the registration form. The
// country is chosen first; selecting it enables the city search (scoped to that
// country) and pre-fills the mobile number with the country's calling code.
// Stored `country` is the canonical English name; `city`/`phone` are free text.
export default function RegisterContactFields({
  defaultCountry,
  defaultCity,
  defaultPhone,
  defaultDateOfBirth,
}: {
  defaultCountry?: string;
  defaultCity?: string;
  defaultPhone?: string;
  defaultDateOfBirth?: string;
}) {
  const t = useTranslations("auth");
  const locale = useLocale();

  const regionNames = useMemo(() => {
    try {
      return new Intl.DisplayNames([locale], { type: "region" });
    } catch {
      return null;
    }
  }, [locale]);

  const countryOptions = useMemo<ComboboxOption[]>(() => {
    return COUNTRIES.map((c) => {
      // Intl.DisplayNames can throw on a few unusual region codes; fall back to
      // the English name rather than crashing the whole list.
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
        keywords: `${c.code} ${c.name}`,
      };
    }).sort((a, b) => a.label.localeCompare(b.label, locale));
  }, [regionNames, locale]);

  // Derive the starting country code from an echoed English name, if any.
  const initialCode = useMemo(
    () => COUNTRIES.find((c) => c.name === defaultCountry)?.code ?? "",
    [defaultCountry],
  );
  const [countryCode, setCountryCode] = useState(initialCode);
  const [phone, setPhone] = useState(defaultPhone ?? "");

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
          const stripRe = oldDial
            ? new RegExp(`^\\+${oldDial}\\s*`)
            : /^\+\s*/;
          const rest = prev.replace(stripRe, "");
          return `+${newDial} ${rest}`;
        });
      }
    },
    [countryCode],
  );

  const loadCities = useCallback(
    async (query: string, signal: AbortSignal): Promise<ComboboxOption[]> => {
      if (!countryCode) return [];
      const res = await fetch(
        `/api/cities?country=${countryCode}&q=${encodeURIComponent(query)}`,
        { signal },
      );
      if (!res.ok) return [];
      const data = (await res.json()) as { cities?: string[] };
      return (data.cities ?? []).map((name) => ({ value: name, label: name }));
    },
    [countryCode],
  );

  return (
    <>
      <div className="auth-grid-2">
        <Combobox
          name="country"
          label={t("country")}
          placeholder={t("countrySearchPlaceholder")}
          options={countryOptions}
          defaultValue={defaultCountry}
          required
          onChange={onCountryChange}
          emptyText={t("noCountryMatches")}
        />
        <Combobox
          // Remount when the country changes so the city selection resets.
          key={countryCode || "no-country"}
          name="city"
          label={t("city")}
          placeholder={t("citySearchPlaceholder")}
          loadOptions={loadCities}
          defaultValue={countryCode ? defaultCity : undefined}
          defaultLabel={defaultCity}
          allowCustom
          required
          disabled={!countryCode}
          disabledHint={t("selectCountryFirst")}
          emptyText={t("noCityMatches")}
          loadingText={t("searching")}
        />
      </div>

      <div className="auth-grid-2">
        <div className="auth-field">
          <label htmlFor="reg-phone">{t("mobileNumber")}</label>
          <input
            id="reg-phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            placeholder="+94 77 000 0000"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
        </div>
        <DateField
          id="reg-dob"
          name="dateOfBirth"
          label={t("dateOfBirth")}
          defaultValue={defaultDateOfBirth}
          max={todayIso()}
          initialView="2000-01-01"
          placeholder={t("datePlaceholder")}
          fieldClassName="auth-field"
        />
      </div>
    </>
  );
}
