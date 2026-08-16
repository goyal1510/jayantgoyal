import "./globals.css";

import type { Metadata } from "next";
import { headers } from "next/headers";
import { DM_Sans, Instrument_Serif, Jost } from "next/font/google";
import Script from "next/script";
import { buildAppRootMetadata } from "@jayantgoyal/web-seo";

import { PageScrollProgress } from "@/components/editorial/page-scroll-progress";
import { PortfolioAnalytics } from "@/components/editorial/portfolio-analytics";
import { getPortfolioShellData } from "@/lib/portfolio/editorial-server";
import {
  isCanonicalProductionHost,
  PERSON_NAME,
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

  return buildAppRootMetadata({
    appId: "portfolio",
    siteUrl: SITE_URL,
    canonicalUrl: SITE_URL,
    title: profile.seoTitle,
    description: profile.seoDescription,
    type: "profile",
    keywords: [
      PERSON_NAME,
      "full-stack developer",
      "portfolio",
      "Next.js",
      "React",
      "TypeScript",
      "Supabase",
    ],
    robots: {
      index: shouldIndex,
      follow: shouldIndex,
    },
  });
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { profile } = await getPortfolioShellData();
  const personJsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: PERSON_NAME,
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
