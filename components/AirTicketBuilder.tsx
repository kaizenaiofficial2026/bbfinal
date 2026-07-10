"use client";

import { useCallback, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import Combobox, { type ComboboxOption } from "./Combobox";
import BaseSelect from "./Select";
import DatePicker from "./DatePicker";
import TravellersField from "./TravellersField";
import { todayIso } from "@/lib/validation/dates";
import { AIRLINES } from "@/lib/data/airlines";
import { COUNTRIES } from "@/lib/data/countries";
import { YES_NO } from "@/lib/data/custom-inquiry-options";
import {
  MAX_SEGMENTS,
  TRIP_TYPES,
  isTripType,
  parseSegments,
  type AirSegment,
  type TripType,
} from "@/lib/validation/air-segments";

const DEFAULT_DESTINATION = "Colombo (CMB)";

type Seg = AirSegment & { id: number };

type AirTicketBuilderProps = {
  /** Echoed trip type after a failed submit. */
  defaultTripType?: string;
  /** Echoed airSegments JSON after a failed submit. */
  defaultSegments?: string;
  /** Echoed flight-detail values after a failed submit. */
  defaultAirline?: string;
  defaultClass?: string;
  defaultAdults?: string;
  defaultChildren?: string;
  defaultExtraBaggage?: string;
  /** Validation errors, keyed `air-from-<i>` / `air-to-<i>` / `air-date-<i>` /
   *  `air-return` / `air-trip`, plus the scalar field keys (`airline`, …). */
  errors: Record<string, string>;
  clearError: (key: string) => void;
};

// Next unused synthetic id for stable React keys (pure — no ref needed).
function nextId(segs: Seg[]): number {
  return segs.reduce((max, s) => Math.max(max, s.id), -1) + 1;
}

function buildDefaults(tripType: TripType): AirSegment[] {
  if (tripType === "Multi-city") {
    return [
      { from: "", to: "", date: "" },
      { from: "", to: "", date: "" },
    ];
  }
  const seg: AirSegment = { from: "", to: DEFAULT_DESTINATION, date: "" };
  if (tripType === "Round trip") seg.returnDate = "";
  return [seg];
}

export default function AirTicketBuilder({
  defaultTripType,
  defaultSegments,
  defaultAirline,
  defaultClass,
  defaultAdults,
  defaultChildren,
  defaultExtraBaggage,
  errors,
  clearError,
}: AirTicketBuilderProps) {
  const t = useTranslations("customQuote");
  const locale = useLocale();
  const today = useMemo(() => todayIso(), []);

  // Localize the country subtitle shown under each airline. Airline brand names
  // and IATA codes stay as-is (proper nouns, Latin script — the global norm in
  // flight UIs), but the country descriptor renders in the visitor's language.
  const localizeCountry = useMemo(() => {
    const codeByName = new Map<string, string>();
    for (const c of COUNTRIES) codeByName.set(c.name.toLowerCase(), c.code);
    let regionNames: Intl.DisplayNames | null = null;
    try {
      regionNames = new Intl.DisplayNames([locale], { type: "region" });
    } catch {
      regionNames = null;
    }
    return (name: string): string | undefined => {
      if (!name) return undefined;
      const code = codeByName.get(name.toLowerCase());
      if (!code || !regionNames) return name;
      try {
        const loc = regionNames.of(code);
        return loc && loc !== code ? loc : name;
      } catch {
        return name;
      }
    };
  }, [locale]);

  const airlineOptions = useMemo<ComboboxOption[]>(
    () =>
      AIRLINES.map((a) => ({
        // Include the IATA code so same-named airlines stay distinct (unique
        // option value/React key) and the user can tell them apart.
        value: `${a.name} (${a.iata})`,
        label: `${a.name} (${a.iata})`,
        sublabel: localizeCountry(a.country),
        keywords: `${a.iata} ${a.country}`,
      })),
    [localizeCountry],
  );

  const initialTrip: TripType = isTripType(defaultTripType ?? "")
    ? (defaultTripType as TripType)
    : "One way";

  const [tripType, setTripType] = useState<TripType>(initialTrip);
  const [segments, setSegments] = useState<Seg[]>(() => {
    const echoed = parseSegments(defaultSegments ?? "");
    const base = echoed.length ? echoed : buildDefaults(initialTrip);
    return base.map((s, i) => ({ ...s, id: i }));
  });

  // The hidden inputs the form posts. returnDate is only relevant for a round
  // trip; strip the synthetic id from the serialised payload.
  const serialized = useMemo(
    () =>
      JSON.stringify(
        segments.map((s) =>
          tripType === "Round trip"
            ? { from: s.from, to: s.to, date: s.date, returnDate: s.returnDate ?? "" }
            : { from: s.from, to: s.to, date: s.date },
        ),
      ),
    [segments, tripType],
  );

  const errFor = (key: string) => errors[`air-${key}`];
  const clearAir = (key: string) => clearError(`air-${key}`);
  const clearTripErrors = () => {
    // Clear every air-scoped error when the structure changes.
    for (const k of Object.keys(errors)) if (k.startsWith("air-")) clearError(k);
  };

  const switchTrip = (next: TripType) => {
    if (next === tripType) return;
    clearTripErrors();
    setTripType(next);
    setSegments((prev) => {
      if (next === "Multi-city") {
        const base: Seg[] = prev.map((s) => ({
          id: s.id,
          from: s.from,
          to: s.to,
          date: s.date,
        }));
        while (base.length < 2) {
          base.push({ id: nextId(base), from: "", to: "", date: "" });
        }
        return base;
      }
      const first = prev[0];
      const seg: Seg = {
        id: first?.id ?? 0,
        from: first?.from ?? "",
        to: first?.to || DEFAULT_DESTINATION,
        date: first?.date ?? "",
      };
      if (next === "Round trip") seg.returnDate = first?.returnDate ?? "";
      return [seg];
    });
  };

  const patchSegment = (i: number, patch: Partial<Seg>, errorKey?: string) => {
    setSegments((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
    if (errorKey) clearAir(errorKey);
  };

  const swap = (i: number) => {
    setSegments((prev) =>
      prev.map((s, idx) => (idx === i ? { ...s, from: s.to, to: s.from } : s)),
    );
    clearAir(`from-${i}`);
    clearAir(`to-${i}`);
  };

  const addLeg = () => {
    setSegments((prev) =>
      prev.length >= MAX_SEGMENTS
        ? prev
        : [...prev, { id: nextId(prev), from: "", to: "", date: "" }],
    );
  };

  const removeLeg = (i: number) => {
    clearTripErrors();
    setSegments((prev) => (prev.length > 2 ? prev.filter((_, idx) => idx !== i) : prev));
  };

  const loadPlaces = useCallback(
    async (query: string, signal: AbortSignal): Promise<ComboboxOption[]> => {
      if (query.trim().length < 2) return [];
      const res = await fetch(
        `/api/places?q=${encodeURIComponent(query)}&locale=${encodeURIComponent(
          locale,
        )}&allAirports=${encodeURIComponent(t("airAllAirports"))}`,
        { signal },
      );
      if (!res.ok) return [];
      const data = (await res.json()) as {
        places?: { value: string; label: string; sublabel?: string }[];
      };
      return (data.places ?? []).map((p) => ({
        value: p.value,
        label: p.label,
        sublabel: p.sublabel,
      }));
    },
    [locale, t],
  );

  const placeField = (seg: Seg, i: number, field: "from" | "to") => (
    <Combobox
      name={`air-${field}-${seg.id}`}
      label={field === "from" ? t("airFrom") : t("airTo")}
      placeholder={t("airPlacePlaceholder")}
      loadOptions={loadPlaces}
      defaultValue={field === "from" ? seg.from : seg.to}
      defaultLabel={field === "from" ? seg.from : seg.to}
      allowCustom
      required
      error={errFor(`${field}-${i}`)}
      emptyText={t("airNoPlaces")}
      loadingText={t("searching")}
      onChange={(value) => patchSegment(i, { [field]: value }, `${field}-${i}`)}
    />
  );

  const dateField = (
    seg: Seg,
    i: number,
    kind: "date" | "returnDate",
    label: string,
  ) => {
    const errorKey = kind === "date" ? `date-${i}` : "return";
    return (
      <DatePicker
        id={`air-${kind}-${seg.id}`}
        label={label}
        value={seg[kind] ?? ""}
        min={today}
        placeholder={t("datePlaceholder")}
        error={errFor(errorKey)}
        onChange={(iso) =>
          patchSegment(i, { [kind]: iso } as Partial<Seg>, errorKey)
        }
      />
    );
  };

  const isMulti = tripType === "Multi-city";
  const arrowGlyph = tripType === "Round trip" ? "⇄" : "→";

  return (
    <div className="air-builder">
      <div className="trip-tabs" role="tablist" aria-label={t("typeAirticket")}>
        {TRIP_TYPES.map((tt) => {
          const labels: Record<TripType, string> = {
            "One way": t("tripOneWay"),
            "Round trip": t("tripRound"),
            "Multi-city": t("tripMulti"),
          };
          const active = tt === tripType;
          return (
            <button
              key={tt}
              type="button"
              role="tab"
              aria-selected={active}
              className={`trip-tab${active ? " is-active" : ""}`}
              onClick={() => switchTrip(tt)}
            >
              {labels[tt]}
            </button>
          );
        })}
      </div>

      {errFor("trip") ? (
        <p className="field-error" role="alert">
          {errFor("trip")}
        </p>
      ) : null}

      {isMulti ? (
        <div className="air-legs">
          {segments.map((seg, i) => (
            <div className="air-leg" key={seg.id}>
              <div className="air-leg-head">
                <span className="air-leg-title">{t("airFlight", { n: i + 1 })}</span>
                {segments.length > 2 ? (
                  <button
                    type="button"
                    className="air-remove"
                    onClick={() => removeLeg(i)}
                  >
                    {t("airRemoveFlight")}
                  </button>
                ) : null}
              </div>
              <div className="air-places">
                {placeField(seg, i, "from")}
                <button
                  type="button"
                  className="air-swap"
                  aria-label={t("airSwap")}
                  onClick={() => swap(i)}
                >
                  {arrowGlyph}
                </button>
                {placeField(seg, i, "to")}
              </div>
              {dateField(seg, i, "date", t("departureDate"))}
            </div>
          ))}
          {segments.length < MAX_SEGMENTS ? (
            <button type="button" className="air-add" onClick={addLeg}>
              {t("airAddFlight")}
            </button>
          ) : null}
        </div>
      ) : (
        <div className="air-leg">
          <div className="air-places">
            {placeField(segments[0], 0, "from")}
            <button
              type="button"
              className="air-swap"
              aria-label={t("airSwap")}
              onClick={() => swap(0)}
            >
              {arrowGlyph}
            </button>
            {placeField(segments[0], 0, "to")}
          </div>
          <div
            className={`air-dates${
              tripType === "Round trip" ? "" : " air-dates--single"
            }`}
          >
            {dateField(segments[0], 0, "date", t("departureDate"))}
            {tripType === "Round trip"
              ? dateField(segments[0], 0, "returnDate", t("returnDate"))
              : null}
          </div>
        </div>
      )}

      {/* Flight details: airline + travellers/cabin class + extra baggage. */}
      <div className="air-details">
        <Combobox
          name="airline"
          label={t("airline")}
          placeholder={t("airlinePlaceholder")}
          options={airlineOptions}
          defaultValue={defaultAirline}
          allowCustom
          required
          error={errors.airline}
          emptyText={t("airNoPlaces")}
          onChange={() => clearError("airline")}
        />
        <div className="air-details-grid">
          <TravellersField
            label={t("travellersLabel")}
            defaultClass={defaultClass}
            defaultAdults={defaultAdults ? Number(defaultAdults) : undefined}
            defaultChildren={defaultChildren ? Number(defaultChildren) : undefined}
          />
          <BaseSelect
            name="airExtraBaggage"
            label={t("extraBaggage")}
            options={[...YES_NO]}
            defaultValue={defaultExtraBaggage || YES_NO[0]}
          />
        </div>
      </div>

      <input type="hidden" name="airTripType" value={tripType} />
      <input type="hidden" name="airSegments" value={serialized} />
    </div>
  );
}
