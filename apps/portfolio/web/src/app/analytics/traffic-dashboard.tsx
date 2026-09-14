"use client";

import Link from "next/link";

import {
  TRAFFIC_RANGES,
  type TrafficSnapshot,
} from "@/lib/analytics/cloudflare-traffic";

import styles from "./analytics.module.css";
import {
  formatRange,
  formatUpdatedAt,
  METRICS,
  RANGE_LABELS,
} from "./traffic-dashboard-config";
import {
  DeliveryMixChart,
  TrafficVolumeChart,
} from "./traffic-overview-charts";

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
