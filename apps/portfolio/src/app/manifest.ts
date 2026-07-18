import type { MetadataRoute } from "next";

import { APP_BRANDS } from "@repo/brand";

const PORTFOLIO_BRAND = APP_BRANDS.portfolio;

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: PORTFOLIO_BRAND.name,
    short_name: PORTFOLIO_BRAND.name,
    description: PORTFOLIO_BRAND.description,
    start_url: "/",
    display: "standalone",
    background_color: "#f3f0e8",
    theme_color: "#f3f0e8",
    icons: [
      {
        src: "/assets/Jayant_favicon_io/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/assets/Jayant_favicon_io/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
