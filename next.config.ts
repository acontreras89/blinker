import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // `next dev` from a phone on the LAN: its dev assets (and so hydration) are
  // blocked for any host but localhost without this.
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*", "*.local"],
  cacheComponents: true,
  partialPrefetching: true,
  // Room above the backend's 1 MB content limit, so an oversized save gets the
  // backend's 413 instead of Next's own rejection.
  experimental: { serverActions: { bodySizeLimit: "2mb" } },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
