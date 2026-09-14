import type { TrafficGranularity, TrafficRange } from "./cloudflare-traffic";

export type WebVitalKey = "lcp" | "inp" | "cls" | "fcp" | "ttfb";

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
  return typeof value === "number" && Number.isFinite(value)
    ? value / 1000
    : null;
}
