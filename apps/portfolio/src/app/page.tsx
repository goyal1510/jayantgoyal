import type { Metadata } from "next";

import { PortfolioExperience } from "@/components/editorial/portfolio-experience";
import { getPublishedBlogPreviews } from "@/lib/blog/editorial-queries";
import { getGitHubCodeStats } from "@/lib/github/server";
import {
  fallbackBlogPosts,
  fallbackPortfolioData,
} from "@/lib/portfolio/editorial-data";
import { getEditorialPortfolioData } from "@/lib/portfolio/editorial-server";
import {
  DEFAULT_OG_IMAGE,
  SITE_DESCRIPTION,
  SITE_TITLE,
} from "@/lib/seo/config";

export const revalidate = 300;

export const metadata: Metadata = {
  title: { absolute: SITE_TITLE },
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: "/",
    images: [
      {
        url: DEFAULT_OG_IMAGE,
        width: 1200,
        height: 630,
        alt: SITE_TITLE,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [DEFAULT_OG_IMAGE],
  },
};

export default async function PortfolioPage() {
  const [portfolio, githubStats, publishedPosts] = await Promise.all([
    getEditorialPortfolioData(),
    getGitHubCodeStats("goyal1510"),
    getPublishedBlogPreviews(),
  ]);

  const data = portfolio.data.projects.length
    ? portfolio.data
    : fallbackPortfolioData;

  return (
    <PortfolioExperience
      data={data}
      githubStats={githubStats}
      blogPosts={publishedPosts.length > 0 ? publishedPosts : fallbackBlogPosts}
    />
  );
}
