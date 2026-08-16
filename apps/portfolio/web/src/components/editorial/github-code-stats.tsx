"use client";

import { useEffect, useState } from "react";

import type { GitHubLOCStats } from "@jayantgoyal/github";

function compact(value: number) {
  return new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function isGitHubLOCStats(value: unknown): value is GitHubLOCStats {
  if (!value || typeof value !== "object") return false;

  const candidate = value as Partial<GitHubLOCStats>;
  return (
    typeof candidate.totalLinesOfCode === "number" &&
    typeof candidate.totalRepos === "number" &&
    typeof candidate.totalLanguages === "number" &&
    typeof candidate.yearsOfCoding === "number" &&
    Array.isArray(candidate.languageBreakdown)
  );
}

export function GithubCodeStats({ username }: { username: string }) {
  const [stats, setStats] = useState<GitHubLOCStats | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "unavailable">(
    "loading",
  );

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      setStatus("loading");

      try {
        let data: unknown;

        for (let attempt = 0; attempt < 2; attempt += 1) {
          const response = await fetch(
            `/api/github-loc?username=${encodeURIComponent(username)}`,
            { signal: controller.signal },
          );

          if (response.ok) {
            data = await response.json();
            break;
          }

          if (response.status < 500 || attempt === 1) {
            throw new Error("GitHub request failed");
          }

          await new Promise((resolve) => window.setTimeout(resolve, 800));
        }

        if (!isGitHubLOCStats(data)) throw new Error("Invalid GitHub response");

        setStats(data);
        setStatus("ready");
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError")
          return;
        setStatus("unavailable");
      }
    }

    void load();
    return () => controller.abort();
  }, [username]);

  if (status === "loading") {
    return (
      <div className="github-code-stats__status" aria-live="polite">
        Computing live repository data…
      </div>
    );
  }

  if (!stats || status === "unavailable") {
    return (
      <div className="github-code-stats__status" aria-live="polite">
        Live repository statistics are temporarily unavailable. The contribution
        map and GitHub profile remain accessible.
      </div>
    );
  }

  const metrics = [
    { value: compact(stats.totalLinesOfCode), label: "estimated lines" },
    { value: String(stats.totalRepos), label: "active repositories" },
    { value: String(stats.totalLanguages), label: "languages" },
    { value: stats.topLanguage ?? "—", label: "primary language" },
    { value: `${stats.yearsOfCoding}+`, label: "years coding" },
  ];
  const visibleLanguages = stats.languageBreakdown.slice(0, 6);
  const visiblePercentage = visibleLanguages.reduce(
    (total, language) => total + language.percentage,
    0,
  );
  const otherPercentage = Math.max(0, 100 - visiblePercentage);

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

      {visibleLanguages.length > 0 ? (
        <div className="github-code-stats__languages">
          <div
            className="github-code-stats__bar"
            role="img"
            aria-label="Language distribution across active public repositories"
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
          <p className="github-code-stats__note">
            Public, non-fork, non-archived repositories. Line totals are
            estimates derived from GitHub language bytes.
          </p>
        </div>
      ) : null}
    </div>
  );
}
