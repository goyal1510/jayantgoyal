import "./globals.css";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { ToastSoundProvider } from "@/components/providers/toast-sound-provider";
import { Toaster } from "@repo/ui/sonner";
import Script from "next/script";
import { PersonJsonLd, WebSiteJsonLd, ProfilePageJsonLd, SoftwareAppJsonLd } from "@/components/seo/json-ld";

const SITE_URL = "https://www.jayantgoyal.com";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const baseMetadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Jayant | Full-Stack Developer",
    template: "%s | JG",
  },
  description:
    "Full-stack developer portfolio by Jayant. Explore projects, 99+ developer tools, games, and utilities built with Next.js, React, TypeScript, and Supabase.",
  keywords: [
    "Jayant", "full-stack developer", "portfolio", "Next.js",
    "React", "TypeScript", "developer tools", "web developer",
  ],
  authors: [{ name: "Jayant", url: SITE_URL }],
  creator: "Jayant",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: "JG",
    title: "Jayant | Full-Stack Developer",
    description:
      "Full-stack developer portfolio by Jayant. Explore projects, 99+ developer tools, interactive games, and utilities built with Next.js, React, TypeScript, and Supabase.",
    images: [
      {
        url: "https://www.jayantgoyal.com/opengraph-image?v=5",
        width: 1200,
        height: 630,
        alt: "Jayant | Full-Stack Developer",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Jayant | Full-Stack Developer",
    description:
      "Full-stack developer portfolio by Jayant. Explore projects, 99+ developer tools, interactive games, and utilities built with Next.js, React, TypeScript, and Supabase.",
    images: [
      {
        url: "https://www.jayantgoyal.com/opengraph-image?v=5",
        width: 1200,
        height: 630,
        alt: "Jayant | Full-Stack Developer",
      },
    ],
  },
  verification: {
    google: "NPYQ4NJ-F69rJjK2ZcTM_h5Tc_5T1pRqGH0MNgs0oSo",
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [
      { url: "/assets/Jayant_favicon_io/favicon.ico" },
      { url: "/assets/Jayant_favicon_io/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/assets/Jayant_favicon_io/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/assets/Jayant_favicon_io/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/assets/Jayant_favicon_io/android-chrome-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/assets/Jayant_favicon_io/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

const INDEXABLE_EXACT_PATHS = new Set(["/", "/terms-conditions"]);
const INDEXABLE_PREFIXES = [
  "/tools",
  "/blogs",
  "/blog",
  "/weather",
  "/custom-calculator",
  "/github-stats",
];

function normalizePathname(pathname: string | null): string {
  if (!pathname || !pathname.startsWith("/")) return "/";
  if (pathname.length > 1 && pathname.endsWith("/")) return pathname.slice(0, -1);
  return pathname;
}

function isIndexablePath(pathname: string): boolean {
  if (INDEXABLE_EXACT_PATHS.has(pathname)) return true;
  return INDEXABLE_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export async function generateMetadata(): Promise<Metadata> {
  const headerStore = await headers();
  const pathname = normalizePathname(headerStore.get("x-pathname"));
  const canonicalUrl = new URL(pathname, SITE_URL).toString();
  const shouldIndex = isIndexablePath(pathname);

  return {
    ...baseMetadata,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      type: "website",
      locale: "en_US",
      url: canonicalUrl,
      siteName: "JG",
      title: "Jayant | Full-Stack Developer",
      description:
        "Full-stack developer portfolio by Jayant. Explore projects, 99+ developer tools, interactive games, and utilities built with Next.js, React, TypeScript, and Supabase.",
      images: [
        {
          url: "https://www.jayantgoyal.com/opengraph-image?v=5",
          width: 1200,
          height: 630,
          alt: "Jayant | Full-Stack Developer",
          type: "image/png",
        },
      ],
    },
    robots: {
      index: shouldIndex,
      follow: shouldIndex,
    },
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script async src="https://www.googletagmanager.com/gtag/js?id=G-YVBSLSQXFJ" strategy="afterInteractive" />
        <Script id="google-analytics" strategy="afterInteractive">
          {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','G-YVBSLSQXFJ');`}
        </Script>
        <link rel="preconnect" href="https://orwfvyditlguqvxvztkw.supabase.co" />
        <link rel="dns-prefetch" href="https://orwfvyditlguqvxvztkw.supabase.co" />
        <PersonJsonLd />
        <WebSiteJsonLd />
        <ProfilePageJsonLd />
        <SoftwareAppJsonLd />
      </head>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
          <ToastSoundProvider />
        </ThemeProvider>
      </body>
    </html>
  );
}
