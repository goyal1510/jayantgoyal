import {
  DEFAULT_FILTERS,
  type FilterBarState,
} from "./filter-bar";
import type {
  JobAiRecommendation,
  JobApplicationStatus,
  JobPriority,
  JobSourceKind,
} from "@/lib/types";

function setFromCsv<T extends string>(s: string | null): Set<T> {
  if (!s) return new Set();
  return new Set(s.split(",").filter(Boolean) as T[]);
}

export function parseFilters(searchParams: URLSearchParams | { get: (k: string) => string | null }): FilterBarState {
  const get = (k: string) =>
    typeof (searchParams as URLSearchParams).get === "function"
      ? (searchParams as URLSearchParams).get(k)
      : (searchParams as { get: (k: string) => string | null }).get(k);

  const indiaParam = get("india");
  const aiScoredParam = get("ai_scored");
  const matchParam = get("match");
  const minScoreParam = get("min_score");
  const sortParam = get("sort");

  return {
    q: get("q") ?? "",
    sourceKinds: setFromCsv<JobSourceKind>(get("source")),
    recommendations: setFromCsv<JobAiRecommendation>(get("recommendation")),
    priorities: setFromCsv<JobPriority>(get("priority")),
    statuses: setFromCsv<JobApplicationStatus | "none">(get("status")),
    india: indiaParam == null ? DEFAULT_FILTERS.india : indiaParam === "true",
    aiScored:
      aiScoredParam == null ? DEFAULT_FILTERS.aiScored : aiScoredParam === "true",
    matchesKeywords:
      matchParam == null ? DEFAULT_FILTERS.matchesKeywords : matchParam === "true",
    minScore:
      minScoreParam == null
        ? DEFAULT_FILTERS.minScore
        : Math.max(0, Math.min(100, parseInt(minScoreParam, 10))),
    sort:
      (sortParam as FilterBarState["sort"]) ?? DEFAULT_FILTERS.sort,
  };
}

export function filtersToQuery(state: FilterBarState, page = 1): string {
  const sp = new URLSearchParams();
  if (state.q) sp.set("q", state.q);
  if (state.sourceKinds.size)
    sp.set("source", Array.from(state.sourceKinds).join(","));
  if (state.recommendations.size)
    sp.set("recommendation", Array.from(state.recommendations).join(","));
  if (state.priorities.size)
    sp.set("priority", Array.from(state.priorities).join(","));
  if (state.statuses.size)
    sp.set("status", Array.from(state.statuses).join(","));
  if (state.india !== DEFAULT_FILTERS.india)
    sp.set("india", String(state.india));
  if (state.aiScored !== DEFAULT_FILTERS.aiScored)
    sp.set("ai_scored", String(state.aiScored));
  if (state.matchesKeywords !== DEFAULT_FILTERS.matchesKeywords)
    sp.set("match", String(state.matchesKeywords));
  if (state.minScore !== DEFAULT_FILTERS.minScore)
    sp.set("min_score", String(state.minScore));
  if (state.sort !== DEFAULT_FILTERS.sort) sp.set("sort", state.sort);
  if (page > 1) sp.set("page", String(page));
  return sp.toString();
}

/**
 * Convert FilterBarState to JobListingFilters used by /api/jobs/listings.
 * The API only handles single-value source/status today — we'll send the first
 * selected one (multi-select on those is a future API extension).
 */
export function filtersToApiQuery(
  state: FilterBarState,
  page: number,
  pageSize: number
) {
  const params = new URLSearchParams();
  if (state.q) params.set("q", state.q);
  if (state.india) params.set("india", "true");
  if (state.matchesKeywords) params.set("matches_keywords", "true");
  if (state.aiScored) {
    params.set("ai_scored", "true");
    params.set("min_ai_score", String(state.minScore));
  }
  if (state.sourceKinds.size > 0) {
    params.set("source_kind", Array.from(state.sourceKinds).join(","));
  }
  if (state.recommendations.size > 0) {
    params.set("recommendation", Array.from(state.recommendations).join(","));
  }
  if (state.priorities.size > 0) {
    params.set("priority", Array.from(state.priorities).join(","));
  }
  if (state.statuses.size > 0) {
    params.set("status", Array.from(state.statuses).join(","));
  }
  params.set("sort", state.sort);
  params.set("page", String(page));
  params.set("pageSize", String(pageSize));
  return params;
}
