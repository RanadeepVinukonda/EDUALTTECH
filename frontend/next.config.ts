import type { NextConfig } from "next";

const backendOrigin = process.env.BACKEND_ORIGIN ?? "http://localhost:5000";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "images.pexels.com" },
    ],
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
