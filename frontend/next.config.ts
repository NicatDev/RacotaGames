import type { NextConfig } from "next";
const config: NextConfig = {
  output: "standalone",
  experimental: { cpus: 1 },
  poweredByHeader: false,
  devIndicators: false,
  skipTrailingSlashRedirect: true,
  async rewrites() {
    const origin = process.env.API_ORIGIN || "http://127.0.0.1:8010";
    const mediaOrigin = process.env.MEDIA_ORIGIN || origin;
    return [
      { source: "/api/backend/:path*", destination: `${origin}/api/:path*/` },
      {
        source: "/media-proxy/:path*",
        destination: `${mediaOrigin}/media/:path*`,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
        ],
      },
    ];
  },
};
export default config;
