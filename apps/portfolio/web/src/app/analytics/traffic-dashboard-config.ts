import {
  formatBytes,
  formatCompactNumber,
  type TrafficPoint,
  type TrafficRange,
  type TrafficSnapshot,
} from "@/lib/analytics/cloudflare-traffic";

interface MetricDefinition {
  key: keyof Pick<
    TrafficPoint,
    "visitors" | "requests" | "cachedPercent" | "bytes" | "cachedBytes"
  >;
  label: string;
  format: (value: number) => string;
}

export const RANGE_LABELS: Record<TrafficRange, string> = {
  "24h": "24 Hours",
  "7d": "7 Days",
  "30d": "30 Days",
};

export const METRICS: MetricDefinition[] = [
  { key: "visitors", label: "Unique Visitors", format: formatCompactNumber },
  { key: "requests", label: "Total Requests", format: formatCompactNumber },
  {
    key: "cachedPercent",
    label: "Percent Cached",
    format: (value) => `${value.toFixed(2)}%`,
  },
  { key: "bytes", label: "Total Data Served", format: formatBytes },
  { key: "cachedBytes", label: "Data Cached", format: formatBytes },
];

function asUtcDate(value: string): Date {
  return new Date(value.length === 10 ? `${value}T00:00:00.000Z` : value);
}

export function formatBucket(value: string, range: TrafficRange): string {
  return new Intl.DateTimeFormat("en-US", {
    ...(range === "24h"
      ? { hour: "numeric" as const }
      : { month: "short" as const, day: "numeric" as const }),
    timeZone: "UTC",
  }).format(asUtcDate(value));
}

export function formatRange(snapshot: TrafficSnapshot): string {
  const formatter = new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });
  return `${formatter.format(asUtcDate(snapshot.start))} — ${formatter.format(
    asUtcDate(snapshot.end),
  )}`;
}

export function formatUpdatedAt(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
    timeZoneName: "short",
  }).format(new Date(value));
}
