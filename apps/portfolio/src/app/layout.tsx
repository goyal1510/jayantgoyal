import "./globals.css";

import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import { Inter } from "next/font/google";
import Script from "next/script";

import { Toaster } from "@repo/ui/sonner";
import { LazyMotionProvider } from "@repo/ui/lazy-motion-provider";
import { SidebarInset, SidebarProvider } from "@repo/ui/sidebar";
import { ThemeProvider } from "@repo/ui/theme-provider";

import { PortfolioSidebar } from "@/components/portfolio-sidebar";
import { PortfolioTopbar } from "@/components/portfolio-topbar";
import { getPortfolioDataFromHeaders } from "@/lib/portfolio/server";
import { PortfolioDataProvider } from "@/lib/portfolio/use-portfolio-data";
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

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
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
      "full-stack developer",
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

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { data, profile, host, source } = await getPortfolioDataFromHeaders();
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value !== "false";
  const defaultWidth =
    Number(cookieStore.get("sidebar_width")?.value) || undefined;
  const personJsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: PERSON_NAME,
    url: SITE_URL,
    jobTitle: data.HERO.role,
    sameAs: data.CONTACT.socials.map((social) => social.href),
  };

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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
        />
      </head>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <PortfolioDataProvider
            data={data}
            profile={profile}
            host={host}
            source={source}
          >
            <SidebarProvider
              defaultOpen={defaultOpen}
              defaultWidth={defaultWidth}
            >
              <PortfolioSidebar />
              <SidebarInset>
                <PortfolioTopbar />
                <LazyMotionProvider>
                  <div className="mx-auto w-full max-w-7xl py-4">
                    {children}
                  </div>
                </LazyMotionProvider>
              </SidebarInset>
            </SidebarProvider>
          </PortfolioDataProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
