import type { Metadata } from "next"
import { Suspense } from "react"
import { HeroSection } from "@/components/portfolio/sections/hero-section"
import { AboutSection } from "@/components/portfolio/sections/about-section"
import { PortfolioInteractive } from "./portfolio-interactive"
import { fetchGitHubUser, fetchGitHubRepos, fetchRepoLanguages } from "@/lib/github-stats/api.server"
import { computeLOCStats } from "@/lib/github-stats/compute"
import type { GitHubLOCStats } from "@/lib/github-stats/types"

export const metadata: Metadata = {
  title: { absolute: "Jayant | Full-Stack Developer" },
  description: "A unified platform by Jayant — portfolio, 99+ developer tools, interactive games, file manager, real-time messenger, weather, activity tracker, and more. Built with Next.js, React, TypeScript, and Supabase.",
  openGraph: {
    title: "Jayant | Full-Stack Developer",
    description: "A unified platform by Jayant — portfolio, 99+ developer tools, interactive games, file manager, real-time messenger, weather, activity tracker, and more. Built with Next.js, React, TypeScript, and Supabase.",
    images: [
      {
        url: "https://www.jayantgoyal.com/opengraph-image?v=2",
        width: 1200,
        height: 630,
        alt: "Jayant | Full-Stack Developer",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Jayant | Full-Stack Developer",
    description: "A unified platform by Jayant — portfolio, 99+ developer tools, interactive games, file manager, real-time messenger, weather, activity tracker, and more. Built with Next.js, React, TypeScript, and Supabase.",
    images: [
      {
        url: "https://www.jayantgoyal.com/opengraph-image?v=2",
        width: 1200,
        height: 630,
        alt: "Jayant | Full-Stack Developer",
      },
    ],
  },
}

/**
 * Server component — Hero and About render as static HTML (no JS needed).
 * This is what the browser sees before ANY JavaScript loads, fixing LCP.
 * Interactive sections (skills animations, projects modal, etc.) load after.
 */
export default async function Page() {
  // Fetch GitHub LOC stats directly on the server so CodeStatsSection renders at full
  // height immediately — no client-side fetch, no skeleton, no layout shift on hash scroll.
  let codeStats: GitHubLOCStats | null = null
  try {
    const username = "goyal1510"
    const [user, repos] = await Promise.all([fetchGitHubUser(username), fetchGitHubRepos(username)])
    const activeRepos = repos.filter((r) => !r.fork && !r.archived)
    const langResults = await Promise.allSettled(activeRepos.map((r) => fetchRepoLanguages(username, r.name)))
    const languagesByRepo = langResults.filter((r) => r.status === "fulfilled").map((r) => r.value)
    codeStats = computeLOCStats(languagesByRepo, activeRepos.length, user.created_at)
  } catch { /* fail silently — section will fetch client-side as fallback */ }

  return (
    <div className="relative z-10 space-y-16">
      {/* Server-rendered: visible as HTML before JS loads — fast LCP */}
      <ServerPortfolio />
      {/* Client-rendered: interactive sections hydrate after first paint */}
      <Suspense>
        <PortfolioInteractive codeStats={codeStats} />
      </Suspense>
    </div>
  )
}

async function ServerPortfolio() {
  // Import at the component level to access the portfolio context
  // The data comes from the parent layout's PortfolioDataProvider
  // but since this is server-rendered, we read it from the server function
  const { getPortfolioDataFromHeaders } = await import("@/lib/portfolio/server")
  const { data, source } = await getPortfolioDataFromHeaders()

  return (
    <>
      <HeroSection hero={data.HERO} source={source} />
      <AboutSection about={data.ABOUT} education={data.EDUCATION} />
    </>
  )
}
