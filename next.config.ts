import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typedRoutes: true,
  env: {
    // Exponemos al cliente el dominio permitido para el placeholder del form.
    // No es secreto y no cambia entre entornos.
    NEXT_PUBLIC_PORTAL_EMAIL_ALLOWLIST_DOMAIN:
      process.env.PORTAL_EMAIL_ALLOWLIST_DOMAIN ?? "qamarero.com",
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
    ],
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
