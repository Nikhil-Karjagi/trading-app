import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // This allows production builds to complete even if your project has type errors
    ignoreBuildErrors: true,
  },
  eslint: {
    // This allows production builds to complete even if your project has linting errors
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;