"use client";

import { useCallback, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import Combobox, { type ComboboxOption } from "./Combobox";
import { COUNTRIES } from "@/lib/data/countries";

// Country + dependent City fields for the registration form. The country list
// is static (ISO-2 codes + flags); its labels are localised at runtime via
// Intl.DisplayNames. Picking a country enables the city field, which searches
// /api/cities for that country. The committed `country` value is the canonical
// English name (consistent storage regardless of UI language); `city` is the
// chosen or freely-typed city name.
export default function RegisterLocationFields({
  defaultCountry,
  defaultCity,
}: {
  defaultCountry?: string;
  defaultCity?: string;
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

  const onCountryChange = useCallback(
    (_value: string, option?: ComboboxOption) => {
      setCountryCode(option?.iconCode ?? "");
    },
    [],
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
  );
}
