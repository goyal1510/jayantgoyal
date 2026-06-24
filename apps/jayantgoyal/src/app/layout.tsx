import "./globals.css";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { ToastSoundProvider } from "@/components/providers/toast-sound-provider";
import { Toaster } from "@repo/ui/sonner";
import Script from "next/script";
import { PersonJsonLd, WebSiteJsonLd, ProfilePageJsonLd, SoftwareAppJsonLd } from "@/components/seo/json-ld";
import {
  DEFAULT_OG_IMAGE,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TITLE,
  SITE_URL,
  isIndexablePath,
  normalizePathname,
} from "@/lib/seo/config";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const baseMetadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: "%s | JG",
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "Jayant", "full-stack developer", "portfolio", "Next.js",
    "React", "TypeScript", "developer tools", "web developer",
  ],
  authors: [{ name: "Jayant Goyal", url: SITE_URL }],
  creator: "Jayant Goyal",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: DEFAULT_OG_IMAGE,
        width: 1200,
        height: 630,
        alt: SITE_TITLE,
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: DEFAULT_OG_IMAGE,
        width: 1200,
        height: 630,
        alt: SITE_TITLE,
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
      siteName: SITE_NAME,
      title: SITE_TITLE,
      description: SITE_DESCRIPTION,
      images: [
        {
          url: DEFAULT_OG_IMAGE,
          width: 1200,
          height: 630,
          alt: SITE_TITLE,
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

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headerStore = await headers();
  const pathname = normalizePathname(headerStore.get("x-pathname"));
  const isHomePage = pathname === "/";
  const isToolsPage = pathname === "/tools";

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script async src="https://www.googletagmanager.com/gtag/js?id=G-YVBSLSQXFJ" strategy="afterInteractive" />
        <Script id="google-analytics" strategy="afterInteractive">
          {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','G-YVBSLSQXFJ');`}
        </Script>
        <link rel="preconnect" href="https://orwfvyditlguqvxvztkw.supabase.co" />
        <link rel="dns-prefetch" href="https://orwfvyditlguqvxvztkw.supabase.co" />
        <WebSiteJsonLd />
        {isHomePage && (
          <>
            <PersonJsonLd />
            <ProfilePageJsonLd />
          </>
        )}
        {isToolsPage && <SoftwareAppJsonLd />}
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
