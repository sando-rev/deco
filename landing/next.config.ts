import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: false,
  },
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
