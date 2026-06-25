import type { MetadataRoute } from "next";

const BASE = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
).replace(/\/+$/, "");

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Staff, API, and per-customer/transactional areas stay out of the index.
      disallow: [
        "/admin",
        "/api",
        "/account",
        "/pay",
        "/forgot-password",
        "/reset-password",
      ],
    },
    sitemap: `${BASE}/sitemap.xml`,
    host: BASE,
  };
}
