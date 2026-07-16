import type { Metadata } from "next";
import { headers } from "next/headers";
import { Suspense } from "react";
import { StudioInventory } from "@/components/studio/studio-inventory";
import { HeroSection } from "@/components/portfolio/sections/hero-section";
import { AboutSection } from "@/components/portfolio/sections/about-section";
import { PortfolioInteractive } from "./portfolio-interactive";
import {
  fetchGitHubUser,
  fetchGitHubRepos,
  fetchRepoLanguages,
} from "@/lib/github-stats/api.server";
import { computeLOCStats } from "@/lib/github-stats/compute";
import type { GitHubLOCStats } from "@/lib/github-stats/types";
import {
  DEFAULT_OG_IMAGE,
  SITE_DESCRIPTION,
  SITE_TITLE,
} from "@/lib/seo/config";
import { isStudioHost } from "@/lib/platform/surface";

const STUDIO_TITLE = "Jayant Goyal Studio | Tools, Apps, and Experiments";
const STUDIO_DESCRIPTION =
  "Explore developer tools, personal workspaces, games, utilities, and experiments in Jayant Goyal Studio.";

export async function generateMetadata(): Promise<Metadata> {
  const host = (await headers()).get("host");
  const studio = isStudioHost(host);
  const title = studio ? STUDIO_TITLE : SITE_TITLE;
  const description = studio ? STUDIO_DESCRIPTION : SITE_DESCRIPTION;

  return {
    title: { absolute: title },
    description,
    openGraph: {
      title,
      description,
      images: [
        {
          url: DEFAULT_OG_IMAGE,
          width: 1200,
          height: 630,
          alt: title,
          type: "image/png",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [
        {
          url: DEFAULT_OG_IMAGE,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
  };
}

/**
 * Server component — Hero and About render as static HTML (no JS needed).
 * This is what the browser sees before ANY JavaScript loads, fixing LCP.
 * Interactive sections (skills animations, projects modal, etc.) load after.
 */
export default async function Page() {
  const host = (await headers()).get("host");
  if (isStudioHost(host)) {
    return <StudioInventory />;
  }

  // Fetch GitHub LOC stats directly on the server so CodeStatsSection renders at full
  // height immediately — no client-side fetch, no skeleton, no layout shift on hash scroll.
  let codeStats: GitHubLOCStats | null = null;
  try {
    const username = "goyal1510";
    const [user, repos] = await Promise.all([
      fetchGitHubUser(username),
      fetchGitHubRepos(username),
    ]);
    const activeRepos = repos.filter((r) => !r.fork && !r.archived);
    const langResults = await Promise.allSettled(
      activeRepos.map((r) => fetchRepoLanguages(username, r.name)),
    );
    const languagesByRepo = langResults
      .filter((r) => r.status === "fulfilled")
      .map((r) => r.value);
    codeStats = computeLOCStats(
      languagesByRepo,
      activeRepos.length,
      user.created_at,
    );
  } catch {
    /* fail silently — section will fetch client-side as fallback */
  }

  return (
    <div className="relative z-10 space-y-16">
      {/* Server-rendered: visible as HTML before JS loads — fast LCP */}
      <ServerPortfolio />
      {/* Client-rendered: interactive sections hydrate after first paint */}
      <Suspense>
        <PortfolioInteractive codeStats={codeStats} />
      </Suspense>
    </div>
  );
}

async function ServerPortfolio() {
  // Import at the component level to access the portfolio context
  // The data comes from the parent layout's PortfolioDataProvider
  // but since this is server-rendered, we read it from the server function
  const { getPortfolioDataFromHeaders } = await import(
    "@/lib/portfolio/server"
  );
  const { data, source } = await getPortfolioDataFromHeaders();

  return (
    <>
      <HeroSection hero={data.HERO} source={source} />
      <AboutSection about={data.ABOUT} education={data.EDUCATION} />
    </>
  );
}
