"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import dynamic from "next/dynamic";
import { Github, Search, X } from "lucide-react";
import { m } from "framer-motion";
import { Input } from "@jayantgoyal/web-ui/input";
import { Button } from "@jayantgoyal/web-ui/button";
import { Skeleton } from "@jayantgoyal/web-ui/skeleton";
import { Card, CardContent } from "@jayantgoyal/web-ui/card";
import { PageSpinner } from "@jayantgoyal/web-ui/page-spinner";
import { createGitHubProxyClient } from "@jayantgoyal/github/proxy";
import {
  computeStats,
  computeLanguageDistribution,
  getTopReposByStars,
} from "@jayantgoyal/github";
import type { GitHubUser, GitHubRepo } from "@jayantgoyal/github";
import { ProfileCard } from "./profile-card";
import { StatsCards } from "./stats-cards";
import { ContributionCalendar } from "./contribution-calendar";
import { RepositoryTable } from "./repository-table";
import { WorkspaceHeader } from "@jayantgoyal/web-ui/workspace-header";

const LanguagePieChart = dynamic(
  () =>
    import("./language-pie-chart").then((mod) => ({
      default: mod.LanguagePieChart,
    })),
  {
    ssr: false,
    loading: () => (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center py-24">
          <Skeleton className="h-[300px] w-full rounded-lg" />
        </CardContent>
      </Card>
    ),
  },
);

const TopReposBarChart = dynamic(
  () =>
    import("./top-repos-bar-chart").then((mod) => ({
      default: mod.TopReposBarChart,
    })),
  {
    ssr: false,
    loading: () => (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center py-24">
          <Skeleton className="h-[300px] w-full rounded-lg" />
        </CardContent>
      </Card>
    ),
  },
);

const DEFAULT_USERNAME = "goyal1510";
const githubClient = createGitHubProxyClient();

export default function GitHubStatsDashboard() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const hasLoaded = useRef(false);

  const handleSearch = useCallback(
    async (username?: string) => {
      const query = (username ?? input).trim();
      if (!query) {
        setError("Please enter a GitHub username.");
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const [userData, repoData] = await Promise.all([
          githubClient.fetchUser(query),
          githubClient.fetchRepositories(query),
        ]);
        setUser(userData);
        setRepos(repoData);
        setInput(userData.login);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An unexpected error occurred.",
        );
        setUser(null);
        setRepos([]);
      } finally {
        setLoading(false);
        hasLoaded.current = true;
      }
    },
    [input],
  );

  // Load default user on mount
  useEffect(() => {
    void handleSearch(DEFAULT_USERNAME);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      void handleSearch();
    }
  };

  const stats = useMemo(
    () =>
      user && repos.length > 0 ? computeStats(repos, user.created_at) : null,
    [user, repos],
  );

  const languageData = useMemo(
    () => computeLanguageDistribution(repos),
    [repos],
  );
  const topRepos = useMemo(() => getTopReposByStars(repos), [repos]);

  return (
    <div className="mx-auto w-full max-w-[1280px] space-y-6">
      <WorkspaceHeader
        icon={Github}
        title="GitHub Stats"
        description="Explore a public profile, understand its repository footprint, and compare contribution patterns at a glance."
        tone="blue"
      >
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative min-w-0 flex-1">
            <Input
              aria-label="GitHub username"
              placeholder="Enter a GitHub username"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="h-12 rounded-xl border-current/20 bg-white/65 pr-10 text-[#211512] shadow-none placeholder:text-[#211512]/55 focus-visible:ring-[#211512]/40 dark:bg-black/15 dark:text-[#fff8ef] dark:placeholder:text-[#fff8ef]/55"
            />
            {input && (
              <button
                type="button"
                aria-label="Clear GitHub username"
                onClick={() => setInput("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer opacity-60 transition-opacity hover:opacity-100"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
          <Button
            onClick={() => void handleSearch()}
            disabled={loading}
            className="h-12 rounded-xl bg-[#211512] px-6 text-[#fff8ef] shadow-none hover:bg-[#211512]/90 dark:bg-[#fff8ef] dark:text-[#211512] dark:hover:bg-[#fff8ef]/90"
          >
            <Search className="size-4" />
            {loading ? "Loading profile" : "Explore profile"}
          </Button>
        </div>
      </WorkspaceHeader>

      {/* Error */}
      {error && (
        <div className="rounded-md border border-red-400/60 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:border-red-400/30 dark:bg-red-500/10 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && !hasLoaded.current && <PageSpinner />}
      {loading && hasLoaded.current && (
        <div className="space-y-5">
          <Card className="rounded-[1.75rem] shadow-none">
            <CardContent className="flex gap-6 p-6 sm:p-7">
              <Skeleton className="size-[120px] rounded-full" />
              <div className="flex-1 space-y-3">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-72" />
                <Skeleton className="h-4 w-56" />
              </div>
            </CardContent>
          </Card>
          <div className="overflow-hidden rounded-[1.5rem] border border-border/80 bg-card sm:grid sm:grid-cols-3 lg:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="border-b border-border/70 p-4 sm:border-b-0 sm:border-r last:border-0"
              >
                <div className="flex flex-col gap-2">
                  <Skeleton className="size-6 rounded" />
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            ))}
          </div>
          <Skeleton className="h-64 w-full rounded-[1.75rem]" />
        </div>
      )}

      {/* Results */}
      {!loading && user && (
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="space-y-5"
        >
          <ProfileCard user={user} />

          {stats && <StatsCards stats={stats} />}

          <ContributionCalendar username={user.login} />

          <div className="grid gap-6 lg:grid-cols-2">
            <LanguagePieChart data={languageData} />
            <TopReposBarChart repos={topRepos} />
          </div>

          <RepositoryTable repos={repos} />
        </m.div>
      )}
    </div>
  );
}
