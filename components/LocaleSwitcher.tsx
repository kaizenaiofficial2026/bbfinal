"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { locales, localeLabels, type Locale } from "@/i18n/routing";

export default function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  return (
    <select
      className="locale-switcher"
      aria-label="Language"
      value={locale}
      onChange={(event) =>
        router.replace(pathname, { locale: event.target.value as Locale })
      }
    >
      {locales.map((value) => (
        <option key={value} value={value}>
          {localeLabels[value]}
        </option>
      ))}
    </select>
  );
}
