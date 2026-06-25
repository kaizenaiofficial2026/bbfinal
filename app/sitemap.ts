import type { MetadataRoute } from "next";
import { locales } from "@/i18n/routing";
import { getPackageSlugs } from "@/lib/data/packages";
import { getDestinationSlugs } from "@/lib/data/destinations";

const BASE = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
).replace(/\/+$/, "");

/** English is unprefixed (localePrefix: "as-needed"); others carry their code. */
function localizedUrl(locale: string, path: string): string {
  const prefix = locale === "en" ? "" : `/${locale}`;
  return `${BASE}${prefix}${path}`;
}

/** hreflang alternates for every supported locale, plus x-default → English. */
function languagesFor(path: string): Record<string, string> {
  const languages: Record<string, string> = { "x-default": localizedUrl("en", path) };
  for (const locale of locales) {
    languages[locale] = localizedUrl(locale, path);
  }
  return languages;
}

type Route = {
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date();

  const staticRoutes: Route[] = [
    { path: "", changeFrequency: "weekly", priority: 1 },
    { path: "/tours", changeFrequency: "weekly", priority: 0.9 },
    { path: "/destinations", changeFrequency: "weekly", priority: 0.8 },
    { path: "/custom-quote", changeFrequency: "monthly", priority: 0.7 },
    { path: "/about", changeFrequency: "monthly", priority: 0.6 },
    { path: "/contacts", changeFrequency: "monthly", priority: 0.6 },
  ];

  // Resilient: a DB hiccup at build/request time yields no extra rows, not a crash.
  const [packageSlugs, destinationSlugs] = await Promise.all([
    getPackageSlugs().catch(() => [] as string[]),
    getDestinationSlugs().catch(() => [] as string[]),
  ]);

  const dynamicRoutes: Route[] = [
    ...packageSlugs.map((slug) => ({
      path: `/booking/${slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...destinationSlugs.map((slug) => ({
      path: `/${slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];

  return [...staticRoutes, ...dynamicRoutes].map((route) => ({
    url: localizedUrl("en", route.path),
    lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
    alternates: { languages: languagesFor(route.path) },
  }));
}
