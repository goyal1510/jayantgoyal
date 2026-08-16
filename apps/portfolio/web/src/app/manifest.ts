import type { MetadataRoute } from "next";

import { APP_BRANDS, BRAND_ASSET_PATHS } from "@jayant/web-brand";

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
        src: BRAND_ASSET_PATHS.android192,
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: BRAND_ASSET_PATHS.android512,
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
