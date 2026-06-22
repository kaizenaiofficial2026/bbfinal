import { redirect } from "@/i18n/navigation";

/**
 * Locale-aware redirect with an explicit `never` return so TypeScript's
 * control-flow analysis treats it as terminating (next-intl's navigation
 * redirect doesn't surface its `never` return through the destructured export).
 * Prepends the active locale prefix per the routing config (`as-needed`).
 */
export function localeRedirect(href: string, locale: string): never {
  redirect({ href, locale });
  // Unreachable: redirect() throws to interrupt rendering.
  throw new Error("redirect did not throw");
}
