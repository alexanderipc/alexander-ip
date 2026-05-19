import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdfkit"],
  turbopack: {
    root: path.resolve(__dirname),
  },
  // Ensure runtime-loaded files (read via fs.readFile from process.cwd) are
  // traced into the Vercel serverless function bundles. Without this, the
  // Stripe webhook + admin server actions would 404 trying to read the
  // guidance .docx files we ship in templates/.
  outputFileTracingIncludes: {
    "/api/webhooks/stripe/route": ["./templates/**/*"],
    "/admin/**": ["./templates/**/*"],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "55mb",
    },
  },
  async rewrites() {
    return [
      {
        source: "/explorer",
        destination: "/explorer/index.html",
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://va.vercel-scripts.com https://cdn.jsdelivr.net",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "font-src 'self' data:",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com",
              "frame-src 'self' https://js.stripe.com",
              "base-uri 'self'",
              "form-action 'self' https://api.stripe.com https://checkout.stripe.com",
              "object-src 'none'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
