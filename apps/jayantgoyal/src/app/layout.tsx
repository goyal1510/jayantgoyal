import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { ToastSoundProvider } from "@/components/providers/toast-sound-provider";
import { Toaster } from "@repo/ui/sonner";
import Script from "next/script";
import { PersonJsonLd, WebSiteJsonLd, ProfilePageJsonLd, SoftwareAppJsonLd } from "@/components/seo/json-ld";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.jayantgoyal.com"),
  title: {
    default: "Jayant — Full-Stack Developer",
    template: "%s | Jayant",
  },
  description:
    "Full-stack developer portfolio by Jayant. Explore projects, 99+ developer tools, games, and utilities built with Next.js, React, TypeScript, and Supabase.",
  keywords: [
    "Jayant", "full-stack developer", "portfolio", "Next.js",
    "React", "TypeScript", "developer tools", "web developer",
  ],
  authors: [{ name: "Jayant", url: "https://www.jayantgoyal.com" }],
  creator: "Jayant",
  alternates: {
    canonical: "https://www.jayantgoyal.com",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://www.jayantgoyal.com",
    siteName: "Jayant",
    title: "Jayant — Full-Stack Developer",
    description:
      "Full-stack developer portfolio by Jayant. Explore projects, 99+ developer tools, interactive games, and utilities built with Next.js, React, TypeScript, and Supabase.",
    images: [
      {
        url: "https://www.jayantgoyal.com/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Jayant — Full-Stack Developer",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Jayant — Full-Stack Developer",
    description:
      "Full-stack developer portfolio by Jayant. Explore projects, 99+ developer tools, interactive games, and utilities built with Next.js, React, TypeScript, and Supabase.",
    images: [
      {
        url: "https://www.jayantgoyal.com/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Jayant — Full-Stack Developer",
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script async src="https://www.googletagmanager.com/gtag/js?id=G-YVBSLSQXFJ" strategy="afterInteractive" />
        <Script id="google-analytics" strategy="afterInteractive">
          {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','G-YVBSLSQXFJ');`}
        </Script>
        <link rel="preconnect" href="https://orwfvyditlguqvxvztkw.supabase.co" />
        <link rel="dns-prefetch" href="https://orwfvyditlguqvxvztkw.supabase.co" />
        <PersonJsonLd />
        <WebSiteJsonLd />
        <ProfilePageJsonLd />
        <SoftwareAppJsonLd />
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
