import "./globals.css";

import type { Metadata } from "next";

import { APP_BRANDS } from "@repo/brand";
import { Toaster } from "@repo/ui/sonner";
import { ThemeProvider } from "@repo/ui/theme-provider";

const AUTH_BRAND = APP_BRANDS.auth;

export const metadata: Metadata = {
  metadataBase: new URL(AUTH_BRAND.canonicalUrl),
  title: {
    default: AUTH_BRAND.defaultTitle,
    template: AUTH_BRAND.titleTemplate,
  },
  description: AUTH_BRAND.description,
  robots: { index: false, follow: false, nocache: true },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
