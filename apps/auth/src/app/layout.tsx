import "./globals.css";

import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Instrument_Serif, Manrope } from "next/font/google";

import {
  APP_BRANDS,
  APP_SOCIAL_PREVIEW_IMAGES,
  BRAND_ASSET_PATHS,
  PERSON_BRAND,
} from "@repo/brand";
import { Toaster } from "@repo/ui/sonner";
import { ThemeProvider } from "@repo/ui/theme-provider";

const AUTH_BRAND = APP_BRANDS.auth;
const AUTH_PREVIEW = APP_SOCIAL_PREVIEW_IMAGES.auth;

const manrope = Manrope({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-manrope",
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  variable: "--font-serif",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-ibm-plex-mono",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  metadataBase: new URL(AUTH_BRAND.canonicalUrl),
  title: {
    default: AUTH_BRAND.defaultTitle,
    template: AUTH_BRAND.titleTemplate,
  },
  description: AUTH_BRAND.description,
  applicationName: AUTH_BRAND.publicName,
  authors: [{ name: PERSON_BRAND.fullName, url: PERSON_BRAND.canonicalUrl }],
  creator: PERSON_BRAND.fullName,
  keywords: ["secure sign in", "account security", "Jayant"],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: PERSON_BRAND.fullName,
    title: AUTH_BRAND.defaultTitle,
    description: AUTH_BRAND.description,
    images: [AUTH_PREVIEW],
  },
  twitter: {
    card: "summary_large_image",
    title: AUTH_BRAND.defaultTitle,
    description: AUTH_BRAND.description,
    images: [AUTH_PREVIEW.url],
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
    apple: [
      {
        url: BRAND_ASSET_PATHS.appleTouchIcon,
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
  manifest: "/manifest.webmanifest",
  robots: { index: false, follow: false, nocache: true },
};

export const viewport: Viewport = {
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4efe6" },
    { media: "(prefers-color-scheme: dark)", color: "#111214" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${manrope.variable} ${instrumentSerif.variable} ${ibmPlexMono.variable}`}
      >
        <ThemeProvider attribute="class" disableTransitionOnChange>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
