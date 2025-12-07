import "@repo/ui/styles.css";
import "./globals.css";
import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { getPortfolioDataFromHeaders } from "@/lib/portfolio-server";

const geist = Geist({ subsets: ["latin"], preload: false });

export async function generateMetadata(): Promise<Metadata> {
  const { data } = await getPortfolioDataFromHeaders();

  return {
    title: `Portfolio | ${data.HERO.name}`,
    description:
      "Portfolio site scaffolded from the Turborepo Tailwind starter.",
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
        {
          url: "/assets/Jayant_favicon_io/android-chrome-192x192.png",
          sizes: "192x192",
          type: "image/png",
        },
        {
          url: "/assets/Jayant_favicon_io/android-chrome-512x512.png",
          sizes: "512x512",
          type: "image/png",
        },
      ],
      apple: [
        {
          url: "/assets/Jayant_favicon_io/apple-touch-icon.png",
          sizes: "180x180",
          type: "image/png",
        },
      ],
    },
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={geist.className}>
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
