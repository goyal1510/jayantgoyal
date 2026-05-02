import { NextRequest, NextResponse } from "next/server";
import { fetchGitHubUser, fetchGitHubRepos, fetchRepoLanguages } from "@/lib/github-stats/api.server";
import { computeLOCStats } from "@/lib/github-stats/compute";
import type { GitHubLOCStats } from "@/lib/github-stats/types";

interface ResponseCacheEntry {
  data: GitHubLOCStats;
  timestamp: number;
}

const RESPONSE_CACHE_TTL = 60 * 60 * 1000; // 1 hour
const responseCache = new Map<string, ResponseCacheEntry>();
const BATCH_SIZE = 10;

export async function GET(request: NextRequest) {
  const username = request.nextUrl.searchParams.get("username");

  if (!username) {
    return NextResponse.json({ error: "username parameter is required" }, { status: 400 });
  }

  const cacheKey = username.toLowerCase();
  const cached = responseCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < RESPONSE_CACHE_TTL) {
    return NextResponse.json(cached.data, {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200",
      },
    });
  }

  try {
    const [user, repos] = await Promise.all([
      fetchGitHubUser(username),
      fetchGitHubRepos(username),
    ]);

    const activeRepos = repos.filter((r) => !r.fork && !r.archived);

    // Batch language requests
    const languagesByRepo: Record<string, number>[] = [];
    for (let i = 0; i < activeRepos.length; i += BATCH_SIZE) {
      const batch = activeRepos.slice(i, i + BATCH_SIZE);
      const results = await Promise.allSettled(
        batch.map((repo) => fetchRepoLanguages(username, repo.name))
      );
      for (const result of results) {
        if (result.status === "fulfilled") {
          languagesByRepo.push(result.value);
        }
      }
    }

    const stats = computeLOCStats(languagesByRepo, activeRepos.length, user.created_at);

    responseCache.set(cacheKey, { data: stats, timestamp: Date.now() });

    return NextResponse.json(stats, {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch GitHub stats";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
