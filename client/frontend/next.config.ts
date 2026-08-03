import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.31.8", "172.25.96.1"],
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
