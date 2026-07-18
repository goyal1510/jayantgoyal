import "./globals.css";

import type { Metadata } from "next";
import { headers } from "next/headers";
import { DM_Sans, Instrument_Serif } from "next/font/google";
import Script from "next/script";

import { fallbackPortfolioData } from "@/lib/portfolio/editorial-data";
import {
  DEFAULT_OG_IMAGE,
  isCanonicalProductionHost,
  PERSON_NAME,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TITLE,
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

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const shouldIndex = isCanonicalProductionHost(requestHeaders.get("host"));

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: SITE_TITLE,
      template: SITE_TITLE_TEMPLATE,
    },
    description: SITE_DESCRIPTION,
    keywords: [
      PERSON_NAME,
      "full-stack product engineer",
      "portfolio",
      "Next.js",
      "React",
      "TypeScript",
      "Supabase",
    ],
    authors: [{ name: PERSON_NAME, url: SITE_URL }],
    creator: PERSON_NAME,
    alternates: { canonical: "/" },
    openGraph: {
      type: "profile",
      locale: "en_US",
      url: "/",
      siteName: SITE_NAME,
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
    twitter: {
      card: "summary_large_image",
      title: SITE_TITLE,
      description: SITE_DESCRIPTION,
      images: [DEFAULT_OG_IMAGE],
    },
    robots: {
      index: shouldIndex,
      follow: shouldIndex,
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
      apple: "/assets/Jayant_favicon_io/apple-touch-icon.png",
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const profile = fallbackPortfolioData.profile;
  const personJsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: PERSON_NAME,
    url: SITE_URL,
    jobTitle: profile.role,
    sameAs: [profile.github, profile.linkedin, profile.instagram],
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
      <body className={`${sans.variable} ${serif.variable}`}>{children}</body>
    </html>
  );
}
