import { GitHubApiError, type GitHubLOCStats } from "@jayant/github";
import { githubServerClient } from "@jayant/github/server";
import { type NextRequest, NextResponse } from "next/server";

type ResponseCacheEntry = {
  data: GitHubLOCStats;
  expiresAt: number;
};

const RESPONSE_CACHE_TTL = 60 * 60 * 1000;
const MAX_CACHE_ENTRIES = 25;
const GITHUB_USERNAME_PATTERN = /^[a-zA-Z0-9-]{1,39}$/;
const responseCache = new Map<string, ResponseCacheEntry>();

const CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200",
};

function cacheResponse(username: string, data: GitHubLOCStats) {
  if (responseCache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = responseCache.keys().next().value;
    if (oldestKey) responseCache.delete(oldestKey);
  }

  responseCache.set(username, {
    data,
    expiresAt: Date.now() + RESPONSE_CACHE_TTL,
  });
}

export async function GET(request: NextRequest) {
  const username = request.nextUrl.searchParams.get("username")?.trim();

  if (!username || !GITHUB_USERNAME_PATTERN.test(username)) {
    return NextResponse.json(
      { error: "A valid GitHub username is required." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const cacheKey = username.toLowerCase();
  const cached = responseCache.get(cacheKey);

  if (cached && cached.expiresAt > Date.now()) {
    return NextResponse.json(cached.data, { headers: CACHE_HEADERS });
  }

  try {
    const stats = await githubServerClient.getCodeStats(username);
    cacheResponse(cacheKey, stats);

    return NextResponse.json(stats, { headers: CACHE_HEADERS });
  } catch (error) {
    const status =
      error instanceof GitHubApiError && error.code === "not_found" ? 404 : 503;

    return NextResponse.json(
      { error: "GitHub activity is temporarily unavailable." },
      { status, headers: { "Cache-Control": "no-store" } },
    );
  }
}
