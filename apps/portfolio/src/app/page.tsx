import type { Metadata } from "next";
import { Suspense } from "react";

import { AboutSection } from "@/components/portfolio/sections/about-section";
import { HeroSection } from "@/components/portfolio/sections/hero-section";
import {
  fetchGitHubRepos,
  fetchGitHubUser,
  fetchRepoLanguages,
} from "@/lib/github-stats/api.server";
import { computeLOCStats } from "@/lib/github-stats/compute";
import type { GitHubLOCStats } from "@/lib/github-stats/types";
import { getPortfolioDataFromHeaders } from "@/lib/portfolio/server";
import {
  DEFAULT_OG_IMAGE,
  SITE_DESCRIPTION,
  SITE_TITLE,
} from "@/lib/seo/config";

import { PortfolioInteractive } from "./portfolio-interactive";

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

async function getGitHubCodeStats(): Promise<GitHubLOCStats | null> {
  try {
    const username = "goyal1510";
    const [user, repos] = await Promise.all([
      fetchGitHubUser(username),
      fetchGitHubRepos(username),
    ]);
    const activeRepos = repos.filter((repo) => !repo.fork && !repo.archived);
    const languageResults = await Promise.allSettled(
      activeRepos.map((repo) => fetchRepoLanguages(username, repo.name)),
    );
    const languagesByRepo = languageResults
      .filter((result) => result.status === "fulfilled")
      .map((result) => result.value);

    return computeLOCStats(
      languagesByRepo,
      activeRepos.length,
      user.created_at,
    );
  } catch {
    return null;
  }
}

export default async function PortfolioPage() {
  const [{ data, source }, codeStats] = await Promise.all([
    getPortfolioDataFromHeaders(),
    getGitHubCodeStats(),
  ]);

  return (
    <div className="relative z-10 space-y-16">
      <HeroSection hero={data.HERO} source={source} />
      <AboutSection about={data.ABOUT} education={data.EDUCATION} />
      <Suspense>
        <PortfolioInteractive codeStats={codeStats} />
      </Suspense>
    </div>
  );
}
