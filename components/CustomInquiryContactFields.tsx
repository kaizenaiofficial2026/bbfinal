"use client";

import { useCallback, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import Combobox, { type ComboboxOption } from "./Combobox";
import { COUNTRIES, dialCodeForCountry } from "@/lib/data/countries";

// Country + City + Mobile for the custom-inquiry "Your details" block, mirroring
// the register form: a searchable country dropdown (flags + locale-aware names)
// that scopes the city search and pre-fills the mobile dialling code. Country +
// City are combined into the single hidden `countryCity` field the inquiry
// schema expects; the mobile posts as `mobile`. Renders three plain grid cells
// (no wrapper) so it sits inside the form's existing .form-grid.
export default function CustomInquiryContactFields({
  defaultCountryCity,
  defaultMobile,
  errors,
  clearError,
}: {
  defaultCountryCity?: string;
  defaultMobile?: string;
  errors: Record<string, string>;
  clearError: (key: string) => void;
}) {
  const t = useTranslations("auth");
  const locale = useLocale();

  // Best-effort split of an echoed "City, Country" value back into parts. Match
  // the country half against the known list first (longest suffix wins) so a
  // country name that itself contains a comma isn't mis-split.
  const initial = useMemo(() => {
    const raw = (defaultCountryCity ?? "").trim();
    if (!raw) return { city: "", country: "" };
    const hit = COUNTRIES.filter(
      (c) => raw === c.name || raw.endsWith(`, ${c.name}`),
    ).sort((a, b) => b.name.length - a.name.length)[0];
    if (hit) {
      const city = raw
        .slice(0, raw.length - hit.name.length)
        .replace(/,\s*$/, "")
        .trim();
      return { city, country: hit.name };
    }
    const idx = raw.lastIndexOf(",");
    if (idx < 0) return { city: "", country: raw };
    return { city: raw.slice(0, idx).trim(), country: raw.slice(idx + 1).trim() };
  }, [defaultCountryCity]);

  const initialCode = useMemo(
    () => COUNTRIES.find((c) => c.name === initial.country)?.code ?? "",
    [initial.country],
  );

  const [countryCode, setCountryCode] = useState(initialCode);
  const [country, setCountry] = useState(initial.country);
  const [city, setCity] = useState(initial.city);
  const [phone, setPhone] = useState(defaultMobile ?? "");

  const countryCity = useMemo(
    () => [city.trim(), country.trim()].filter(Boolean).join(", "),
    [city, country],
  );

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
        value: c.name,
        label,
        iconCode: c.code,
        keywords: `${c.code} ${c.name}`,
      };
    }).sort((a, b) => a.label.localeCompare(b.label, locale));
  }, [regionNames, locale]);

  const onCountryChange = useCallback(
    (value: string, option?: ComboboxOption) => {
      setCountry(value);
      const code = option?.iconCode ?? "";
      const newDial = dialCodeForCountry(code);
      const oldDial = dialCodeForCountry(countryCode);
      setCountryCode(code);
      if (newDial) {
        setPhone((prev) => {
          const stripRe = oldDial
            ? new RegExp(`^\\+${oldDial}\\s*`)
            : /^\+\s*/;
          return `+${newDial} ${prev.replace(stripRe, "")}`;
        });
      }
      clearError("countryCity");
    },
    [countryCode, clearError],
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
      <Combobox
        name="_ciCountry"
        label={t("country")}
        placeholder={t("countrySearchPlaceholder")}
        options={countryOptions}
        defaultValue={initial.country}
        required
        onChange={onCountryChange}
        error={errors.countryCity}
        emptyText={t("noCountryMatches")}
      />
      <Combobox
        key={countryCode || "no-country"}
        name="_ciCity"
        label={t("city")}
        placeholder={t("citySearchPlaceholder")}
        loadOptions={loadCities}
        defaultValue={countryCode ? initial.city : undefined}
        defaultLabel={initial.city}
        allowCustom
        disabled={!countryCode}
        disabledHint={t("selectCountryFirst")}
        emptyText={t("noCityMatches")}
        loadingText={t("searching")}
        onChange={(value) => {
          setCity(value);
          clearError("countryCity");
        }}
      />
      <div className={`form-field${errors.mobile ? " is-invalid" : ""}`}>
        <label htmlFor="ci-mobile">{t("mobileNumber")}</label>
        <input
          id="ci-mobile"
          name="mobile"
          type="tel"
          autoComplete="tel"
          placeholder="+94 77 000 0000"
          value={phone}
          onChange={(e) => {
            setPhone(e.target.value);
            clearError("mobile");
          }}
        />
        {errors.mobile ? (
          <p className="field-error" role="alert">
            {errors.mobile}
          </p>
        ) : null}
      </div>

      <input type="hidden" name="countryCity" value={countryCity} />
    </>
  );
}
