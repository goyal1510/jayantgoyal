import type { Metadata } from "next"
import GitHubStatsDashboard from "@/components/github-stats/github-stats-dashboard"

export const metadata: Metadata = {
  title: "GitHub Stats",
  description: "Explore GitHub profiles — contribution calendar, repository stats, language breakdown, and activity data.",
}

export default function Page() {
  return <GitHubStatsDashboard />
}
