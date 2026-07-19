"use client";

import { useEffect, useState } from "react";

import type { GitHubLOCStats } from "@repo/github";

function compact(value: number) {
  return new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function GithubCodeStats({
  username,
  initialStats,
}: {
  username: string;
  initialStats: GitHubLOCStats | null;
}) {
  const [stats, setStats] = useState(initialStats);
  const [loading, setLoading] = useState(!initialStats);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    if (initialStats) return;
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch(
          `/api/github-loc?username=${encodeURIComponent(username)}`,
        );
        if (!response.ok) throw new Error("GitHub request failed");
        const data = (await response.json()) as GitHubLOCStats;
        if (!cancelled) setStats(data);
      } catch {
        if (!cancelled) setUnavailable(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [initialStats, username]);

  if (loading) {
    return (
      <div className="github-code-stats__status">
        Computing repository data…
      </div>
    );
  }
  if (!stats || unavailable) {
    return (
      <div className="github-code-stats__status">
        Live repository statistics are temporarily unavailable.
      </div>
    );
  }

  const metrics = [
    { value: compact(stats.totalLinesOfCode), label: "estimated lines" },
    { value: String(stats.totalRepos), label: "active repositories" },
    { value: String(stats.totalLanguages), label: "languages" },
    { value: stats.topLanguage ?? "—", label: "top language" },
    { value: `${stats.yearsOfCoding}+`, label: "years on GitHub" },
  ];
  const visibleLanguages = stats.languageBreakdown.slice(0, 6);
  const otherPercentage = Math.max(
    0,
    100 -
      visibleLanguages.reduce(
        (total, language) => total + language.percentage,
        0,
      ),
  );

  return (
    <div className="github-code-stats">
      <div className="github-code-stats__metrics">
        {metrics.map((metric) => (
          <div key={metric.label}>
            <strong>{metric.value}</strong>
            <span>{metric.label}</span>
          </div>
        ))}
      </div>
      <div className="github-code-stats__languages">
        <div
          className="github-code-stats__bar"
          aria-label="Language distribution"
        >
          {visibleLanguages.map((language) => (
            <span
              key={language.name}
              style={{
                width: `${language.percentage}%`,
                backgroundColor: language.color,
              }}
              title={`${language.name}: ${language.percentage.toFixed(1)}%`}
            />
          ))}
          {otherPercentage > 0.05 ? (
            <span
              style={{
                width: `${otherPercentage}%`,
                backgroundColor: "#8b8b8b",
              }}
              title={`Other: ${otherPercentage.toFixed(1)}%`}
            />
          ) : null}
        </div>
        <div className="github-code-stats__legend">
          {visibleLanguages.map((language) => (
            <span key={language.name}>
              <i style={{ backgroundColor: language.color }} />
              {language.name} {language.percentage.toFixed(1)}%
            </span>
          ))}
          {otherPercentage > 0.05 ? (
            <span>
              <i style={{ backgroundColor: "#8b8b8b" }} />
              Other {otherPercentage.toFixed(1)}%
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
