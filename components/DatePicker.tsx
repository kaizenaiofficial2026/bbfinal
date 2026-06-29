"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLocale } from "next-intl";

type DatePickerProps = {
  id: string;
  label: string;
  value: string; // ISO "YYYY-MM-DD" or ""
  onChange: (iso: string) => void;
  min?: string; // ISO; days before this are disabled
  max?: string; // ISO; days after this are disabled (e.g. date of birth)
  initialView?: string; // ISO; month shown first when there's no value (e.g. DOB)
  placeholder?: string;
  error?: string;
  invalid?: boolean; // red ring without an inline message (shared/external error)
  fieldClassName?: string; // wrapper class — "form-field" (default) or "auth-field"
};

const pad = (n: number) => String(n).padStart(2, "0");
const toIso = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;

function parseIso(s: string): { y: number; m: number; d: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!match) return null;
  return { y: Number(match[1]), m: Number(match[2]) - 1, d: Number(match[3]) };
}

const daysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
const firstWeekday = (y: number, m: number) => new Date(y, m, 1).getDay();

// The locale's first day of the week as a JS index (0=Sun..6=Sat). Falls back
// to Sunday where Intl.Locale weekInfo isn't available.
function localeFirstDay(locale: string): number {
  try {
    const loc = new Intl.Locale(locale) as Intl.Locale & {
      weekInfo?: { firstDay?: number };
      getWeekInfo?: () => { firstDay?: number };
    };
    const info = typeof loc.getWeekInfo === "function" ? loc.getWeekInfo() : loc.weekInfo;
    const fd = info?.firstDay; // 1=Mon..7=Sun
    return typeof fd === "number" ? fd % 7 : 0;
  } catch {
    return 0;
  }
}

