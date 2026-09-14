import "./globals.css";

import type { Metadata } from "next";
import { DM_Sans, Instrument_Serif, Jost } from "next/font/google";
import Script from "next/script";
import { APP_BRANDS } from "@jayantgoyal/web-brand";
import { buildAppRootMetadata } from "@jayantgoyal/web-seo";

import { PageScrollProgress } from "@/components/editorial/page-scroll-progress";
import { PortfolioAnalytics } from "@/components/editorial/portfolio-analytics";
import { PERSON_NAME, SITE_URL } from "@/lib/seo/config";

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

export function generateMetadata(): Metadata {
  const shouldIndex = process.env.VERCEL_ENV === "production";

  return buildAppRootMetadata({
    appId: "portfolio",
    siteUrl: SITE_URL,
    canonicalUrl: SITE_URL,
    title: APP_BRANDS.portfolio.defaultTitle,
    description: APP_BRANDS.portfolio.description,
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

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
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
