"use client";

import Link from "next/link";
import {
  CartesianGrid,
  Line,
  LineChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  formatBytes,
  formatCompactNumber,
  TRAFFIC_RANGES,
  type TrafficSnapshot,
} from "@/lib/analytics/cloudflare-traffic";

import styles from "./analytics.module.css";
import {
  formatBucket,
  formatRange,
  formatUpdatedAt,
  METRICS,
  RANGE_LABELS,
} from "./traffic-dashboard-config";

function TrafficVolumeChart({ snapshot }: { snapshot: TrafficSnapshot }) {
  return (
    <div
      className={styles.overviewChart}
      role="img"
      aria-label={`Requests and unique visitors over the last ${RANGE_LABELS[snapshot.range].toLowerCase()}`}
    >
      <LineChart
        accessibilityLayer
        data={snapshot.points}
        margin={{ top: 16, right: 10, bottom: 0, left: 4 }}
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
          tick={{ fill: "var(--analytics-muted)", fontSize: 11 }}
          tickFormatter={(value: string) => formatBucket(value, snapshot.range)}
          tickLine={false}
        />
        <YAxis
          axisLine={false}
          tick={{ fill: "var(--analytics-muted)", fontSize: 11 }}
          tickFormatter={formatCompactNumber}
          tickLine={false}
          width={54}
          yAxisId="requests"
        />
        <YAxis
          axisLine={false}
          orientation="right"
          tick={{ fill: "var(--analytics-muted)", fontSize: 11 }}
          tickFormatter={formatCompactNumber}
          tickLine={false}
          width={46}
          yAxisId="visitors"
        />
        <Tooltip
          cursor={{
            stroke: "var(--analytics-secondary)",
            strokeDasharray: "4 4",
          }}
          contentStyle={{
            background: "var(--analytics-tooltip)",
            border: 0,
            borderRadius: 0,
            color: "var(--analytics-tooltip-text)",
            fontSize: 12,
          }}
          formatter={(value, name) => [
            formatCompactNumber(Number(value)),
            name === "requests" ? "Requests" : "Unique visitors",
          ]}
          labelFormatter={(value) =>
            formatBucket(String(value), snapshot.range)
          }
        />
        <Line
          dataKey="requests"
          dot={{ fill: "var(--paper-bright)", r: 2.5, strokeWidth: 2 }}
          isAnimationActive={false}
          stroke="var(--signal)"
          strokeWidth={2.5}
          type="monotone"
          yAxisId="requests"
        />
        <Line
          dataKey="visitors"
          dot={{ fill: "var(--paper-bright)", r: 2.5, strokeWidth: 2 }}
          isAnimationActive={false}
          stroke="var(--analytics-secondary)"
          strokeWidth={2.25}
          type="monotone"
          yAxisId="visitors"
        />
      </LineChart>
    </div>
  );
}

function DeliveryMixChart({ snapshot }: { snapshot: TrafficSnapshot }) {
  const points = snapshot.points.map((point) => ({
    ...point,
    uncachedBytes: Math.max(point.bytes - point.cachedBytes, 0),
  }));

  return (
    <div
      className={styles.overviewChart}
      role="img"
      aria-label={`Cached and uncached bandwidth over the last ${RANGE_LABELS[snapshot.range].toLowerCase()}`}
    >
      <LineChart
        accessibilityLayer
        data={points}
        margin={{ top: 16, right: 8, bottom: 0, left: 4 }}
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
          tick={{ fill: "var(--analytics-muted)", fontSize: 11 }}
          tickFormatter={(value: string) => formatBucket(value, snapshot.range)}
          tickLine={false}
        />
        <YAxis
          axisLine={false}
          tick={{ fill: "var(--analytics-muted)", fontSize: 11 }}
          tickFormatter={formatBytes}
          tickLine={false}
          width={66}
        />
        <Tooltip
          cursor={{
            stroke: "var(--analytics-secondary)",
            strokeDasharray: "4 4",
          }}
          contentStyle={{
            background: "var(--analytics-tooltip)",
            border: 0,
            borderRadius: 0,
            color: "var(--analytics-tooltip-text)",
            fontSize: 12,
          }}
          formatter={(value, name) => [
            formatBytes(Number(value)),
            name === "cachedBytes" ? "Cached" : "Uncached",
          ]}
          labelFormatter={(value) =>
            formatBucket(String(value), snapshot.range)
          }
        />
        <Line
          dataKey="cachedBytes"
          dot={{ fill: "var(--paper-bright)", r: 2.5, strokeWidth: 2 }}
          isAnimationActive={false}
          stroke="var(--signal)"
          strokeWidth={2.5}
          type="monotone"
        />
        <Line
          dataKey="uncachedBytes"
          dot={{ fill: "var(--paper-bright)", r: 2.5, strokeWidth: 2 }}
          isAnimationActive={false}
          stroke="var(--analytics-secondary)"
          strokeDasharray="6 4"
          strokeWidth={2.25}
          type="monotone"
        />
      </LineChart>
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

      <div className={styles.metricStrip}>
        {METRICS.map((metric, index) => (
          <article key={metric.key}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <h2>{metric.label}</h2>
            <strong>{metric.format(snapshot.totals[metric.key])}</strong>
          </article>
        ))}
      </div>

      <div className={styles.trafficVisualGrid}>
        <article className={styles.visualCard}>
          <div className={styles.visualHeading}>
            <div>
              <span>Traffic volume</span>
              <h2>Requests and visitors</h2>
            </div>
            <div className={styles.chartLegend} aria-hidden="true">
              <span data-series="requests">Requests</span>
              <span data-series="visitors">Visitors</span>
            </div>
          </div>
          <TrafficVolumeChart snapshot={snapshot} />
        </article>

        <article className={styles.visualCard}>
          <div className={styles.visualHeading}>
            <div>
              <span>Delivery composition</span>
              <h2>Cached versus uncached</h2>
            </div>
            <div className={styles.chartLegend} aria-hidden="true">
              <span data-series="cached">Cached</span>
              <span data-series="uncached">Uncached</span>
            </div>
          </div>
          <DeliveryMixChart snapshot={snapshot} />
        </article>
      </div>

      <p className={styles.disclosure}>
        Aggregated edge traffic from Cloudflare. Times are shown in UTC. Unique
        visitors are estimated by Cloudflare; no identities, IP addresses, or
        request-level records are exposed.
      </p>
    </section>
  );
}
