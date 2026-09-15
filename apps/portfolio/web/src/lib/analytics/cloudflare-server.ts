import { unstable_cache } from "next/cache";
import countries from "i18n-iso-countries";

import {
  calculateCachedPercent,
  type CountryTraffic,
  type TrafficGranularity,
  type TrafficPoint,
  type TrafficRange,
  type TrafficResult,
  type TrafficSnapshot,
} from "@/lib/analytics/cloudflare-traffic";

const CLOUDFLARE_GRAPHQL_URL = "https://api.cloudflare.com/client/v4/graphql";

interface CloudflareGroup {
  dimensions: { date?: string; datetime?: string };
  sum: {
    bytes: number;
    cachedBytes: number;
    requests: number;
    countryMap?: Array<{
      bytes: number;
      clientCountryName: string;
      requests: number;
      threats: number;
    }>;
  };
  uniq: { uniques: number };
}

interface CloudflareResponse {
  data?: {
    viewer?: {
      zones?: Array<{
        series?: CloudflareGroup[];
        totals?: CloudflareGroup[];
      }>;
    };
  };
  errors?: Array<{ message?: string }>;
}

interface QueryWindow {
  start: string;
  end: string;
  granularity: TrafficGranularity;
  query: string;
}

const HOURLY_QUERY = `
  query ZoneTraffic($zoneTag: string, $start: Time, $end: Time) {
    viewer {
      zones(filter: { zoneTag: $zoneTag }) {
        series: httpRequests1hGroups(
          limit: 48
          orderBy: [datetime_ASC]
          filter: { datetime_geq: $start, datetime_lt: $end }
        ) {
          dimensions { datetime }
          sum { requests bytes cachedBytes }
          uniq { uniques }
        }
        totals: httpRequests1hGroups(
          limit: 1
          filter: { datetime_geq: $start, datetime_lt: $end }
        ) {
          sum {
            requests
            bytes
            cachedBytes
            countryMap { clientCountryName requests bytes threats }
          }
          uniq { uniques }
        }
      }
    }
  }
`;

const DAILY_QUERY = `
  query ZoneTraffic($zoneTag: string, $start: Date, $end: Date) {
    viewer {
      zones(filter: { zoneTag: $zoneTag }) {
        series: httpRequests1dGroups(
          limit: 31
          orderBy: [date_ASC]
          filter: { date_geq: $start, date_leq: $end }
        ) {
          dimensions { date }
          sum { requests bytes cachedBytes }
          uniq { uniques }
        }
        totals: httpRequests1dGroups(
          limit: 1
          filter: { date_geq: $start, date_leq: $end }
        ) {
          sum {
            requests
            bytes
            cachedBytes
            countryMap { clientCountryName requests bytes threats }
          }
          uniq { uniques }
        }
      }
    }
  }
`;

function toUtcDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function getTrafficQueryWindow(
  range: TrafficRange,
  now = new Date(),
): QueryWindow {
  if (range === "24h") {
    const endDate = new Date(now);
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

  const days = range === "7d" ? 7 : 30;
  const endDate = new Date(now);
  const startDate = new Date(now);
  startDate.setUTCDate(startDate.getUTCDate() - (days - 1));

  return {
    start: toUtcDate(startDate),
    end: toUtcDate(endDate),
    granularity: "day",
    query: DAILY_QUERY,
  };
}

function mapPoint(group: CloudflareGroup): TrafficPoint {
  const bytes = group.sum.bytes;
  const cachedBytes = group.sum.cachedBytes;

  return {
    bucket: group.dimensions.datetime ?? group.dimensions.date ?? "",
    visitors: group.uniq.uniques,
    requests: group.sum.requests,
    cachedPercent: calculateCachedPercent(bytes, cachedBytes),
    bytes,
    cachedBytes,
  };
}

function mapCountries(group: CloudflareGroup): CountryTraffic[] {
  return (group.sum.countryMap ?? [])
    .filter(
      ({ clientCountryName, requests }) => clientCountryName && requests >= 5,
    )
    .map(({ bytes, clientCountryName, requests, threats }) => ({
      code: clientCountryName,
      numericCode: countries.alpha2ToNumeric(clientCountryName) ?? null,
      name:
        countries.getName(clientCountryName, "en", { select: "alias" }) ??
        clientCountryName,
      requests,
      bytes,
      threats: threats ?? 0,
    }))
    .sort((left, right) => right.requests - left.requests);
}

async function requestCloudflareTraffic(
  range: TrafficRange,
): Promise<TrafficResult> {
  const token = process.env.CLOUDFLARE_API_TOKEN?.trim();
  const zoneTag = process.env.CLOUDFLARE_ZONE_ID?.trim();

  if (!token || !zoneTag) return { ok: false, reason: "configuration" };

  const window = getTrafficQueryWindow(range);

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
          zoneTag,
          start: window.start,
          end: window.end,
        },
      }),
    });

    if (!response.ok) {
      console.error("Cloudflare analytics request failed", response.status);
      return { ok: false, reason: "provider" };
    }

    const payload = (await response.json()) as CloudflareResponse;
    const zone = payload.data?.viewer?.zones?.[0];
    const total = zone?.totals?.[0];

    if (payload.errors?.length || !zone || !total) {
      console.error("Cloudflare analytics returned no usable zone data");
      return { ok: false, reason: "provider" };
    }

    const snapshot: TrafficSnapshot = {
      range,
      granularity: window.granularity,
      start: window.start,
      end: window.end,
      generatedAt: new Date().toISOString(),
      points: (zone.series ?? []).map(mapPoint),
      countries: mapCountries(total),
      totals: {
        visitors: total.uniq.uniques,
        requests: total.sum.requests,
        cachedPercent: calculateCachedPercent(
          total.sum.bytes,
          total.sum.cachedBytes,
        ),
        bytes: total.sum.bytes,
        cachedBytes: total.sum.cachedBytes,
      },
    };

    return { ok: true, snapshot };
  } catch (error) {
    console.error(
      "Cloudflare analytics request failed",
      error instanceof Error ? error.name : "UnknownError",
    );
    return { ok: false, reason: "provider" };
  }
}

/** Keeps the provider token server-only while reusing each fixed range for 15 minutes. */
export const getCloudflareTraffic = unstable_cache(
  requestCloudflareTraffic,
  ["portfolio-cloudflare-traffic"],
  { revalidate: 900 },
);
