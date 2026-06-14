import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  reactCompiler: true,
} as NextConfig & { reactCompiler: boolean };

export default nextConfig;
