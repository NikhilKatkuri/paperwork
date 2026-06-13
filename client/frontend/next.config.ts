import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.31.253"],
  turbopack: {
    root:__dirname,
  }
};

export default nextConfig;
