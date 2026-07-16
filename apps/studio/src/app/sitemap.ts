import type { MetadataRoute } from "next";

import { allTools } from "@/lib/tools/tools";
import { LAST_SIGNIFICANT_UPDATE, SITE_URL } from "@/lib/seo/config";

export default function sitemap(): MetadataRoute.Sitemap {
  const publicPages = [
    { path: "/", changeFrequency: "weekly" as const, priority: 1.0 },
    { path: "/tools", changeFrequency: "monthly" as const, priority: 0.8 },
    { path: "/weather", changeFrequency: "daily" as const, priority: 0.6 },
    {
      path: "/custom-calculator",
      changeFrequency: "monthly" as const,
      priority: 0.5,
    },
    {
      path: "/github-stats",
      changeFrequency: "daily" as const,
      priority: 0.5,
    },
    {
      path: "/terms-conditions",
      changeFrequency: "yearly" as const,
      priority: 0.3,
    },
  ].map((page) => ({
    url: new URL(page.path, SITE_URL).toString(),
    lastModified: LAST_SIGNIFICANT_UPDATE,
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }));

  const toolPages = allTools.map((tool) => ({
    url: new URL(tool.path, SITE_URL).toString(),
    lastModified: LAST_SIGNIFICANT_UPDATE,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [...publicPages, ...toolPages];
}
