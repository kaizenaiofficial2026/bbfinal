import type { MetadataRoute } from "next";
import { locales } from "@/i18n/routing";

const BASE = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
).replace(/\/+$/, "");

// Staff, API, and per-customer/transactional areas stay out of the index.
const PRIVATE_PATHS = [
  "/admin",
  "/api",
  "/account",
  "/pay",
  "/forgot-password",
  "/reset-password",
];

// `localePrefix: "as-needed"` means every private path also lives under each
// locale prefix (e.g. /ar/pay/<token>, /ur/account). Without listing those too,
// a shared pay link could be crawled and indexed at its localized URL. The
// non-default locales carry a prefix; the default locale ("en") does not.
const NON_DEFAULT_LOCALES = locales.filter((l) => l !== "en");

export default function robots(): MetadataRoute.Robots {
  const disallow = [
    ...PRIVATE_PATHS,
    ...NON_DEFAULT_LOCALES.flatMap((locale) =>
      PRIVATE_PATHS.map((path) => `/${locale}${path}`),
    ),
  ];

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow,
    },
    sitemap: `${BASE}/sitemap.xml`,
    host: BASE,
  };
}
