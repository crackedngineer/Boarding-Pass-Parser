import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Required for the production Docker image (copies only the minimal server bundle)
  output: 'standalone',
};

export default nextConfig;
