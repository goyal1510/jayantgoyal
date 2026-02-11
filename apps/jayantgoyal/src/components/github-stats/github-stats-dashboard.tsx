"use client"

import { useState, useCallback, useEffect, useMemo } from "react"
import { Search, X } from "lucide-react"
import { motion } from "framer-motion"
import { Input } from "@repo/ui/input"
import { Button } from "@repo/ui/button"
import { Skeleton } from "@repo/ui/skeleton"
import { Card, CardContent } from "@repo/ui/card"
import { fetchGitHubUser, fetchGitHubRepos } from "@/lib/github-stats/api"
import { computeStats, computeLanguageDistribution, getTopReposByStars } from "@/lib/github-stats/compute"
import type { GitHubUser, GitHubRepo } from "@/lib/github-stats/types"
import { ProfileCard } from "./profile-card"
import { StatsCards } from "./stats-cards"
import { ContributionCalendar } from "./contribution-calendar"
import { LanguagePieChart } from "./language-pie-chart"
import { TopReposBarChart } from "./top-repos-bar-chart"
import { RepositoryTable } from "./repository-table"

const DEFAULT_USERNAME = "goyal1510"

export default function GitHubStatsDashboard() {
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<GitHubUser | null>(null)
  const [repos, setRepos] = useState<GitHubRepo[]>([])

  const handleSearch = useCallback(
    async (username?: string) => {
      const query = (username ?? input).trim()
      if (!query) {
        setError("Please enter a GitHub username.")
        return
      }

      setLoading(true)
      setError(null)

      try {
        const [userData, repoData] = await Promise.all([
          fetchGitHubUser(query),
          fetchGitHubRepos(query),
        ])
        setUser(userData)
        setRepos(repoData)
        setInput(userData.login)
      } catch (err) {
        setError(err instanceof Error ? err.message : "An unexpected error occurred.")
        setUser(null)
        setRepos([])
      } finally {
        setLoading(false)
      }
    },
    [input]
  )

  // Load default user on mount
  useEffect(() => {
    void handleSearch(DEFAULT_USERNAME)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      void handleSearch()
    }
  }

  const stats = useMemo(
    () => (user && repos.length > 0 ? computeStats(repos, user.created_at) : null),
    [user, repos]
  )

  const languageData = useMemo(() => computeLanguageDistribution(repos), [repos])
  const topRepos = useMemo(() => getTopReposByStars(repos), [repos])

  return (
    <div className="container mx-auto max-w-7xl space-y-6 px-4 py-6">
      {/* Header
      <div className="flex items-center gap-3">
        <Github className="size-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">GitHub Stats</h1>
          <p className="text-sm text-muted-foreground">
            Explore any GitHub profile with stats, charts, and contribution data
          </p>
        </div>
      </div> */}

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                placeholder="Enter a GitHub username..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="pr-8"
              />
              {input && (
                <button
                  onClick={() => setInput("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer text-muted-foreground hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
            <Button onClick={() => void handleSearch()} disabled={loading}>
              {loading ? "Loading..." : <><Search className="mr-2 size-4" /> Search</>}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <div className="rounded-md border border-red-400/60 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:border-red-400/30 dark:bg-red-500/10 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="space-y-6">
          <Card>
            <CardContent className="flex gap-6 p-6">
              <Skeleton className="size-[120px] rounded-full" />
              <div className="flex-1 space-y-3">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-72" />
                <Skeleton className="h-4 w-56" />
              </div>
            </CardContent>
          </Card>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="flex flex-col items-center gap-2 p-4">
                  <Skeleton className="size-6 rounded" />
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-3 w-20" />
                </CardContent>
              </Card>
            ))}
          </div>
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
      )}

      {/* Results */}
      {!loading && user && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          <ProfileCard user={user} />

          {stats && <StatsCards stats={stats} />}

          <ContributionCalendar username={user.login} />

          <div className="grid gap-6 lg:grid-cols-2">
            <LanguagePieChart data={languageData} />
            <TopReposBarChart repos={topRepos} />
          </div>

          <RepositoryTable repos={repos} />
        </motion.div>
      )}
    </div>
  )
}
