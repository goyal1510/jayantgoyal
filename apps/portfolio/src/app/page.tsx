import type { Metadata } from "next";

import { PortfolioExperience } from "@/components/editorial/portfolio-experience";
import { getPublishedBlogPreviews } from "@/lib/blog/editorial-queries";
import { getGitHubCodeStats } from "@/lib/github/server";
import { getEditorialPortfolioData } from "@/lib/portfolio/editorial-server";
import { DEFAULT_OG_IMAGE } from "@/lib/seo/config";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { profile } = await getEditorialPortfolioData();

  return {
    title: { absolute: profile.seoTitle },
    description: profile.seoDescription,
    alternates: { canonical: "/" },
    openGraph: {
      title: profile.seoTitle,
      description: profile.seoDescription,
      url: "/",
      images: [
        {
          url: DEFAULT_OG_IMAGE,
          width: 1200,
          height: 630,
          alt: profile.seoTitle,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: profile.seoTitle,
      description: profile.seoDescription,
      images: [DEFAULT_OG_IMAGE],
    },
  };
}

export default async function PortfolioPage() {
  const [portfolio, publishedPosts] = await Promise.all([
    getEditorialPortfolioData(),
    getPublishedBlogPreviews(),
  ]);
  const githubStats = portfolio.sectionContent.activity.isVisible
    ? await getGitHubCodeStats(portfolio.profile.githubUsername)
    : null;

  return (
    <PortfolioExperience
      data={portfolio}
      githubStats={githubStats}
      blogPosts={publishedPosts}
    />
  );
}
