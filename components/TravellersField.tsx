"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { FLIGHT_CLASSES } from "@/lib/data/custom-inquiry-options";

type TravellersFieldProps = {
  label: string;
  defaultClass?: string;
  defaultAdults?: number;
  defaultChildren?: number;
  error?: string;
};

const MAX_PAX = 9;

function clampInt(value: number, min: number, max: number) {
  if (Number.isNaN(value)) return min;
  return Math.min(max, Math.max(min, Math.round(value)));
}

export default function TravellersField({
  label,
  defaultClass,
  defaultAdults,
  defaultChildren,
  error,
}: TravellersFieldProps) {
  const t = useTranslations("customQuote");
  const tOpt = useTranslations("formOptions");
  // Localised cabin-class label for display; the posted value stays English.
  const classLabel = (c: string) => (tOpt.has(c) ? tOpt(c) : c);
  const rootRef = useRef<HTMLDivElement>(null);
  const classRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [classOpen, setClassOpen] = useState(false);

  const [cabinClass, setCabinClass] = useState(
    defaultClass && FLIGHT_CLASSES.includes(defaultClass as never)
      ? defaultClass
      : FLIGHT_CLASSES[0],
  );
  const [classActive, setClassActive] = useState(() =>
    Math.max(0, FLIGHT_CLASSES.indexOf(cabinClass as never)),
  );
  const [adults, setAdults] = useState(() =>
    clampInt(defaultAdults ?? 1, 1, MAX_PAX),
  );
  const [children, setChildren] = useState(() =>
    clampInt(defaultChildren ?? 0, 0, MAX_PAX),
  );

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      const target = e.target as Node;
      if (!rootRef.current?.contains(target)) {
        setOpen(false);
        setClassOpen(false);
      } else if (classRef.current && !classRef.current.contains(target)) {
        setClassOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const chooseClass = (c: string) => {
    setCabinClass(c);
    setClassActive(Math.max(0, FLIGHT_CLASSES.indexOf(c as never)));
    setClassOpen(false);
  };

  const onClassKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (!classOpen) setClassOpen(true);
        else setClassActive((a) => (a + 1) % FLIGHT_CLASSES.length);
        break;
      case "ArrowUp":
        e.preventDefault();
        if (classOpen) {
          setClassActive(
            (a) => (a - 1 + FLIGHT_CLASSES.length) % FLIGHT_CLASSES.length,
          );
        }
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        if (classOpen) chooseClass(FLIGHT_CLASSES[classActive]);
        else setClassOpen(true);
        break;
      case "Escape":
        if (classOpen) {
          e.preventDefault();
          setClassOpen(false);
        }
        break;
    }
  };

  const summary =
    `${t("paxAdults", { count: adults })}` +
    (children > 0 ? `, ${t("paxChildren", { count: children })}` : "") +
    ` · ${classLabel(cabinClass)}`;

  const stepper = (
    value: number,
    setValue: (n: number) => void,
    min: number,
    name: string,
  ) => (
    <div className="pax-stepper">
      <button
        type="button"
        className="pax-step"
        aria-label={`${t("paxDecrease")} ${name}`}
        disabled={value <= min}
        onClick={() => setValue(clampInt(value - 1, min, MAX_PAX))}
      >
        −
      </button>
      <span className="pax-count" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        className="pax-step"
        aria-label={`${t("paxIncrease")} ${name}`}
        disabled={value >= MAX_PAX}
        onClick={() => setValue(clampInt(value + 1, min, MAX_PAX))}
      >
        +
      </button>
    </div>
  );

  return (
    <div
      className={`form-field travellers${error ? " is-invalid" : ""}`}
      ref={rootRef}
    >
      <label htmlFor="travellers-trigger">{label}</label>
      <button
        id="travellers-trigger"
        type="button"
        className="travellers-trigger"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="travellers-summary">{summary}</span>
        <span className="travellers-caret" aria-hidden="true" />
      </button>

      {open ? (
        <div className="travellers-pop" role="dialog" aria-label={label}>
          <div className="travellers-class">
            <span className="travellers-pop-label" id="cabin-class-label">
              {t("cabinClass")}
            </span>
            <div
              className={`select${classOpen ? " is-open" : ""}`}
              ref={classRef}
              onKeyDown={onClassKeyDown}
            >
              <button
                type="button"
                className="select-trigger"
                aria-haspopup="listbox"
                aria-expanded={classOpen}
                aria-labelledby="cabin-class-label"
                onClick={() => setClassOpen((o) => !o)}
              >
                <span className="select-value">{classLabel(cabinClass)}</span>
              </button>
              <ul
                className="select-menu"
                role="listbox"
                aria-labelledby="cabin-class-label"
                data-lenis-prevent
              >
                {FLIGHT_CLASSES.map((c, i) => (
                  <li
                    key={c}
                    className={`select-option${i === classActive ? " is-active" : ""}`}
                    role="option"
                    aria-selected={c === cabinClass}
                    onClick={() => chooseClass(c)}
                    onMouseMove={() => setClassActive(i)}
                  >
                    {classLabel(c)}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="travellers-row">
            <div className="travellers-who">
              <span className="travellers-who-name">{t("paxAdultsLabel")}</span>
              <span className="travellers-who-age">{t("paxAdultsAge")}</span>
            </div>
            {stepper(adults, setAdults, 1, t("paxAdultsLabel"))}
          </div>

          <div className="travellers-row">
            <div className="travellers-who">
              <span className="travellers-who-name">{t("paxChildrenLabel")}</span>
              <span className="travellers-who-age">{t("paxChildrenAge")}</span>
            </div>
            {stepper(children, setChildren, 0, t("paxChildrenLabel"))}
          </div>

          <button
            type="button"
            className="btn btn-primary travellers-apply"
            onClick={() => setOpen(false)}
          >
            {t("paxApply")}
          </button>
        </div>
      ) : null}

      {/* Always-present hidden inputs carry the committed values. */}
      <input type="hidden" name="airClass" value={cabinClass} />
      <input type="hidden" name="airAdults" value={adults} />
      <input type="hidden" name="airChildren" value={children} />

      {error ? (
        <p className="field-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
