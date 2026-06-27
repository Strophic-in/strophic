import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Compile shared workspace packages (they ship TypeScript source).
  transpilePackages: ["@strophic/ui", "@strophic/types", "@strophic/utils"],
};

export default nextConfig;
