import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@resvg/resvg-js"],
  images: {
    domains: ["qrapd3qjiankddu3.public.blob.vercel-storage.com"],
  },
};

export default nextConfig;
