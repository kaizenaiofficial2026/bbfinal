import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  reactStrictMode: true,
  reactCompiler: true,
  images: {
    // Serve modern formats; the optimizer negotiates AVIF/WebP per browser and
    // falls back automatically.
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 31536000,
  },
} as NextConfig & { reactCompiler: boolean };

export default withNextIntl(nextConfig);
