"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { locales, localeLabels, type Locale } from "@/i18n/routing";

// Secondary English names, shown muted beneath each native label for discoverability.
const localeEnglishLabels: Record<Locale, string> = {
  en: "English",
  ar: "Arabic",
  hi: "Hindi",
  kn: "Kannada",
  te: "Telugu",
  ur: "Urdu",
  zh: "Chinese",
};

export default function LocaleSwitcher() {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();

  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(() =>
    Math.max(0, locales.indexOf(locale)),
  );

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    const onDocClick = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  const choose = (value: Locale) => {
    setOpen(false);
    triggerRef.current?.focus();
    if (value !== locale) {
      router.replace(pathname, { locale: value });
    }
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        if (!open) setOpen(true);
        else setActive((a) => (a + 1) % locales.length);
        break;
      case "ArrowUp":
        event.preventDefault();
        if (!open) setOpen(true);
        else setActive((a) => (a - 1 + locales.length) % locales.length);
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        if (open) choose(locales[active]);
        else setOpen(true);
        break;
      case "Escape":
        if (open) {
          setOpen(false);
          triggerRef.current?.focus();
        }
        break;
      case "Home":
        if (open) {
          event.preventDefault();
          setActive(0);
        }
        break;
      case "End":
        if (open) {
          event.preventDefault();
          setActive(locales.length - 1);
        }
        break;
    }
  };

  return (
    <div
      className={`locale-switcher${open ? " is-open" : ""}`}
      ref={rootRef}
      onKeyDown={onKeyDown}
    >
      <button
        type="button"
        className="locale-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Language: ${localeEnglishLabels[locale]}`}
        ref={triggerRef}
        onClick={() => {
          setActive(Math.max(0, locales.indexOf(locale)));
          setOpen((o) => !o);
        }}
      >
        <svg className="locale-globe" aria-hidden="true" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
          <path
            d="M3 12h18M12 3c2.5 2.4 3.8 5.6 3.8 9s-1.3 6.6-3.8 9c-2.5-2.4-3.8-5.6-3.8-9s1.3-6.6 3.8-9Z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="locale-current">{locale.toUpperCase()}</span>
        <svg className="locale-caret" aria-hidden="true" viewBox="0 0 24 24" fill="none">
          <path
            d="m6 9 6 6 6-6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <ul className="locale-menu" role="listbox" aria-label="Language" tabIndex={-1}>
        {locales.map((value, i) => (
          <li
            key={value}
            className={`locale-option${value === locale ? " is-selected" : ""}${
              i === active ? " is-active" : ""
            }`}
            role="option"
            aria-selected={value === locale}
            lang={value}
            onClick={() => choose(value)}
            onMouseMove={() => setActive(i)}
          >
            <span className="locale-option-native">{localeLabels[value]}</span>
            <span className="locale-option-en">{localeEnglishLabels[value]}</span>
            <svg className="locale-check" aria-hidden="true" viewBox="0 0 24 24" fill="none">
              <path
                d="m5 12 5 5L19 7"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </li>
        ))}
      </ul>
    </div>
  );
}
