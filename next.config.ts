import type { NextConfig } from "next";

const isProduction = process.env.NODE_ENV === "production";
const securityHeaders = [
  ...(isProduction
    ? [{ key: "Content-Security-Policy", value: "default-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; script-src 'self'; connect-src 'self'" }]
    : []),
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" }
];

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  async headers() {
    return [{
      source: "/(.*)",
      headers: securityHeaders
    }];
  }
};

export default nextConfig;
