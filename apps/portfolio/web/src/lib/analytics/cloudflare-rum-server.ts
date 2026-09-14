import { unstable_cache } from "next/cache";

import { APP_BRANDS } from "@jayantgoyal/web-brand";

import {
  normalizeRumDuration,
  type CountryWebVitals,
  type WebVitalPoint,
  type WebVitalsResult,
  type WebVitalsSnapshot,
} from "@/lib/analytics/cloudflare-rum";
import type {
  TrafficGranularity,
  TrafficRange,
} from "@/lib/analytics/cloudflare-traffic";

import {
  DAILY_RUM_QUERY,
  HOURLY_RUM_QUERY,
  RUM_BREAKDOWN_QUERY,
} from "./cloudflare-rum-queries";

const CLOUDFLARE_GRAPHQL_URL = "https://api.cloudflare.com/client/v4/graphql";

interface RumGroup {
  dimensions?: {
    countryName?: string;
    date?: string;
    datetimeHour?: string;
  };
  sum?: {
    visits: number;
    clsGood: number;
    clsNeedsImprovement: number;
    clsPoor: number;
    clsTotal: number;
    fcpGood: number;
    fcpNeedsImprovement: number;
    fcpPoor: number;
    fcpTotal: number;
    inpGood: number;
    inpNeedsImprovement: number;
    inpPoor: number;
    inpTotal: number;
    lcpGood: number;
    lcpNeedsImprovement: number;
    lcpPoor: number;
    lcpTotal: number;
    ttfbGood: number;
    ttfbNeedsImprovement: number;
    ttfbPoor: number;
    ttfbTotal: number;
  };
  quantiles: {
    cumulativeLayoutShiftP75: number | null;
    firstContentfulPaintP75: number | null;
    interactionToNextPaintP75: number | null;
    largestContentfulPaintP75: number | null;
    timeToFirstByteP75: number | null;
  };
}

interface RumResponse {
  data?: {
    viewer?: {
      accounts?: Array<{
        countries?: RumGroup[];
        series?: RumGroup[];
        totals?: RumGroup[];
      }>;
    };
  };
  errors?: Array<{ message?: string }>;
}

interface RumQueryWindow {
  start: string;
  end: string;
  granularity: TrafficGranularity;
  query: string;
}

export function getRumQueryWindow(
  range: TrafficRange,
  now = new Date(),
): RumQueryWindow {
  const endDate = new Date(now);

  if (range === "24h") {
    endDate.setUTCMinutes(0, 0, 0);
    const startDate = new Date(endDate);
    startDate.setUTCHours(startDate.getUTCHours() - 24);
    return {
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      granularity: "hour",
      query: HOURLY_RUM_QUERY,
    };
  }

  endDate.setUTCHours(0, 0, 0, 0);
  endDate.setUTCDate(endDate.getUTCDate() + 1);
  const startDate = new Date(endDate);
  startDate.setUTCDate(startDate.getUTCDate() - (range === "7d" ? 7 : 30));

  return {
    start: startDate.toISOString(),
    end: endDate.toISOString(),
    granularity: "day",
    query: DAILY_RUM_QUERY,
  };
}

function finiteOrNull(value: number | null): number | null {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? value
    : null;
}

function mapVitals(group: RumGroup): Omit<WebVitalPoint, "bucket"> {
  return {
    lcp: normalizeRumDuration(group.quantiles.largestContentfulPaintP75),
    inp: normalizeRumDuration(group.quantiles.interactionToNextPaintP75),
    cls: finiteOrNull(group.quantiles.cumulativeLayoutShiftP75),
    fcp: normalizeRumDuration(group.quantiles.firstContentfulPaintP75),
    ttfb: normalizeRumDuration(group.quantiles.timeToFirstByteP75),
  };
}

