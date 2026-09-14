import type { TrafficGranularity, TrafficRange } from "./cloudflare-traffic";

export type WebVitalKey = "lcp" | "inp" | "cls" | "fcp" | "ttfb";
export type WebVitalRating = "good" | "needs-improvement" | "poor" | "unknown";

interface WebVitalDistribution {
  good: number;
  needsImprovement: number;
  poor: number;
  total: number;
}

export interface CountryWebVitals {
  code: string;
  visits: number;
  lcp: number | null;
  inp: number | null;
  cls: number | null;
  fcp: number | null;
  ttfb: number | null;
}

export interface WebVitalPoint {
  bucket: string;
  lcp: number | null;
  inp: number | null;
  cls: number | null;
  fcp: number | null;
  ttfb: number | null;
}

export interface WebVitalsSnapshot {
  range: TrafficRange;
  granularity: TrafficGranularity;
  start: string;
  end: string;
  generatedAt: string;
  points: WebVitalPoint[];
  totals: Record<WebVitalKey, number | null>;
  distributions: Record<WebVitalKey, WebVitalDistribution>;
  countries: CountryWebVitals[];
}

export type WebVitalsResult =
  | { ok: true; snapshot: WebVitalsSnapshot }
  | {
      ok: false;
      reason: "configuration" | "provider" | "collecting";
    };

export function formatMilliseconds(value: number | null): string {
  if (value === null) return "—";
  return value >= 1000
    ? `${(value / 1000).toFixed(2)} s`
    : `${Math.round(value)} ms`;
}

export function formatLayoutShift(value: number | null): string {
  return value === null ? "—" : value.toFixed(3);
}

/** Converts Cloudflare RUM GraphQL durations from microseconds to milliseconds. */
export function normalizeRumDuration(value: number | null): number | null {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? value / 1000
    : null;
}

export const WEB_VITAL_THRESHOLDS: Record<
  WebVitalKey,
  { good: number; poor: number }
> = {
  lcp: { good: 2500, poor: 4000 },
  inp: { good: 200, poor: 500 },
  cls: { good: 0.1, poor: 0.25 },
  fcp: { good: 1800, poor: 3000 },
  ttfb: { good: 800, poor: 1800 },
};

export function getWebVitalRating(
  key: WebVitalKey,
  value: number | null,
): WebVitalRating {
  if (value === null) return "unknown";
  const threshold = WEB_VITAL_THRESHOLDS[key];
  if (value <= threshold.good) return "good";
  return value <= threshold.poor ? "needs-improvement" : "poor";
}
