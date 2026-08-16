import "./globals.css";
import type { Metadata } from "next";
import { IBM_Plex_Mono, Manrope } from "next/font/google";
import { buildAppRootMetadata } from "@jayantgoyal/web-seo";
import { ThemeProvider } from "@jayantgoyal/web-ui/theme-provider";
import { Toaster } from "@jayantgoyal/web-ui/sonner";

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

export const metadata: Metadata = buildAppRootMetadata({
  appId: "admin",
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
});

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
