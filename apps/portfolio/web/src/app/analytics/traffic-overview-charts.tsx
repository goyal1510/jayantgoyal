"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  formatBytes,
  formatCompactNumber,
  type TrafficSnapshot,
} from "@/lib/analytics/cloudflare-traffic";

import styles from "./analytics.module.css";
import { formatBucket, RANGE_LABELS } from "./traffic-dashboard-config";

const TOOLTIP_STYLE = {
  background: "var(--analytics-tooltip)",
  border: "1px solid var(--analytics-tooltip-border)",
  borderRadius: 0,
  boxShadow: "6px 6px 0 var(--analytics-tooltip-shadow)",
  color: "var(--analytics-tooltip-text)",
  fontSize: 12,
};

const TOOLTIP_CURSOR = {
  stroke: "var(--analytics-secondary)",
  strokeDasharray: "4 4",
};

export function TrafficVolumeChart({
  snapshot,
}: {
  snapshot: TrafficSnapshot;
}) {
  return (
    <div
      className={styles.trafficSmallMultiples}
      role="group"
      aria-label={`Requests and unique visitors over the last ${RANGE_LABELS[snapshot.range].toLowerCase()}`}
    >
      <div
        className={styles.miniChart}
        data-series="requests"
        role="img"
        aria-label="Requests by time interval"
      >
        <div className={styles.axisLabel}>
          <strong>Requests</strong>
          <span>per interval</span>
        </div>
        <div className={styles.miniChartPlot}>
          <BarChart
            accessibilityLayer
            data={snapshot.points}
            margin={{ top: 8, right: 8, bottom: 0, left: 4 }}
            responsive
            style={{ width: "100%", height: "100%" }}
          >
            <CartesianGrid
              vertical={false}
              stroke="var(--analytics-grid)"
              strokeDasharray="5 4"
            />
            <XAxis dataKey="bucket" hide />
            <YAxis
              axisLine={false}
              tick={{ fill: "var(--analytics-muted)", fontSize: 10 }}
              tickFormatter={formatCompactNumber}
              tickLine={false}
              width={54}
            />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              cursor={{ fill: "var(--signal-soft)" }}
              formatter={(value) => [
                formatCompactNumber(Number(value)),
                "Requests",
              ]}
              itemStyle={{ color: "var(--analytics-tooltip-text)" }}
              labelFormatter={(value) =>
                formatBucket(String(value), snapshot.range)
              }
              labelStyle={{ color: "var(--analytics-tooltip-text)" }}
            />
            <Bar
              dataKey="requests"
              fill="var(--signal)"
              isAnimationActive={false}
              maxBarSize={24}
            />
          </BarChart>
        </div>
      </div>

      <div
        className={styles.miniChart}
        data-series="visitors"
        role="img"
        aria-label="Unique visitors by time interval"
      >
        <div className={styles.axisLabel}>
          <strong>Unique visitors</strong>
          <span>per interval</span>
        </div>
        <div className={styles.miniChartPlot}>
          <AreaChart
            accessibilityLayer
            data={snapshot.points}
            margin={{ top: 8, right: 8, bottom: 0, left: 4 }}
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
              tick={{ fill: "var(--analytics-muted)", fontSize: 10 }}
              tickFormatter={(value: string) =>
                formatBucket(value, snapshot.range)
              }
              tickLine={false}
            />
            <YAxis
              axisLine={false}
              tick={{ fill: "var(--analytics-muted)", fontSize: 10 }}
              tickFormatter={formatCompactNumber}
              tickLine={false}
              width={54}
            />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              cursor={TOOLTIP_CURSOR}
              formatter={(value) => [
                formatCompactNumber(Number(value)),
                "Unique visitors",
              ]}
              itemStyle={{ color: "var(--analytics-tooltip-text)" }}
              labelFormatter={(value) =>
                formatBucket(String(value), snapshot.range)
              }
              labelStyle={{ color: "var(--analytics-tooltip-text)" }}
            />
            <Area
              dataKey="visitors"
              fill="var(--analytics-secondary-soft)"
              fillOpacity={1}
              isAnimationActive={false}
              stroke="var(--analytics-secondary)"
              strokeWidth={2.25}
              type="monotone"
            />
          </AreaChart>
        </div>
      </div>
    </div>
  );
}

export function DeliveryMixChart({ snapshot }: { snapshot: TrafficSnapshot }) {
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
      <div className={styles.axisLabel}>
        <strong>Bandwidth</strong>
        <span>per interval</span>
      </div>
      <div className={styles.deliveryChartPlot}>
        <AreaChart
          accessibilityLayer
          data={points}
          margin={{ top: 8, right: 8, bottom: 0, left: 4 }}
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
            tickFormatter={(value: string) =>
              formatBucket(value, snapshot.range)
            }
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
            contentStyle={TOOLTIP_STYLE}
            cursor={TOOLTIP_CURSOR}
            formatter={(value, name) => [
              formatBytes(Number(value)),
              name === "cachedBytes" ? "Cached" : "Uncached",
            ]}
            labelFormatter={(value) =>
              formatBucket(String(value), snapshot.range)
            }
            itemStyle={{ color: "var(--analytics-tooltip-text)" }}
            labelStyle={{ color: "var(--analytics-tooltip-text)" }}
          />
          <Area
            dataKey="cachedBytes"
            fill="var(--signal-soft)"
            fillOpacity={1}
            isAnimationActive={false}
            stackId="delivery"
            stroke="var(--signal)"
            strokeWidth={2}
            type="monotone"
          />
          <Area
            dataKey="uncachedBytes"
            fill="var(--analytics-secondary-soft)"
            fillOpacity={1}
            isAnimationActive={false}
            stackId="delivery"
            stroke="var(--analytics-secondary)"
            strokeWidth={2}
            type="monotone"
          />
        </AreaChart>
      </div>
    </div>
  );
}
