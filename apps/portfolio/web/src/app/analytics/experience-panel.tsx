"use client";

import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  getWebVitalRating,
  WEB_VITAL_THRESHOLDS,
  type WebVitalKey,
  type WebVitalsResult,
  type WebVitalsSnapshot,
} from "@/lib/analytics/cloudflare-rum";

import styles from "./analytics-panels.module.css";
import detailStyles from "./experience-detail.module.css";
import {
  formatCompactSamples,
  formatExperienceBucket,
  RATING_LABELS,
  VITALS,
  type VitalDefinition,
} from "./experience-config";
import sectionStyles from "./analytics-section.module.css";

function VitalTrend({
  snapshot,
  vital,
}: {
  snapshot: WebVitalsSnapshot;
  vital: VitalDefinition;
}) {
  const thresholds = WEB_VITAL_THRESHOLDS[vital.key];
  return (
    <div
      className={styles.vitalTrend}
      role="img"
      aria-label={`${vital.name} 75th percentile trend with quality thresholds`}
    >
      <LineChart
        accessibilityLayer
        data={snapshot.points}
        margin={{ top: 22, right: 18, bottom: 0, left: 8 }}
        responsive
        style={{ width: "100%", height: "100%" }}
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
          tick={{ fill: "var(--analytics-muted)", fontSize: 11 }}
          tickFormatter={(value: string) =>
            formatExperienceBucket(value, snapshot)
          }
          tickLine={false}
        />
        <YAxis
          axisLine={false}
          domain={[0, "auto"]}
          tick={{ fill: "var(--analytics-muted)", fontSize: 11 }}
          tickFormatter={(value: number) => vital.format(value)}
          tickLine={false}
          width={64}
        />
        <ReferenceLine
          label={{
            value: "Good target",
            fill: "var(--analytics-muted)",
            fontSize: 10,
          }}
          stroke="var(--rating-good)"
          strokeDasharray="5 4"
          y={thresholds.good}
        />
        <ReferenceLine
          label={{
            value: "Poor",
            fill: "var(--analytics-muted)",
            fontSize: 10,
          }}
          stroke="var(--rating-poor)"
          strokeDasharray="3 5"
          y={thresholds.poor}
        />
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
          labelFormatter={(value) =>
            formatExperienceBucket(String(value), snapshot)
          }
        />
        <Line
          connectNulls
          dataKey={vital.key}
          dot={{ fill: "var(--paper-bright)", r: 3, strokeWidth: 2 }}
          isAnimationActive={false}
          stroke="var(--signal)"
          strokeWidth={2.5}
          type="monotone"
        />
      </LineChart>
    </div>
  );
}

function DistributionChart({
  snapshot,
  vital,
}: {
  snapshot: WebVitalsSnapshot;
  vital: VitalDefinition;
}) {
  const distribution = snapshot.distributions[vital.key];
  const total = distribution.total || 1;
  const data = [
    {
      name: vital.label,
      good: (distribution.good / total) * 100,
      needsImprovement: (distribution.needsImprovement / total) * 100,
      poor: (distribution.poor / total) * 100,
    },
  ];

  return (
    <div className={detailStyles.distributionChart}>
      <BarChart
        accessibilityLayer
        data={data}
        layout="vertical"
        margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
        responsive
        style={{ width: "100%", height: "100%" }}
      >
        <XAxis hide domain={[0, 100]} type="number" />
        <YAxis hide dataKey="name" type="category" />
        <Tooltip
          contentStyle={{
            background: "var(--analytics-tooltip)",
            border: 0,
            borderRadius: 0,
            color: "var(--paper-bright)",
            fontSize: 12,
          }}
          formatter={(value, name) => [
            `${Number(value).toFixed(1)}%`,
            String(name)
              .replace(/([A-Z])/g, " $1")
              .trim(),
          ]}
        />
        <Bar
          dataKey="good"
          fill="var(--rating-good)"
          isAnimationActive={false}
          stackId="rating"
        />
        <Bar
          dataKey="needsImprovement"
          fill="var(--rating-needs)"
          isAnimationActive={false}
          stackId="rating"
        />
        <Bar
          dataKey="poor"
          fill="var(--rating-poor)"
          isAnimationActive={false}
          stackId="rating"
        />
      </BarChart>
    </div>
  );
}

export function ExperiencePanel({ result }: { result: WebVitalsResult }) {
  const [selectedKey, setSelectedKey] = useState<WebVitalKey>("lcp");
  const selectedVital =
    VITALS.find((vital) => vital.key === selectedKey) ?? VITALS[0]!;

  return (
    <section
      className={sectionStyles.section}
      aria-labelledby="experience-heading"
    >
      <div className={sectionStyles.sectionHeading}>
        <div>
          <span className={sectionStyles.kicker}>Real user experience</span>
          <h2 id="experience-heading">How the site feels</h2>
        </div>
        <p>
          P75 means three out of four measured visits were this fast or faster;
          the slowest quarter took longer. Select a metric to compare its live
          trend with the recommended target.
        </p>
      </div>

      {result.ok ? (
        <>
          <div className={styles.vitalSelector}>
            {VITALS.map((vital) => {
              const value = result.snapshot.totals[vital.key];
              const rating = getWebVitalRating(vital.key, value);
              return (
                <button
                  aria-pressed={vital.key === selectedKey}
                  className={styles.vitalCard}
                  data-rating={rating}
                  key={vital.key}
                  onClick={() => setSelectedKey(vital.key)}
                  type="button"
                >
                  <span>{vital.name}</span>
                  <strong>{vital.format(value)}</strong>
                  <small>{RATING_LABELS[rating]}</small>
                </button>
              );
            })}
          </div>

          <div className={styles.vitalExplorer}>
            <div className={styles.vitalExplorerHeading}>
              <div>
                <span>{selectedVital.label} · P75 trend</span>
                <h3>{selectedVital.name}</h3>
                <p>{selectedVital.description}</p>
              </div>
              <div className={styles.vitalTarget}>
                <span>Good target</span>
                <strong>
                  ≤{" "}
                  {selectedVital.format(
                    WEB_VITAL_THRESHOLDS[selectedVital.key].good,
                  )}
                </strong>
              </div>
            </div>
            <VitalTrend snapshot={result.snapshot} vital={selectedVital} />
            <div className={detailStyles.distributionRow}>
              <div>
                <span>Measured experience mix</span>
                <strong>
                  {formatCompactSamples(
                    result.snapshot.distributions[selectedVital.key].total,
                  )}{" "}
                  samples
                </strong>
              </div>
              <DistributionChart
                snapshot={result.snapshot}
                vital={selectedVital}
              />
              <div className={detailStyles.ratingLegend} aria-hidden="true">
                <span data-rating="good">Good</span>
                <span data-rating="needs-improvement">Needs improvement</span>
                <span data-rating="poor">Poor</span>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className={detailStyles.pendingPanel}>
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
