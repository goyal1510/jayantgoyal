"use client";

import Link from "next/link";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  formatBytes,
  formatCompactNumber,
  TRAFFIC_RANGES,
  type TrafficPoint,
  type TrafficRange,
  type TrafficSnapshot,
} from "@/lib/analytics/cloudflare-traffic";

import styles from "./analytics.module.css";

interface MetricDefinition {
  key: keyof Pick<
    TrafficPoint,
    "visitors" | "requests" | "cachedPercent" | "bytes" | "cachedBytes"
  >;
  label: string;
  format: (value: number) => string;
}

const RANGE_LABELS: Record<TrafficRange, string> = {
  "24h": "24 Hours",
  "7d": "7 Days",
  "30d": "30 Days",
};

const METRICS: MetricDefinition[] = [
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

function formatBucket(value: string, range: TrafficRange): string {
  const date = asUtcDate(value);
  return new Intl.DateTimeFormat("en-US", {
    ...(range === "24h"
      ? { hour: "numeric" as const }
      : { month: "short" as const, day: "numeric" as const }),
    timeZone: "UTC",
  }).format(date);
}

function formatRange(snapshot: TrafficSnapshot): string {
  const formatter = new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });

  return `${formatter.format(asUtcDate(snapshot.start))} — ${formatter.format(
    asUtcDate(snapshot.end),
  )}`;
}

function formatUpdatedAt(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
    timeZoneName: "short",
  }).format(new Date(value));
}

function TrafficChart({
  metric,
  snapshot,
}: {
  metric: MetricDefinition;
  snapshot: TrafficSnapshot;
}) {
  return (
    <div
      className={styles.chart}
      role="img"
      aria-label={`${metric.label} over the last ${RANGE_LABELS[snapshot.range].toLowerCase()}`}
    >
      <AreaChart
        accessibilityLayer
        data={snapshot.points}
        margin={{ top: 12, right: 8, bottom: 0, left: 4 }}
        responsive
        style={{ width: "100%", height: "100%" }}
      >
        <CartesianGrid
          vertical={false}
          stroke="var(--analytics-grid)"
          strokeDasharray="5 4"
        />
        <XAxis
          axisLine={false}
          dataKey="bucket"
          minTickGap={42}
          tick={{ fill: "var(--analytics-muted)", fontSize: 12 }}
          tickFormatter={(value: string) => formatBucket(value, snapshot.range)}
          tickLine={false}
        />
        <YAxis
          axisLine={false}
          tick={{ fill: "var(--analytics-muted)", fontSize: 12 }}
          tickFormatter={(value: number) => metric.format(value)}
          tickLine={false}
          width={70}
        />
        <Tooltip
          contentStyle={{
            background: "var(--analytics-tooltip)",
            border: "1px solid var(--analytics-line)",
            borderRadius: 0,
            color: "var(--paper-bright)",
            fontSize: 12,
          }}
          cursor={{ stroke: "var(--analytics-accent)", strokeOpacity: 0.45 }}
          formatter={(value) => [metric.format(Number(value)), metric.label]}
          labelFormatter={(value) =>
            formatBucket(String(value), snapshot.range)
          }
        />
        <Area
          dataKey={metric.key}
          fill="var(--analytics-area)"
          fillOpacity={0.22}
          isAnimationActive={false}
          stroke="var(--analytics-accent)"
          strokeWidth={2.5}
          type="linear"
        />
      </AreaChart>
    </div>
  );
}

export function TrafficDashboard({ snapshot }: { snapshot: TrafficSnapshot }) {
  return (
    <section className={styles.dashboard} aria-labelledby="traffic-heading">
      <div className={styles.toolbar}>
        <nav className={styles.ranges} aria-label="Analytics date range">
          {TRAFFIC_RANGES.map((range) => {
            const selected = range === snapshot.range;
            return (
              <Link
                key={range}
                href={
                  range === "24h" ? "/analytics" : `/analytics?range=${range}`
                }
                aria-current={selected ? "page" : undefined}
                className={selected ? styles.selectedRange : undefined}
                scroll={false}
              >
                {RANGE_LABELS[range]}
              </Link>
            );
          })}
        </nav>
        <div className={styles.rangeMeta}>
          <span>{formatRange(snapshot)}</span>
          <span>Updated {formatUpdatedAt(snapshot.generatedAt)}</span>
        </div>
      </div>

      <div className={styles.metricList}>
        {METRICS.map((metric, index) => (
          <article className={styles.metricCard} key={metric.key}>
            <div className={styles.metricSummary}>
              <div className={styles.metricLabel}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <h2>{metric.label}</h2>
              </div>
              <strong>{metric.format(snapshot.totals[metric.key])}</strong>
            </div>
            <TrafficChart metric={metric} snapshot={snapshot} />
          </article>
        ))}
      </div>

      <p className={styles.disclosure}>
        Aggregated edge traffic from Cloudflare. Times are shown in UTC; no
        visitor identities, IP addresses, or request-level records are exposed.
      </p>
    </section>
  );
}
