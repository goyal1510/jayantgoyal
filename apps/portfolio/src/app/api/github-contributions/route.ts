import { type NextRequest, NextResponse } from "next/server";

import type { ContributionCalendarData } from "@/lib/github/contributions";
import {
  fetchGitHubContributionCalendar,
  resolveContributionPeriod,
} from "@/lib/github/contributions";

type ResponseCacheEntry = {
  data: ContributionCalendarData;
  expiresAt: number;
};

const RESPONSE_CACHE_TTL = 60 * 60 * 1000;
const MAX_CACHE_ENTRIES = 25;
const GITHUB_USERNAME_PATTERN = /^[a-zA-Z0-9-]{1,39}$/;
const responseCache = new Map<string, ResponseCacheEntry>();

const CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200",
};

function cacheResponse(cacheKey: string, data: ContributionCalendarData) {
  if (responseCache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = responseCache.keys().next().value;
    if (oldestKey) responseCache.delete(oldestKey);
  }

  responseCache.set(cacheKey, {
    data,
    expiresAt: Date.now() + RESPONSE_CACHE_TTL,
  });
}

export async function GET(request: NextRequest) {
  const username = request.nextUrl.searchParams.get("username")?.trim();
  const range = resolveContributionPeriod(
    request.nextUrl.searchParams.get("period"),
  );

  if (!username || !GITHUB_USERNAME_PATTERN.test(username) || !range) {
    return NextResponse.json(
      {
        error: "A valid GitHub username and contribution period are required.",
      },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const cacheKey = `${username.toLowerCase()}:${range.period}`;
  const cached = responseCache.get(cacheKey);

  if (cached && cached.expiresAt > Date.now()) {
    return NextResponse.json(
      { available: true, ...cached.data },
      { headers: CACHE_HEADERS },
    );
  }

  try {
    const token = process.env.GITHUB_TOKEN;
    if (!token) throw new Error("GITHUB_TOKEN is not configured");

    const data = await fetchGitHubContributionCalendar({
      ...range,
      token,
      username,
    });
    cacheResponse(cacheKey, data);

    return NextResponse.json(
      { available: true, ...data },
      { headers: CACHE_HEADERS },
    );
  } catch {
    return NextResponse.json(
      {
        available: false,
        period: range.period,
        periodLabel: range.periodLabel,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  }
}
