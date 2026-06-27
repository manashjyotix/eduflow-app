import type { NextConfig } from "next"

const isDev = process.env.NODE_ENV === "development"

const nextConfig: NextConfig = {
  async headers() {
    const scriptSrc = isDev
      // Dev: webpack HMR + eval-based source maps need unsafe-eval & unsafe-inline
      ? "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://maps.googleapis.com"
      // Prod: Next.js needs unsafe-inline only for the tiny inline bootstrap script
      : "script-src 'self' 'unsafe-inline' https://maps.googleapis.com"

    const connectSrc = isDev
      // Dev: allow webpack HMR websocket
      ? "connect-src 'self' https://api.open-meteo.com https://air-quality-api.open-meteo.com https://geocoding-api.open-meteo.com https://api.bigdatacloud.net https://nominatim.openstreetmap.org https://earthquake.usgs.gov https://maps.googleapis.com ws://localhost:* wss://localhost:*"
      : "connect-src 'self' https://api.open-meteo.com https://air-quality-api.open-meteo.com https://geocoding-api.open-meteo.com https://api.bigdatacloud.net https://nominatim.openstreetmap.org https://earthquake.usgs.gov https://maps.googleapis.com"

    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              scriptSrc,
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "img-src 'self' data: blob: https://*.googleapis.com https://*.gstatic.com https://*.google.com",
              "font-src 'self'",
              connectSrc,
              "frame-ancestors 'none'",
            ].join("; "),
          },
        ],
      },
    ]
  },
}

export default nextConfig
