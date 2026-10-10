import type { NextConfig } from "next";

const backendOrigin = process.env.BACKEND_ORIGIN ?? "http://localhost:5000";

const isProd = process.env.NODE_ENV === "production";

const securityHeaders: Array<[string, string]> = [
  // Content-Security-Policy. 'unsafe-inline' is required for Next.js's inline
  // bootstrap scripts/styles and MUI's injected styles until a nonce flow is
  // added; everything else is locked to self + the services we use.
  [
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.razorpay.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://*.supabase.co https://images.pexels.com",
      "font-src 'self' data:",
      "connect-src 'self' https://edualttech.onrender.com https://*.supabase.co https://*.razorpay.com",
      "frame-src 'self' https://*.razorpay.com https://*.supabase.co",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'self'",
    ].join("; "),
  ],
  ["X-Frame-Options", "DENY"],
  ["X-Content-Type-Options", "nosniff"],
  ["Referrer-Policy", "strict-origin-when-cross-origin"],
  ["X-XSS-Protection", "0"],
  ["Cross-Origin-Opener-Policy", "same-origin"],
  ["Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()"],
  // Only serve over TLS and force clients to remember that.
  ...(isProd
    ? ([["Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload"] as [string, string]])
    : []),
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "images.pexels.com" },
    ],
  },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders.map(([key, value]) => ({ key, value })) }];
  },
  async rewrites() {
    // Proxy API calls in development to avoid CORS setup friction.
    // Backend mounts everything under /api — the rewrite must keep that prefix.
    return process.env.NODE_ENV === "development"
      ? [{ source: "/backend/:path*", destination: `${backendOrigin}/api/:path*` }]
      : [];
  },
};

export default nextConfig;
