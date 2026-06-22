import "server-only";

import { getLocale } from "next-intl/server";
import type { Json } from "@/lib/supabase/types";

/**
 * Resolve the active request locale, defaulting to English. Wrapped in try/catch
 * because data helpers are also called from non-request contexts (e.g.
 * generateStaticParams) where next-intl has no request scope.
 */
export async function getActiveLocale(): Promise<string> {
  try {
    return await getLocale();
  } catch {
    return "en";
  }
}

/** Pull the `{ field: value }` object for `locale` out of a row's `translations` jsonb. */
export function localeFields(
  translations: Json | null | undefined,
  locale: string,
): Record<string, unknown> {
  if (
    locale === "en" ||
    !translations ||
    typeof translations !== "object" ||
    Array.isArray(translations)
  ) {
    return {};
  }

  const byLocale = (translations as Record<string, unknown>)[locale];
  return byLocale && typeof byLocale === "object" && !Array.isArray(byLocale)
    ? (byLocale as Record<string, unknown>)
    : {};
}

/** Translated string for `key`, falling back to the English base. */
export function tField(
  fields: Record<string, unknown>,
  key: string,
  base: string,
): string {
  const value = fields[key];
  return typeof value === "string" && value.trim() ? value : base;
}

/** Translated string[] for `key`, falling back to the English base array. */
export function tArray(
  fields: Record<string, unknown>,
  key: string,
  base: string[],
): string[] {
  const value = fields[key];
  return Array.isArray(value) && value.length ? (value as string[]) : base;
}
