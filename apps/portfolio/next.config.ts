import type { NextConfig } from "next";

const DEFAULT_STUDIO_URL = "https://studio.jayantgoyal.com";

function getStudioUrl(): string {
  try {
    return new URL(process.env.NEXT_PUBLIC_STUDIO_URL ?? DEFAULT_STUDIO_URL)
      .origin;
  } catch {
    return DEFAULT_STUDIO_URL;
  }
}

const STUDIO_URL = getStudioUrl();

const portfolioSectionRedirects = [
  ["/home", "/#home"],
  ["/about", "/#about"],
  ["/skills", "/#skills"],
  ["/experience", "/#experience"],
  ["/projects", "/#projects"],
  ["/certificates", "/#certificates"],
  ["/contact", "/#contact"],
] as const;

const studioPageRoutes = [
  "/activity-tracker/:path*",
  "/calculator/:path*",
  "/custom-calculator/:path*",
  "/files/:path*",
  "/games/:path*",
  "/github-stats/:path*",
  "/loader-preview/:path*",
  "/messenger/:path*",
  "/tools/:path*",
  "/weather/:path*",
  "/forgot-password/:path*",
  "/mfa-verify/:path*",
  "/reset-password/:path*",
  "/terms-conditions/:path*",
  "/welcome/:path*",
  "/auth/:path*",
  "/.well-known/:path*",
] as const;

const studioApiRoutes = [
  "/api/account/:path*",
  "/api/activity-tracker/:path*",
  "/api/calculator/:path*",
  "/api/files/:path*",
  "/api/games/:path*",
  "/api/messenger/:path*",
  "/api/tools/:path*",
  "/api/typing-test/:path*",
] as const;

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com",
      "style-src 'self' 'unsafe-inline'",
      "font-src 'self' data:",
      "img-src 'self' data: blob: https://avatars.githubusercontent.com https://*.supabase.co",
      "connect-src 'self' https://*.supabase.co https://www.google-analytics.com https://api.resend.com https://github-contributions-api.jogruber.de https://api.github.com",
      "frame-src 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  transpilePackages: ["@repo/ui"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
    ],
  },
  async redirects() {
    return [
      ...portfolioSectionRedirects.map(([source, destination]) => ({
        source,
        destination,
        permanent: true,
      })),
      {
        source: "/blogs",
        destination: "/blog",
        permanent: true,
      },
      {
        source: "/login",
        destination: `${STUDIO_URL}/welcome`,
        permanent: false,
      },
      {
        source: "/signup",
        destination: `${STUDIO_URL}/welcome`,
        permanent: false,
      },
      ...studioPageRoutes.map((source) => ({
        source,
        destination: `${STUDIO_URL}${source}`,
        permanent: false,
      })),
      ...studioApiRoutes.map((source) => ({
        source,
        destination: `${STUDIO_URL}${source}`,
        permanent: false,
      })),
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
      {
        source: "/assets/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/assets/Jayant_Resume.pdf",
        headers: [{ key: "X-Robots-Tag", value: "noindex, noarchive" }],
      },
    ];
  },
};

export default nextConfig;
