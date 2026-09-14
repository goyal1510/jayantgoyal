export const TRAFFIC_RANGES = ["24h", "7d", "30d"] as const;

export type TrafficRange = (typeof TRAFFIC_RANGES)[number];
export type TrafficGranularity = "hour" | "day";

export interface TrafficPoint {
  bucket: string;
  visitors: number;
  requests: number;
  cachedPercent: number;
  bytes: number;
  cachedBytes: number;
}

export interface CountryTraffic {
  code: string;
  numericCode: string | null;
  name: string;
  requests: number;
  bytes: number;
}

interface TrafficTotals {
  visitors: number;
  requests: number;
  cachedPercent: number;
  bytes: number;
  cachedBytes: number;
}

export interface TrafficSnapshot {
  range: TrafficRange;
  granularity: TrafficGranularity;
  start: string;
  end: string;
  generatedAt: string;
  points: TrafficPoint[];
  countries: CountryTraffic[];
  totals: TrafficTotals;
}

export type TrafficResult =
  | { ok: true; snapshot: TrafficSnapshot }
  | { ok: false; reason: "configuration" | "provider" };

export function parseTrafficRange(
  value: string | string[] | undefined,
): TrafficRange {
  const candidate = Array.isArray(value) ? value[0] : value;
  return TRAFFIC_RANGES.includes(candidate as TrafficRange)
    ? (candidate as TrafficRange)
    : "24h";
}

export function calculateCachedPercent(
  bytes: number,
  cachedBytes: number,
): number {
  return bytes > 0 ? (cachedBytes / bytes) * 100 : 0;
}

export function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: value >= 10_000 ? 1 : 2,
  }).format(value);
}

export function formatBytes(value: number): string {
  if (value === 0) return "0 B";

  const units = ["B", "kB", "MB", "GB", "TB"];
  const unitIndex = Math.min(
    Math.floor(Math.log(value) / Math.log(1000)),
    units.length - 1,
  );
  const scaled = value / 1000 ** unitIndex;
  const maximumFractionDigits = scaled >= 100 ? 0 : scaled >= 10 ? 1 : 2;

  return `${scaled.toFixed(maximumFractionDigits)} ${units[unitIndex]}`;
}
