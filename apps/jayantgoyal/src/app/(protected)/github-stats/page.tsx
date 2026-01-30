import type { Metadata } from "next"
import GitHubStatsDashboard from "@/components/github-stats/github-stats-dashboard"

export const metadata: Metadata = {
  title: "GitHub Stats | Jayant Goyal",
  description: "Explore GitHub profiles with stats, contribution calendar, language distribution, and repository data.",
}

export default function Page() {
  return <GitHubStatsDashboard />
}
