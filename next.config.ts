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
    // Next caps Server Action request bodies at 1MB by default, which is too
    // small for the admin forms, so this is raised — but NOT past 4.5MB, because
    // Vercel enforces a hard 4.5MB cap on serverless request bodies that this
    // setting cannot override. A larger value here works locally and then returns
    // a platform 413 in production only, which is the worst kind of bug.
    //
    // Package/destination photos do NOT count against this: MediaUploadField
    // uploads them straight from the browser to Supabase Storage via a signed URL
    // (lib/admin/upload-media.ts) and submits only the resulting URL. The one path
    // that does put bytes in the body is the support-ticket screenshot, which is
    // sent as base64 and is capped at 2MB in the browser.
    serverActions: {
      bodySizeLimit: "4mb",
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
