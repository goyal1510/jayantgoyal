import type { NextConfig } from "next";

const localCookieDomain = process.env.NEXT_PUBLIC_AUTH_COOKIE_DOMAIN?.trim()
  .toLowerCase()
  .replace(/^\.+/, "");
const allowedDevOrigins = localCookieDomain?.endsWith(".localhost")
  ? [`admin.${localCookieDomain}`]
  : [];

const nextConfig: NextConfig = {
  allowedDevOrigins,
  transpilePackages: ["@jayantgoyal/web-ui"],
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
        ],
      },
    ];
  },
};

export default nextConfig;
