import type { Metadata } from "next"
import GitHubStatsDashboard from "@/components/github-stats/github-stats-dashboard"
import { buildPublicPageMetadata } from "@/lib/seo/config"

export const metadata: Metadata = buildPublicPageMetadata({
  title: "GitHub Stats",
  description: "Explore GitHub profiles — contribution calendar, repository stats, language breakdown, and activity data.",
  pathname: "/github-stats",
})

export default function Page() {
  return <GitHubStatsDashboard />
}
