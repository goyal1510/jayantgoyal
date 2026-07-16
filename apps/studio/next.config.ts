import type { NextConfig } from "next";

const DEFAULT_PORTFOLIO_URL = "https://jayantgoyal.com";

function getPortfolioUrl(): string {
  try {
    return new URL(
      process.env.NEXT_PUBLIC_PORTFOLIO_URL ?? DEFAULT_PORTFOLIO_URL,
    ).origin;
  } catch {
    return DEFAULT_PORTFOLIO_URL;
  }
}

const PORTFOLIO_URL = getPortfolioUrl();

const portfolioSectionRedirects = [
  ["/home", "/#home"],
  ["/about", "/#about"],
  ["/skills", "/#skills"],
  ["/experience", "/#experience"],
  ["/projects", "/#projects"],
  ["/certificates", "/#certificates"],
  ["/contact", "/#contact"],
] as const;

const noindexHeaders = [
  { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
];

const nextConfig: NextConfig = {
  transpilePackages: ["@repo/ui"],
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "openweathermap.org",
        pathname: "/img/**",
      },
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
        destination: `${PORTFOLIO_URL}${destination}`,
        permanent: true,
      })),
      {
        source: "/blogs",
        destination: `${PORTFOLIO_URL}/blog`,
        permanent: true,
      },
      {
        source: "/blog/:path*",
        destination: `${PORTFOLIO_URL}/blog/:path*`,
        permanent: true,
      },
      {
        source: "/resume",
        destination: `${PORTFOLIO_URL}/resume`,
        permanent: true,
      },
      {
        source: "/api/contact",
        destination: `${PORTFOLIO_URL}/api/contact`,
        permanent: false,
      },
      {
        source: "/api/resume",
        destination: `${PORTFOLIO_URL}/api/resume`,
        permanent: false,
      },
      {
        source: "/tools/workspace/:path*",
        destination: "/tools",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/activity-tracker/:path*",
        headers: noindexHeaders,
      },
      {
        source: "/calculator/:path*",
        headers: noindexHeaders,
      },
      {
        source: "/files/:path*",
        headers: noindexHeaders,
      },
      {
        source: "/games/:path*",
        headers: noindexHeaders,
      },
      {
        source: "/messenger/:path*",
        headers: noindexHeaders,
      },
      {
        source: "/welcome",
        headers: noindexHeaders,
      },
      {
        source: "/forgot-password",
        headers: noindexHeaders,
      },
      {
        source: "/reset-password",
        headers: noindexHeaders,
      },
      {
        source: "/mfa-verify",
        headers: noindexHeaders,
      },
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
          { key: "X-DNS-Prefetch-Control", value: "on" },
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https://openweathermap.org https://avatars.githubusercontent.com https://*.supabase.co https://api.qrserver.com",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://www.google-analytics.com https://api.resend.com https://github-contributions-api.jogruber.de https://api.openweathermap.org https://api.github.com",
              "frame-src 'none'",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
            ].join("; "),
          },
          { key: "Link", value: '</.well-known/api-catalog>; rel="api-catalog", </llms.txt>; rel="ai-content"' },
        ],
      },
      {
        source: "/assets/Jayant_Resume.pdf",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, noarchive" },
        ],
      },
      // Cache static assets aggressively
      {
        source: "/assets/(.*)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },
};

export default nextConfig;
