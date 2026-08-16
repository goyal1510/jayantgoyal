import type { NextConfig } from "next";
import { applicationOrigin } from "@jayantgoyal/web-urls";
import { createRequire } from "node:module";

const STUDIO_URL = applicationOrigin(
  "studio",
  process.env.NEXT_PUBLIC_STUDIO_URL,
);

const portfolioSectionRedirects = [
  ["/home", "/#top"],
  ["/skills", "/about"],
  ["/experience", "/about#experience"],
  ["/certificates", "/about#experience"],
] as const;

const studioPublicPagePrefixes = [
  "/activity-tracker",
  "/calculator",
  "/custom-calculator",
  "/files",
  "/games",
  "/github-stats",
  "/loader-preview",
  "/scratchpad",
  "/tools",
  "/weather",
  "/terms-conditions",
] as const;

const studioSessionPagePrefixes = [
  "/forgot-password",
  "/mfa-verify",
  "/reset-password",
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
  "/api/scratchpad",
  "/api/tools",
  "/api/typing-test",
] as const;

function buildStudioRedirects(prefixes: readonly string[], permanent: boolean) {
  return prefixes.flatMap((prefix) => [
    {
      source: prefix,
      destination: `${STUDIO_URL}${prefix}`,
      permanent,
    },
    {
      source: `${prefix}/:path*`,
      destination: `${STUDIO_URL}${prefix}/:path*`,
      permanent,
    },
  ]);
}

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  // The Resume route renders the first-party PDF inside the Portfolio page.
  // SAMEORIGIN still blocks external framing while allowing that viewer to work.
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
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
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://static.cloudflareinsights.com",
      "style-src 'self' 'unsafe-inline'",
      "font-src 'self' data:",
      "img-src 'self' data: blob: https://avatars.githubusercontent.com https://*.supabase.co",
      "connect-src 'self' https://*.supabase.co https://*.google-analytics.com https://*.analytics.google.com https://api.resend.com https://cloudflareinsights.com",
      "frame-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'self'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  transpilePackages: ["@jayantgoyal/web-urls", "@jayantgoyal/web-seo"],
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
        destination: "/writing",
        permanent: true,
      },
      {
        source: "/blog",
        destination: "/writing",
        permanent: true,
      },
      ...[
        "how-i-built-a-live-resume-download-with-google-docs-next-js-and-vercel",
        "fixing-google-indexing-seo",
        "introducing-jayantgoyal-com",
      ].flatMap((slug) => [
        {
          source: `/blog/${slug}`,
          destination: "/writing",
          permanent: true,
        },
        {
          source: `/writing/${slug}`,
          destination: "/writing",
          permanent: true,
        },
      ]),
      {
        source: "/blog/:path*",
        destination: "/writing/:path*",
        permanent: true,
      },
      {
        source: "/portfolio",
        destination: "/",
        permanent: true,
      },
      {
        source: "/assets/Jayant_Resume.pdf",
        destination: "/resume",
        permanent: true,
      },
      {
        source: "/case-studies",
        destination: "/work",
        permanent: true,
      },
      {
        source: "/work/identity-sso",
        destination: "/work/auth",
        permanent: true,
      },
      ...[
        "tech-tools",
        "file-manager",
        "game-hub",
        "activity-tracker",
        "sync-scratchpad",
        "custom-calculator",
      ].flatMap((slug) => [
        {
          source: `/case-studies/${slug}`,
          destination: "/work/studio",
          permanent: true,
        },
        {
          source: `/projects/${slug}`,
          destination: "/work/studio",
          permanent: true,
        },
      ]),
      {
        source: "/case-studies/ecommerce",
        destination: "/work/portfolio",
        permanent: true,
      },
      {
        source: "/projects/ecommerce",
        destination: "/work/portfolio",
        permanent: true,
      },
      {
        source: "/case-studies/:path*",
        destination: "/work/:path*",
        permanent: true,
      },
      {
        source: "/projects",
        destination: "/work",
        permanent: true,
      },
      {
        source: "/projects/:path*",
        destination: "/work/:path*",
        permanent: true,
      },
      {
        source: "/studio",
        destination: "/work/studio",
        permanent: true,
      },
      {
        source: "/engineering",
        destination: "/work",
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
      ...buildStudioRedirects(studioPublicPagePrefixes, true),
      ...buildStudioRedirects(studioSessionPagePrefixes, false),
      ...buildStudioRedirects(studioApiPrefixes, false),
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
    ];
  },
};

function configureBundleAnalyzer(config: NextConfig): NextConfig {
  if (process.env.ANALYZE !== "true") return config;

  const require = createRequire(import.meta.url);
  const withBundleAnalyzer =
    require("@next/bundle-analyzer") as typeof import("@next/bundle-analyzer");

  return withBundleAnalyzer({
    enabled: true,
    openAnalyzer: process.env.ANALYZE_OPEN !== "false",
  })(config);
}

export default configureBundleAnalyzer(nextConfig);
