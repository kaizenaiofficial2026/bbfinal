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
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} ${mpgsOrigin} https://*.gateway.mastercard.com`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  `connect-src 'self' ${supabaseOrigin} https://*.supabase.co wss://*.supabase.co ${mpgsOrigin} https://*.gateway.mastercard.com`,
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
  images: {
    // Serve modern formats; the optimizer negotiates AVIF/WebP per browser and
    // falls back automatically.
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 31536000,
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
} as NextConfig & { reactCompiler: boolean };

export default withNextIntl(nextConfig);