function mapDistribution(group: RumGroup) {
  const sum = group.sum;
  const empty = { good: 0, needsImprovement: 0, poor: 0, total: 0 };
  if (!sum) {
    return { lcp: empty, inp: empty, cls: empty, fcp: empty, ttfb: empty };
  }
  return {
    lcp: {
      good: sum.lcpGood,
      needsImprovement: sum.lcpNeedsImprovement,
      poor: sum.lcpPoor,
      total: sum.lcpTotal,
    },
    inp: {
      good: sum.inpGood,
      needsImprovement: sum.inpNeedsImprovement,
      poor: sum.inpPoor,
      total: sum.inpTotal,
    },
    cls: {
      good: sum.clsGood,
      needsImprovement: sum.clsNeedsImprovement,
      poor: sum.clsPoor,
      total: sum.clsTotal,
    },
    fcp: {
      good: sum.fcpGood,
      needsImprovement: sum.fcpNeedsImprovement,
      poor: sum.fcpPoor,
      total: sum.fcpTotal,
    },
    ttfb: {
      good: sum.ttfbGood,
      needsImprovement: sum.ttfbNeedsImprovement,
      poor: sum.ttfbPoor,
      total: sum.ttfbTotal,
    },
  };
}

function mapCountryVitals(groups: RumGroup[]): CountryWebVitals[] {
  return groups
    .filter(
      (group) =>
        group.dimensions?.countryName && (group.sum?.visits ?? 0) >= 10,
    )
    .map((group) => ({
      code: group.dimensions?.countryName ?? "",
      visits: group.sum?.visits ?? 0,
      ...mapVitals(group),
    }));
}

async function requestCloudflareWebVitals(
  range: TrafficRange,
): Promise<WebVitalsResult> {
  const token = process.env.CLOUDFLARE_ACCOUNT_API_TOKEN?.trim();
  const accountTag = process.env.CLOUDFLARE_ACCOUNT_ID?.trim();
  const siteTag = process.env.CLOUDFLARE_WEB_ANALYTICS_SITE_TAG?.trim();
  if (!token || !accountTag || !siteTag) {
    return { ok: false, reason: "configuration" };
  }

  const window = getRumQueryWindow(range);
  const variables = {
    accountTag,
    siteTag,
    host: new URL(APP_BRANDS.portfolio.canonicalOrigin).hostname,
    start: window.start,
    end: window.end,
  };

  try {
    const request = (query: string) =>
      fetch(CLOUDFLARE_GRAPHQL_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query, variables }),
      });
    const [response, breakdownResponse] = await Promise.all([
      request(window.query),
      request(RUM_BREAKDOWN_QUERY),
    ]);

    if (!response.ok || !breakdownResponse.ok) {
      return { ok: false, reason: "provider" };
    }

    const payload = (await response.json()) as RumResponse;
    const breakdownPayload = (await breakdownResponse.json()) as RumResponse;
    const account = payload.data?.viewer?.accounts?.[0];
    const breakdownAccount = breakdownPayload.data?.viewer?.accounts?.[0];
    const total = account?.totals?.[0];
    const breakdownTotal = breakdownAccount?.totals?.[0];
    const errors = [
      ...(payload.errors ?? []),
      ...(breakdownPayload.errors ?? []),
    ];
    if (errors.length || !account || !breakdownAccount) {
      console.error(
        "Cloudflare Web Analytics returned no usable account data",
        errors
          .map(({ message }) => message)
          .filter(Boolean)
          .join("; "),
      );
      return { ok: false, reason: "provider" };
    }
    if (!total || !breakdownTotal) {
      return { ok: false, reason: "collecting" };
    }

    const totals = mapVitals(total);
    const snapshot: WebVitalsSnapshot = {
      range,
      granularity: window.granularity,
      start: window.start,
      end: window.end,
      generatedAt: new Date().toISOString(),
      points: (account.series ?? []).map((group) => ({
        bucket: group.dimensions?.datetimeHour ?? group.dimensions?.date ?? "",
        ...mapVitals(group),
      })),
      totals,
      distributions: mapDistribution(breakdownTotal),
      countries: mapCountryVitals(breakdownAccount.countries ?? []),
    };

    return { ok: true, snapshot };
  } catch (error) {
    console.error(
      "Cloudflare Web Analytics request failed",
      error instanceof Error ? error.name : "UnknownError",
    );
    return { ok: false, reason: "provider" };
  }
}

/** Reads aggregate RUM metrics server-side and reuses each range for 15 minutes. */
export const getCloudflareWebVitals = unstable_cache(
  requestCloudflareWebVitals,
  ["portfolio-cloudflare-web-vitals-v2"],
  { revalidate: 900 },
);
