import type { MetadataRoute } from "next";

import { APP_BRANDS, BRAND_ASSET_PATHS } from "@repo/brand";

export default function manifest(): MetadataRoute.Manifest {
  const brand = APP_BRANDS.auth;

  return {
    name: brand.publicName,
    short_name: "Jayant Auth",
    description: brand.description,
    start_url: "/welcome",
    display: "standalone",
    background_color: "#111214",
    theme_color: "#111214",
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
