import {
  formatLayoutShift,
  formatMilliseconds,
  type WebVitalKey,
  type WebVitalRating,
  type WebVitalsSnapshot,
} from "@/lib/analytics/cloudflare-rum";

export interface VitalDefinition {
  key: WebVitalKey;
  label: string;
  name: string;
  description: string;
  format: (value: number | null) => string;
}

export const VITALS: VitalDefinition[] = [
  {
    key: "lcp",
    label: "LCP",
    name: "Largest Contentful Paint",
    description: "When the main content becomes visible",
    format: formatMilliseconds,
  },
  {
    key: "inp",
    label: "INP",
    name: "Interaction to Next Paint",
    description: "How quickly the page responds to interaction",
    format: formatMilliseconds,
  },
  {
    key: "cls",
    label: "CLS",
    name: "Cumulative Layout Shift",
    description: "How visually stable the page remains",
    format: formatLayoutShift,
  },
  {
    key: "fcp",
    label: "FCP",
    name: "First Contentful Paint",
    description: "When the first content appears",
    format: formatMilliseconds,
  },
  {
    key: "ttfb",
    label: "TTFB",
    name: "Time to First Byte",
    description: "How quickly the server starts responding",
    format: formatMilliseconds,
  },
];

export const RATING_LABELS: Record<WebVitalRating, string> = {
  good: "Good",
  "needs-improvement": "Needs improvement",
  poor: "Poor",
  unknown: "Awaiting data",
};

export function formatExperienceBucket(
  value: string,
  snapshot: WebVitalsSnapshot,
): string {
  const date = new Date(value.length === 10 ? `${value}T00:00:00Z` : value);
  return new Intl.DateTimeFormat("en-US", {
    ...(snapshot.granularity === "hour"
      ? { hour: "numeric" as const }
      : { month: "short" as const, day: "numeric" as const }),
    timeZone: "UTC",
  }).format(date);
}

export function formatCompactSamples(value: number): string {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}
