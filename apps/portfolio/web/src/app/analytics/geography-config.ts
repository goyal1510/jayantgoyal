import type { KeyboardEvent } from "react";

import {
  formatLayoutShift,
  formatMilliseconds,
  type WebVitalKey,
} from "@/lib/analytics/cloudflare-rum";
import type { TrafficRange } from "@/lib/analytics/cloudflare-traffic";

export const GEOGRAPHY_RANGE_LABELS: Record<TrafficRange, string> = {
  "24h": "last 24 hours",
  "7d": "last 7 days",
  "30d": "last 30 days",
};

export const COUNTRY_VITALS: Array<{
  key: WebVitalKey;
  label: string;
  format: (value: number | null) => string;
}> = [
  { key: "lcp", label: "LCP", format: formatMilliseconds },
  { key: "inp", label: "INP", format: formatMilliseconds },
  { key: "cls", label: "CLS", format: formatLayoutShift },
  { key: "fcp", label: "FCP", format: formatMilliseconds },
  { key: "ttfb", label: "TTFB", format: formatMilliseconds },
];

export function countryIntensity(requests: number, maximum: number): number {
  if (maximum <= 1) return 0.8;
  return 0.14 + (Math.log1p(requests) / Math.log1p(maximum)) * 0.86;
}

export function activateCountry(
  event: KeyboardEvent<SVGPathElement>,
  code: string,
  select: (code: string) => void,
) {
  if (event.key !== "Enter" && event.key !== " ") return;
  event.preventDefault();
  select(code);
}
