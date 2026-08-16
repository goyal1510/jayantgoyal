import "./globals.css";

import type { Metadata } from "next";
import { headers } from "next/headers";
import { IBM_Plex_Mono, Manrope } from "next/font/google";
import Script from "next/script";

import { Toaster } from "@jayantgoyal/web-ui/sonner";
import { ThemeProvider } from "@jayantgoyal/web-ui/theme-provider";
import { buildAppRootMetadata } from "@jayantgoyal/web-seo";

import { SoftwareAppJsonLd, WebSiteJsonLd } from "@/components/seo/json-ld";
import { ToastSoundProvider } from "@/components/providers/toast-sound-provider";
import {
  isIndexablePath,
  isProductionStudioHost,
  normalizePathname,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TITLE,
  SITE_URL,
} from "@/lib/seo/config";

const manrope = Manrope({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-manrope",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-ibm-plex-mono",
  weight: ["400", "500"],
});

export async function generateMetadata(): Promise<Metadata> {
  const headerStore = await headers();
  const pathname = normalizePathname(headerStore.get("x-pathname"));
  const canonicalUrl = new URL(pathname, SITE_URL).toString();
  const shouldIndex =
    isProductionStudioHost(headerStore.get("host")) &&
    isIndexablePath(pathname);

  return buildAppRootMetadata({
    appId: "studio",
    siteUrl: SITE_URL,
    canonicalUrl,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    robots: { index: shouldIndex, follow: shouldIndex },
  });
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
      <body
        className={`${manrope.variable} ${ibmPlexMono.variable} application-surface`}
      >
        <ThemeProvider attribute="class" disableTransitionOnChange>
          {children}
          <Toaster />
          <ToastSoundProvider />
        </ThemeProvider>
      </body>
    </html>
  );
}
