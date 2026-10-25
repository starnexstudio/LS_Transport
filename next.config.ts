import type { NextConfig } from "next";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || undefined;
const nextConfig: NextConfig = {
  output: "export",
  basePath,
  trailingSlash: true,
  images: { unoptimized: true },
  devIndicators: false,
  // The dev server only serves its scripts to localhost by default; without this,
  // a page opened at 127.0.0.1 never starts (no hero scene, no buttons).
  allowedDevOrigins: ["127.0.0.1"],
};
export default nextConfig;
