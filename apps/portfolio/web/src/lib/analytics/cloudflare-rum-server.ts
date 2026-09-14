import { unstable_cache } from "next/cache";

import {
  normalizeRumDuration,
  type WebVitalPoint,
  type WebVitalsResult,
  type WebVitalsSnapshot,
} from "@/lib/analytics/cloudflare-rum";
import type {
  TrafficGranularity,
  TrafficRange,
} from "@/lib/analytics/cloudflare-traffic";

const CLOUDFLARE_GRAPHQL_URL = "https://api.cloudflare.com/client/v4/graphql";

interface RumGroup {
  dimensions?: { date?: string; datetimeHour?: string };
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
      accounts?: Array<{ series?: RumGroup[]; totals?: RumGroup[] }>;
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

const WEB_VITAL_FIELDS = `
  quantiles {
    largestContentfulPaintP75
    interactionToNextPaintP75
    cumulativeLayoutShiftP75
    firstContentfulPaintP75
    timeToFirstByteP75
  }
`;

const HOURLY_QUERY = `
  query WebVitals($accountTag: string, $siteTag: string, $start: Time, $end: Time) {
    viewer {
      accounts(filter: { accountTag: $accountTag }) {
        series: rumWebVitalsEventsAdaptiveGroups(
          limit: 48
          orderBy: [datetimeHour_ASC]
          filter: { siteTag: $siteTag, datetime_geq: $start, datetime_lt: $end }
        ) {
          dimensions { datetimeHour }
          ${WEB_VITAL_FIELDS}
        }
        totals: rumWebVitalsEventsAdaptiveGroups(
          limit: 1
          filter: { siteTag: $siteTag, datetime_geq: $start, datetime_lt: $end }
        ) { ${WEB_VITAL_FIELDS} }
      }
    }
  }
`;

const DAILY_QUERY = `
  query WebVitals($accountTag: string, $siteTag: string, $start: Time, $end: Time) {
    viewer {
      accounts(filter: { accountTag: $accountTag }) {
        series: rumWebVitalsEventsAdaptiveGroups(
          limit: 31
          orderBy: [date_ASC]
          filter: { siteTag: $siteTag, datetime_geq: $start, datetime_lt: $end }
        ) {
          dimensions { date }
          ${WEB_VITAL_FIELDS}
        }
        totals: rumWebVitalsEventsAdaptiveGroups(
          limit: 1
          filter: { siteTag: $siteTag, datetime_geq: $start, datetime_lt: $end }
        ) { ${WEB_VITAL_FIELDS} }
      }
    }
  }
`;

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
      query: HOURLY_QUERY,
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
    query: DAILY_QUERY,
  };
}

function finiteOrNull(value: number | null): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
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

  try {
    const response = await fetch(CLOUDFLARE_GRAPHQL_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: window.query,
        variables: {
          accountTag,
          siteTag,
          start: window.start,
          end: window.end,
        },
      }),
    });

    if (!response.ok) return { ok: false, reason: "provider" };

    const payload = (await response.json()) as RumResponse;
    const account = payload.data?.viewer?.accounts?.[0];
    const total = account?.totals?.[0];
    if (payload.errors?.length || !account) {
      console.error("Cloudflare Web Analytics returned no usable account data");
      return { ok: false, reason: "provider" };
    }
    if (!total) return { ok: false, reason: "collecting" };

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
