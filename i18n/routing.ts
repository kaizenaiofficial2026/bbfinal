import { defineRouting } from "next-intl/routing";

export const locales = ["en", "ar", "hi", "kn", "te", "ur", "zh"] as const;
export type Locale = (typeof locales)[number];

// Right-to-left scripts (Arabic, Urdu). Used to set <html dir>.
export const rtlLocales: readonly Locale[] = ["ar", "ur"];

export function isRtl(locale: string) {
  return (rtlLocales as readonly string[]).includes(locale);
}

export const localeLabels: Record<Locale, string> = {
  en: "English",
  ar: "العربية",
  hi: "हिन्दी",
  kn: "ಕನ್ನಡ",
  te: "తెలుగు",
  ur: "اردو",
  zh: "中文",
};

export const routing = defineRouting({
  locales,
  defaultLocale: "en",
  // English stays unprefixed (/tours); others are prefixed (/ar/tours).
  localePrefix: "as-needed",
});
