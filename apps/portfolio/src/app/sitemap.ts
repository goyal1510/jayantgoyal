import type { MetadataRoute } from "next";

import { getPublishedWritingPosts } from "@/lib/writing/queries";
import { getEditorialPortfolioData } from "@/lib/portfolio/editorial-server";
import { LAST_SIGNIFICANT_UPDATE, SITE_URL } from "@/lib/seo/config";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [posts, portfolio] = await Promise.all([
    getPublishedWritingPosts(),
    getEditorialPortfolioData(),
  ]);
  const publishedWork = portfolio.work.filter((project) => project.caseStudy);

  return [
    {
      url: SITE_URL,
      lastModified: LAST_SIGNIFICANT_UPDATE,
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/writing`,
      lastModified: LAST_SIGNIFICANT_UPDATE,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/about`,
      lastModified: LAST_SIGNIFICANT_UPDATE,
      changeFrequency: "monthly",
      priority: 0.8,
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
    {
      url: `${SITE_URL}/contact`,
      lastModified: LAST_SIGNIFICANT_UPDATE,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    ...posts.map((post) => ({
      url: `${SITE_URL}/writing/${post.slug}`,
      lastModified: post.updated_at,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...publishedWork.map((project) => ({
      url: `${SITE_URL}/work/${project.id}`,
      lastModified: LAST_SIGNIFICANT_UPDATE,
      changeFrequency: "monthly" as const,
      priority: 0.75,
    })),
  ];
}
