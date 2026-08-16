import { NextRequest, NextResponse } from "next/server";
import { githubServerClient } from "@jayantgoyal/github/server";
import type { GitHubLOCStats } from "@jayantgoyal/github";

interface ResponseCacheEntry {
  data: GitHubLOCStats;
  timestamp: number;
}

const RESPONSE_CACHE_TTL = 60 * 60 * 1000; // 1 hour
const responseCache = new Map<string, ResponseCacheEntry>();

export async function GET(request: NextRequest) {
  const username = request.nextUrl.searchParams.get("username");

  if (!username) {
    return NextResponse.json(
      { error: "username parameter is required" },
      { status: 400 },
    );
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
    const stats = await githubServerClient.getCodeStats(username);

    responseCache.set(cacheKey, { data: stats, timestamp: Date.now() });

    return NextResponse.json(stats, {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch GitHub stats";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
