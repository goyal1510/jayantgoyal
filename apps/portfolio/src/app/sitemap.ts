import type { MetadataRoute } from "next";

import { getPublishedBlogPosts } from "@/lib/blog/queries";
import { LAST_SIGNIFICANT_UPDATE, SITE_URL } from "@/lib/seo/config";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getPublishedBlogPosts();

  return [
    {
      url: SITE_URL,
      lastModified: LAST_SIGNIFICANT_UPDATE,
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/blog`,
      lastModified: LAST_SIGNIFICANT_UPDATE,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/work`,
      lastModified: LAST_SIGNIFICANT_UPDATE,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/resume`,
      lastModified: LAST_SIGNIFICANT_UPDATE,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    ...posts.map((post) => ({
      url: `${SITE_URL}/blog/${post.slug}`,
      lastModified: post.updated_at,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
