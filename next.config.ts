import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const lanDevOrigins = process.env.DEV_ALLOWED_ORIGINS?.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const supabaseHost = process.env.SUPABASE_URL?.replace(/^https?:\/\//, "").replace(/\/$/, "");

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["postgres"],
  transpilePackages: ["@history-codex/card-renderer"],
  turbopack: {
    root: path.join(projectRoot, "../.."),
  },
  allowedDevOrigins: lanDevOrigins?.length ? lanDevOrigins : ["192.168.1.43"],
  experimental: {
    proxyClientMaxBodySize: "100mb",
  },
  async rewrites() {
    return [
      {
        source: "/uploads/:path*",
        destination: "/api/serve-upload/:path*",
      },
    ];
  },
  headers: async () => [
    {
      source: "/uploads/:path*",
      headers: [
        {
          key: "Cache-Control",
          value: "public, max-age=31536000, immutable",
        },
      ],
    },
  ],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "covers.openlibrary.org",
      },
      {
        protocol: "https",
        hostname: "archive.org",
      },
      {
        protocol: "https",
        hostname: "books.google.com",
      },
      {
        protocol: "http",
        hostname: "books.google.com",
      },
      {
        protocol: "https",
        hostname: "**.googleusercontent.com",
      },
      ...(supabaseHost
        ? [{ protocol: "https" as const, hostname: supabaseHost }]
        : [{ protocol: "https" as const, hostname: "**.supabase.co" }]),
    ],
  },
};

export default nextConfig;
