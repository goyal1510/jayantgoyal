import "./globals.css";
import type { Metadata } from "next";
import { IBM_Plex_Mono, Manrope } from "next/font/google";
import {
  APP_BRANDS,
  APP_SOCIAL_PREVIEW_IMAGES,
  BRAND_ASSET_PATHS,
  PERSON_BRAND,
} from "@jayant/web-brand";
import { ThemeProvider } from "@jayant/web-ui/theme-provider";
import { Toaster } from "@jayant/web-ui/sonner";

const ADMIN_BRAND = APP_BRANDS.admin;
const ADMIN_PREVIEW = APP_SOCIAL_PREVIEW_IMAGES.admin;

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

export const metadata: Metadata = {
  metadataBase: new URL(ADMIN_BRAND.canonicalUrl),
  title: {
    default: ADMIN_BRAND.defaultTitle,
    template: ADMIN_BRAND.titleTemplate,
  },
  description: ADMIN_BRAND.description,
  applicationName: ADMIN_BRAND.publicName,
  authors: [{ name: PERSON_BRAND.fullName, url: PERSON_BRAND.canonicalUrl }],
  creator: PERSON_BRAND.fullName,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: PERSON_BRAND.fullName,
    title: ADMIN_BRAND.defaultTitle,
    description: ADMIN_BRAND.description,
    images: [ADMIN_PREVIEW],
  },
  twitter: {
    card: "summary_large_image",
    title: ADMIN_BRAND.defaultTitle,
    description: ADMIN_BRAND.description,
    images: [ADMIN_PREVIEW.url],
  },
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
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
      {
        url: BRAND_ASSET_PATHS.android192,
        sizes: "192x192",
        type: "image/png",
      },
      {
        url: BRAND_ASSET_PATHS.android512,
        sizes: "512x512",
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
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${manrope.variable} ${ibmPlexMono.variable} application-surface`}
      >
        <ThemeProvider attribute="class" disableTransitionOnChange>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
