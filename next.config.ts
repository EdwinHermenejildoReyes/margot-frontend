import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.100.5"],
  images: {
    unoptimized: true,
  },
  skipTrailingSlashRedirect: true,
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: "http://localhost:8004/api/v1/:path*",
      },
      {
        source: "/media/:path*",
        destination: "http://localhost:8004/media/:path*",
      },
    ];
  },
};

export default nextConfig;
