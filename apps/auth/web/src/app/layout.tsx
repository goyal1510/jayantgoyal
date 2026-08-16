import "./globals.css";

import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Instrument_Serif, Manrope } from "next/font/google";

import { buildAppRootMetadata } from "@jayantgoyal/web-seo";
import { PERSON_BRAND } from "@jayantgoyal/web-brand";
import { Toaster } from "@jayantgoyal/web-ui/sonner";
import { ThemeProvider } from "@jayantgoyal/web-ui/theme-provider";

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
  ...buildAppRootMetadata({
    appId: "auth",
    keywords: ["secure sign in", "account security", PERSON_BRAND.displayName],
    robots: { index: false, follow: false, nocache: true },
  }),
  manifest: "/manifest.webmanifest",
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
