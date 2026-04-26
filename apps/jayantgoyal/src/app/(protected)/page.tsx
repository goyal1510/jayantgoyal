import type { Metadata } from "next"
import { Suspense } from "react"
import { HeroSection } from "@/components/portfolio/sections/hero-section"
import { AboutSection } from "@/components/portfolio/sections/about-section"
import { PortfolioInteractive } from "./portfolio-interactive"

export const metadata: Metadata = {
  title: "Portfolio",
  description: "Jayant's portfolio — full-stack developer showcasing projects, skills, experience, and certifications.",
  openGraph: {
    title: "Jayant — Portfolio",
    description: "Jayant's portfolio — full-stack developer showcasing projects, skills, work experience, certifications, and open-source contributions.",
    images: [
      {
        url: "https://www.jayantgoyal.com/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Jayant — Full-Stack Developer",
        type: "image/png",
      },
    ],
  },
}

/**
 * Server component — Hero and About render as static HTML (no JS needed).
 * This is what the browser sees before ANY JavaScript loads, fixing LCP.
 * Interactive sections (skills animations, projects modal, etc.) load after.
 */
export default function Page() {
  return (
    <div className="relative z-10 space-y-16">
      {/* Server-rendered: visible as HTML before JS loads — fast LCP */}
      <ServerPortfolio />
      {/* Client-rendered: interactive sections hydrate after first paint */}
      <Suspense>
        <PortfolioInteractive />
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
