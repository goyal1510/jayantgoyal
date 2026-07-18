import type { NextConfig } from "next";
import { applicationOrigin } from "@repo/platform";

const STUDIO_URL = applicationOrigin(
  "studio",
  process.env.NEXT_PUBLIC_STUDIO_URL,
);

const portfolioSectionRedirects = [
  ["/home", "/#top"],
  ["/about", "/#about"],
  ["/skills", "/#skills"],
  ["/experience", "/#experience"],
  ["/projects", "/#work"],
  ["/certificates", "/#experience"],
  ["/contact", "/#contact"],
] as const;

const studioPagePrefixes = [
  "/activity-tracker",
  "/calculator",
  "/custom-calculator",
  "/files",
  "/games",
  "/github-stats",
  "/loader-preview",
  "/messenger",
  "/tools",
  "/weather",
  "/forgot-password",
  "/mfa-verify",
  "/reset-password",
  "/terms-conditions",
  "/welcome",
  "/auth",
  "/.well-known",
] as const;

const studioApiPrefixes = [
  "/api/account",
  "/api/activity-tracker",
  "/api/calculator",
  "/api/files",
  "/api/games",
  "/api/messenger",
  "/api/tools",
  "/api/typing-test",
] as const;

function buildStudioRedirects(prefixes: readonly string[]) {
  return prefixes.flatMap((prefix) => [
    {
      source: prefix,
      destination: `${STUDIO_URL}${prefix}`,
      permanent: false,
    },
    {
      source: `${prefix}/:path*`,
      destination: `${STUDIO_URL}${prefix}/:path*`,
      permanent: false,
    },
  ]);
}

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
  transpilePackages: ["@repo/platform", "@repo/seo", "@repo/ui"],
  images: {
    qualities: [75, 92],
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
      ...buildStudioRedirects(studioPagePrefixes),
      ...buildStudioRedirects(studioApiPrefixes),
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
        source: "/images/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/documents/(.*)",
        headers: [{ key: "X-Robots-Tag", value: "noindex, noarchive" }],
      },
      {
        source: "/assets/Jayant_Resume.pdf",
        headers: [{ key: "X-Robots-Tag", value: "noindex, noarchive" }],
      },
    ];
  },
};

export default nextConfig;
