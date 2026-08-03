import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.31.8","192.168.137.18"],
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
