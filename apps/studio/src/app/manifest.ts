import type { MetadataRoute } from "next";

import { APP_BRANDS, BRAND_ASSET_PATHS } from "@repo/brand";

import { SITE_DESCRIPTION } from "@/lib/seo/config";

const STUDIO_BRAND = APP_BRANDS.studio;

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: STUDIO_BRAND.name,
    short_name: STUDIO_BRAND.name,
    description: SITE_DESCRIPTION,
    start_url: "/",
    display: "standalone",
    background_color: "#0a0a0a",
    theme_color: "#0a0a0a",
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
