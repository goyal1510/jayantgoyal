import "./globals.css";

import type { Metadata } from "next";
import { headers } from "next/headers";
import { Inter } from "next/font/google";
import Script from "next/script";

import { Toaster } from "@repo/ui/sonner";
import { ThemeProvider } from "@repo/ui/theme-provider";

import { SoftwareAppJsonLd, WebSiteJsonLd } from "@/components/seo/json-ld";
import { ToastSoundProvider } from "@/components/providers/toast-sound-provider";
import { PORTFOLIO_URL } from "@/lib/platform/urls";
import {
  DEFAULT_OG_IMAGE,
  isIndexablePath,
  isProductionStudioHost,
  normalizePathname,
  PERSON_NAME,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TITLE,
  SITE_TITLE_TEMPLATE,
  SITE_URL,
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
    template: SITE_TITLE_TEMPLATE,
  },
  description: SITE_DESCRIPTION,
  authors: [{ name: PERSON_NAME, url: PORTFOLIO_URL }],
  creator: PERSON_NAME,
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
    images: [DEFAULT_OG_IMAGE],
  },
  icons: {
    icon: [
      { url: "/assets/Jayant_favicon_io/favicon.ico" },
      {
        url: "/assets/Jayant_favicon_io/favicon-32x32.png",
        sizes: "32x32",
        type: "image/png",
      },
      {
        url: "/assets/Jayant_favicon_io/favicon-16x16.png",
        sizes: "16x16",
        type: "image/png",
      },
    ],
    apple: [
      {
        url: "/assets/Jayant_favicon_io/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const headerStore = await headers();
  const pathname = normalizePathname(headerStore.get("x-pathname"));
  const canonicalUrl = new URL(pathname, SITE_URL).toString();
  const shouldIndex =
    isProductionStudioHost(headerStore.get("host")) &&
    isIndexablePath(pathname);

  return {
    ...baseMetadata,
    alternates: { canonical: canonicalUrl },
    openGraph: { ...baseMetadata.openGraph, url: canonicalUrl },
    robots: { index: shouldIndex, follow: shouldIndex },
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = normalizePathname((await headers()).get("x-pathname"));

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-YVBSLSQXFJ"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','G-YVBSLSQXFJ');`}
        </Script>
        <link
          rel="preconnect"
          href="https://orwfvyditlguqvxvztkw.supabase.co"
        />
        <link
          rel="dns-prefetch"
          href="https://orwfvyditlguqvxvztkw.supabase.co"
        />
        <WebSiteJsonLd
          siteUrl={SITE_URL}
          siteName={SITE_NAME}
          description={SITE_DESCRIPTION}
        />
        {pathname === "/tools" && <SoftwareAppJsonLd siteUrl={SITE_URL} />}
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
