import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const isDev = process.env.NODE_ENV !== "production";

// Origins the browser must reach for the hosted MPGS checkout and Supabase.
// Derived from env where available, with stable wildcards for prod/test hosts.
function safeOrigin(value: string | undefined, fallback = "") {
  if (!value) return fallback;
  try {
    return new URL(value).origin;
  } catch {
    return fallback;
  }
}

const mpgsOrigin = safeOrigin(
  process.env.MPGS_BASE_URL,
  "https://test-seylan.mtf.gateway.mastercard.com",
);
const supabaseOrigin = safeOrigin(process.env.NEXT_PUBLIC_SUPABASE_URL);
// Hostname for next/image. Admin-uploaded package/destination media is served
// from Supabase Storage (https://<project>.supabase.co/storage/v1/object/public/…).
// Without whitelisting it, the optimizer throws "hostname not configured" and any
// page rendering an uploaded image crashes (e.g. /booking/[slug]).
const supabaseHost = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").hostname;
  } catch {
    return "";
  }
})();

// Vercel Web Analytics + Speed Insights. On a Vercel deployment the script and
// beacons are served same-origin under /_vercel/* (covered by 'self'); these
// external hosts are only reached in local dev, self-hosting, or behind a proxy
// — the loader script (va.vercel-scripts.com) and the Speed Insights vitals
// intake (vitals.vercel-insights.com). Harmless to allow everywhere.
const vercelScript = "https://va.vercel-scripts.com";
const vercelVitals = "https://vitals.vercel-insights.com";

// Content Security Policy. 'unsafe-inline' is required for Next's framework
// inline scripts/styles (no nonce pipeline here); 'unsafe-eval' is dev-only for
// Fast Refresh. The MPGS hosted-checkout script/iframe and Supabase are the only
// third parties. NOTE: validate this in a browser across the live payment flow
// before go-live — a missing gateway host would silently block checkout.
const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} ${mpgsOrigin} https://*.gateway.mastercard.com ${vercelScript}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  `connect-src 'self' ${supabaseOrigin} https://*.supabase.co wss://*.supabase.co ${mpgsOrigin} https://*.gateway.mastercard.com ${vercelScript} ${vercelVitals}`,
  `frame-src 'self' ${mpgsOrigin} https://*.gateway.mastercard.com`,
]
  .map((directive) => directive.replace(/\s+/g, " ").trim())
  .join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  reactCompiler: true,
  experimental: {
    // Admin image uploads run through Server Actions. Next caps action request
    // bodies at 1MB by default, so any real photo (the app allows up to 8MB per
    // image, and a package/destination can post BOTH a card and hero image in one
    // form) failed the whole save with an opaque "unexpected response" error that
    // dropped the admin onto the error page. Raise the limit to comfortably cover
    // two 8MB images plus the form fields and multipart overhead. The forms also
    // validate sizes in the browser so an over-limit upload is caught with a
    // friendly message before it is ever sent.
    serverActions: {
      bodySizeLimit: "20mb",
    },
  },
  images: {
    // Serve modern formats; the optimizer negotiates AVIF/WebP per browser and
    // falls back automatically.
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 31536000,
    // Allow optimizing admin-uploaded media from Supabase Storage (public bucket).
    remotePatterns: supabaseHost
      ? [
          {
            protocol: "https",
            hostname: supabaseHost,
            pathname: "/storage/v1/object/public/**",
          },
        ]
      : [],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
} as NextConfig & { reactCompiler: boolean };

export default withNextIntl(nextConfig);
