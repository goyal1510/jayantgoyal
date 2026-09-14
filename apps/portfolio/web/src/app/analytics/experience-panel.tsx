"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  formatLayoutShift,
  formatMilliseconds,
  type WebVitalKey,
  type WebVitalsResult,
  type WebVitalsSnapshot,
} from "@/lib/analytics/cloudflare-rum";

import styles from "./analytics-panels.module.css";

interface VitalDefinition {
  key: WebVitalKey;
  label: string;
  description: string;
  format: (value: number | null) => string;
}

const VITALS: VitalDefinition[] = [
  {
    key: "lcp",
    label: "LCP",
    description: "Loading",
    format: formatMilliseconds,
  },
  {
    key: "inp",
    label: "INP",
    description: "Interaction",
    format: formatMilliseconds,
  },
  {
    key: "cls",
    label: "CLS",
    description: "Visual stability",
    format: formatLayoutShift,
  },
  {
    key: "fcp",
    label: "FCP",
    description: "First content",
    format: formatMilliseconds,
  },
  {
    key: "ttfb",
    label: "TTFB",
    description: "Server response",
    format: formatMilliseconds,
  },
];

function formatBucket(value: string, snapshot: WebVitalsSnapshot): string {
  const date = new Date(value.length === 10 ? `${value}T00:00:00Z` : value);
  return new Intl.DateTimeFormat("en-US", {
    ...(snapshot.granularity === "hour"
      ? { hour: "numeric" as const }
      : { month: "short" as const, day: "numeric" as const }),
    timeZone: "UTC",
  }).format(date);
}

function VitalChart({
  vital,
  snapshot,
}: {
  vital: VitalDefinition;
  snapshot: WebVitalsSnapshot;
}) {
  return (
    <div
      className={styles.vitalChart}
      role="img"
      aria-label={`${vital.label} 75th percentile trend`}
    >
      <AreaChart
        accessibilityLayer
        data={snapshot.points}
        responsive
        style={{ width: "100%", height: "100%" }}
        margin={{ top: 8, right: 4, bottom: 0, left: 0 }}
      >
        <CartesianGrid
          vertical={false}
          stroke="var(--analytics-grid)"
          strokeDasharray="4 4"
        />
        <XAxis
          axisLine={false}
          dataKey="bucket"
          minTickGap={34}
          tick={{ fill: "var(--analytics-muted)", fontSize: 10 }}
          tickFormatter={(value: string) => formatBucket(value, snapshot)}
          tickLine={false}
        />
        <YAxis hide domain={["auto", "auto"]} />
        <Tooltip
          contentStyle={{
            background: "var(--analytics-tooltip)",
            border: 0,
            borderRadius: 0,
            color: "var(--paper-bright)",
            fontSize: 12,
          }}
          formatter={(value) => [
            vital.format(Number(value)),
            `${vital.label} · P75`,
          ]}
          labelFormatter={(value) => formatBucket(String(value), snapshot)}
        />
        <Area
          connectNulls
          dataKey={vital.key}
          fill="var(--analytics-area)"
          fillOpacity={0.18}
          isAnimationActive={false}
          stroke="var(--signal)"
          strokeWidth={2}
          type="monotone"
        />
      </AreaChart>
    </div>
  );
}

export function ExperiencePanel({ result }: { result: WebVitalsResult }) {
  return (
    <section className={styles.section} aria-labelledby="experience-heading">
      <div className={styles.sectionHeading}>
        <div>
          <span className={styles.kicker}>Real user experience</span>
          <h2 id="experience-heading">How the site feels</h2>
        </div>
        <p>
          Browser-measured performance at the 75th percentile. LCP, INP, and CLS
          are the Core Web Vitals; FCP and TTFB add delivery context.
        </p>
      </div>

      {result.ok ? (
        <div className={styles.vitalGrid}>
          {VITALS.map((vital) => (
            <article className={styles.vitalCard} key={vital.key}>
              <div className={styles.vitalSummary}>
                <span>{vital.description}</span>
                <h3>{vital.label}</h3>
                <strong>
                  {vital.format(result.snapshot.totals[vital.key])}
                </strong>
                <small>75th percentile</small>
              </div>
              <VitalChart vital={vital} snapshot={result.snapshot} />
            </article>
          ))}
        </div>
      ) : (
        <div className={styles.pendingPanel}>
          <span>
            {result.reason === "collecting"
              ? "Collecting measurements"
              : "Connection pending"}
          </span>
          <p>
            Cloudflare Web Analytics is ready to supply these metrics. The panel
            will populate after account analytics access and fresh browser
            samples are available.
          </p>
        </div>
      )}
    </section>
  );
}