export default function DatePicker({
  id,
  label,
  value,
  onChange,
  min,
  max,
  initialView,
  placeholder,
  error,
  invalid,
  fieldClassName = "form-field",
}: DatePickerProps) {
  const locale = useLocale();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [focusedDay, setFocusedDay] = useState(1);

  const todayParts = useMemo(() => {
    const now = new Date();
    return { y: now.getFullYear(), m: now.getMonth(), d: now.getDate() };
  }, []);

  const selected = useMemo(() => parseIso(value), [value]);
  const minIso = min ?? "";
  const maxIso = max ?? "";
  const firstDayOfWeek = useMemo(() => localeFirstDay(locale), [locale]);

  // When nothing is selected, open on `initialView` if given (e.g. a sensible
  // birth year for date-of-birth fields), else the min month, else today.
  const baseParts = () =>
    selected ?? parseIso(initialView ?? "") ?? parseIso(min ?? "") ?? todayParts;

  const [view, setView] = useState(() => {
    const base = baseParts();
    return { y: base.y, m: base.m };
  });

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  // Move focus to the active day cell when the calendar opens and as the user
  // arrows around (roving tabindex).
  useEffect(() => {
    if (!open) return;
    document.getElementById(`${id}-day-${focusedDay}`)?.focus();
  }, [open, focusedDay, view, id]);

  const openPicker = () => {
    const base = baseParts();
    setView({ y: base.y, m: base.m });
    setFocusedDay(base.d);
    setOpen(true);
  };

  const closePicker = (restoreFocus: boolean) => {
    setOpen(false);
    if (restoreFocus) triggerRef.current?.focus();
  };

  const monthLabel = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(
        new Date(view.y, view.m, 1),
      ),
    [locale, view],
  );

  const weekdays = useMemo(() => {
    const fmt = new Intl.DateTimeFormat(locale, { weekday: "short" });
    // 2024-01-07 is a Sunday; rotate so the week starts on the locale's first day.
    return Array.from({ length: 7 }, (_, i) =>
      fmt.format(new Date(2024, 0, 7 + ((firstDayOfWeek + i) % 7))),
    );
  }, [locale, firstDayOfWeek]);

  const displayValue = useMemo(() => {
    if (!selected) return "";
    return new Intl.DateTimeFormat(locale, {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(selected.y, selected.m, selected.d));
  }, [locale, selected]);

  const shiftMonth = (delta: number) => {
    setView((v) => {
      const m = v.m + delta;
      const y = v.y + Math.floor(m / 12);
      const mm = ((m % 12) + 12) % 12;
      return { y, m: mm };
    });
  };

  const shiftYear = (delta: number) => setView((v) => ({ ...v, y: v.y + delta }));

  // Move the keyboard focus by N days, crossing month boundaries as needed and
  // never landing on a day outside the [min, max] range.
  const moveFocus = (deltaDays: number) => {
    const base = new Date(view.y, view.m, focusedDay);
    base.setDate(base.getDate() + deltaDays);
    const ny = base.getFullYear();
    const nm = base.getMonth();
    const nd = base.getDate();
    const iso = toIso(ny, nm, nd);
    if (minIso && iso < minIso) return;
    if (maxIso && iso > maxIso) return;
    if (ny !== view.y || nm !== view.m) setView({ y: ny, m: nm });
    setFocusedDay(nd);
  };

  const onPopKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "Escape":
        e.preventDefault();
        closePicker(true);
        break;
      case "ArrowRight":
        e.preventDefault();
        moveFocus(1);
        break;
      case "ArrowLeft":
        e.preventDefault();
        moveFocus(-1);
        break;
      case "ArrowDown":
        e.preventDefault();
        moveFocus(7);
        break;
      case "ArrowUp":
        e.preventDefault();
        moveFocus(-7);
        break;
      case "Home":
        e.preventDefault();
        setFocusedDay(1);
        break;
      case "End":
        e.preventDefault();
        setFocusedDay(daysInMonth(view.y, view.m));
        break;
    }
  };

  const lead = (firstWeekday(view.y, view.m) - firstDayOfWeek + 7) % 7;
  const cells: (number | null)[] = [];
  for (let i = 0; i < lead; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth(view.y, view.m); d++) cells.push(d);

  const pick = (d: number) => {
    onChange(toIso(view.y, view.m, d));
    closePicker(true);
  };

  return (
    <div
      className={`${fieldClassName} datepicker${error || invalid ? " is-invalid" : ""}`}
      ref={rootRef}
    >
      <label htmlFor={id}>{label}</label>
      <button
        id={id}
        ref={triggerRef}
        type="button"
        className="datepicker-trigger"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => (open ? closePicker(false) : openPicker())}
      >
        <span className={displayValue ? "datepicker-value" : "datepicker-placeholder"}>
          {displayValue || placeholder || "Select a date"}
        </span>
        <span className="datepicker-icon" aria-hidden="true" />
      </button>

      {open ? (
        <div
          className="datepicker-pop"
          role="dialog"
          aria-label={label}
          onKeyDown={onPopKeyDown}
        >
          <div className="dp-header">
            <div className="dp-nav-group">
              <button
                type="button"
                className="dp-nav"
                aria-label="Previous year"
                onClick={() => shiftYear(-1)}
              >
                «
              </button>
              <button
                type="button"
                className="dp-nav"
                aria-label="Previous month"
                onClick={() => shiftMonth(-1)}
              >
                ‹
              </button>
            </div>
            <span className="dp-month">{monthLabel}</span>
            <div className="dp-nav-group">
              <button
                type="button"
                className="dp-nav"
                aria-label="Next month"
                onClick={() => shiftMonth(1)}
              >
                ›
              </button>
              <button
                type="button"
                className="dp-nav"
                aria-label="Next year"
                onClick={() => shiftYear(1)}
              >
                »
              </button>
            </div>
          </div>
          <div className="dp-grid" role="grid">
            {weekdays.map((w, i) => (
              <span key={`wd-${i}`} className="dp-weekday" role="columnheader">
                {w}
              </span>
            ))}
            {cells.map((d, i) => {
              if (d === null) return <span key={`b-${i}`} className="dp-blank" />;
              const iso = toIso(view.y, view.m, d);
              const disabled =
                (!!minIso && iso < minIso) || (!!maxIso && iso > maxIso);
              const isSelected = !!selected && iso === value;
              const isToday =
                d === todayParts.d &&
                view.m === todayParts.m &&
                view.y === todayParts.y;
              return (
                <button
                  key={iso}
                  id={`${id}-day-${d}`}
                  type="button"
                  className={`dp-day${isSelected ? " is-selected" : ""}${
                    isToday ? " is-today" : ""
                  }`}
                  role="gridcell"
                  aria-selected={isSelected}
                  tabIndex={d === focusedDay ? 0 : -1}
                  disabled={disabled}
                  onClick={() => pick(d)}
                >
                  {d}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {error ? (
        <p className="field-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
