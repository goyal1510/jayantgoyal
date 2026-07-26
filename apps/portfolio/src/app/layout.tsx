import "./globals.css";

import type { Metadata } from "next";
import { headers } from "next/headers";
import { DM_Sans, Instrument_Serif, Jost } from "next/font/google";
import Script from "next/script";
import { BRAND_ASSET_PATHS } from "@repo/brand";

import { PageScrollProgress } from "@/components/editorial/page-scroll-progress";
import { PortfolioAnalytics } from "@/components/editorial/portfolio-analytics";
import { getPortfolioShellData } from "@/lib/portfolio/editorial-server";
import {
  DEFAULT_OG_IMAGE,
  isCanonicalProductionHost,
  SITE_NAME,
  SITE_TITLE_TEMPLATE,
  SITE_URL,
} from "@/lib/seo/config";

const sans = DM_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

const serif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  variable: "--font-serif",
});

const wordmark = Jost({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  variable: "--font-wordmark",
});

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const shouldIndex = isCanonicalProductionHost(requestHeaders.get("host"));
  const { profile } = await getPortfolioShellData();

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: profile.seoTitle,
      template: SITE_TITLE_TEMPLATE,
    },
    description: profile.seoDescription,
    keywords: [
      profile.name,
      "full-stack developer",
      "portfolio",
      "Next.js",
      "React",
      "TypeScript",
      "Supabase",
    ],
    authors: [{ name: profile.name, url: SITE_URL }],
    creator: profile.name,
    alternates: { canonical: "/" },
    openGraph: {
      type: "profile",
      locale: "en_US",
      url: "/",
      siteName: SITE_NAME,
      title: profile.seoTitle,
      description: profile.seoDescription,
      images: [
        {
          url: DEFAULT_OG_IMAGE,
          width: 1200,
          height: 630,
          alt: profile.seoTitle,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: profile.seoTitle,
      description: profile.seoDescription,
      images: [DEFAULT_OG_IMAGE],
    },
    robots: {
      index: shouldIndex,
      follow: shouldIndex,
    },
    icons: {
      icon: [
        { url: BRAND_ASSET_PATHS.favicon },
        {
          url: BRAND_ASSET_PATHS.favicon32,
          sizes: "32x32",
          type: "image/png",
        },
        {
          url: BRAND_ASSET_PATHS.favicon16,
          sizes: "16x16",
          type: "image/png",
        },
      ],
      apple: BRAND_ASSET_PATHS.appleTouchIcon,
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { profile } = await getPortfolioShellData();
  const personJsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: profile.name,
    url: SITE_URL,
    jobTitle: profile.role,
    sameAs: profile.socials.map((social) => social.href),
  };

  return (
    <html lang="en">
      <head>
        <Script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-YVBSLSQXFJ"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','G-YVBSLSQXFJ');`}
        </Script>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
        />
      </head>
      <body
        className={`${sans.variable} ${serif.variable} ${wordmark.variable}`}
      >
        <PortfolioAnalytics />
        <PageScrollProgress />
        {children}
      </body>
    </html>
  );
}
