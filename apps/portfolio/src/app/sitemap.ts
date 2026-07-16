import type { MetadataRoute } from "next";

import { LAST_SIGNIFICANT_UPDATE, SITE_URL } from "@/lib/seo/config";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE_URL,
      lastModified: LAST_SIGNIFICANT_UPDATE,
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}
