"use client";

import dynamic from "next/dynamic";
import { Github } from "lucide-react";
import { useMemo, useState } from "react";

const GitHubCalendar = dynamic(
  () => import("react-github-calendar").then((module) => module.GitHubCalendar),
  {
    ssr: false,
    loading: () => (
      <div className="github-contributions__loading">
        Loading contribution history…
      </div>
    ),
  },
);

type ContributionPeriod = number | "last";

export function GithubContributions({
  username,
  profileUrl,
  profileLabel,
}: {
  username: string;
  profileUrl: string;
  profileLabel: string;
}) {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<ContributionPeriod>("last");
  const years = useMemo<ContributionPeriod[]>(
    () => [
      "last",
      ...Array.from({ length: 5 }, (_, index) => currentYear - index - 1),
    ],
    [currentYear],
  );

  return (
    <div className="github-contributions">
      <div className="github-contributions__controls">
        <a href={profileUrl} target="_blank" rel="noreferrer">
          <Github aria-hidden="true" />
          <span>{profileLabel}</span>
        </a>
        <label>
          <span>Period</span>
          <select
            aria-label="Contribution period"
            value={selectedYear}
            onChange={(event) => {
              setSelectedYear(
                event.target.value === "last"
                  ? "last"
                  : Number(event.target.value),
              );
            }}
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {year === "last" ? currentYear : year}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="github-contributions__viewport">
        <GitHubCalendar
          username={username}
          year={selectedYear}
          colorScheme="light"
          blockSize={14}
          blockMargin={6}
          blockRadius={0}
          fontSize={12}
          showWeekdayLabels
          weekStart={1}
          theme={{
            light: ["#ebe8df", "#d9e8c9", "#a9ce88", "#6ea74e", "#2d6c31"],
            dark: ["#ebe8df", "#d9e8c9", "#a9ce88", "#6ea74e", "#2d6c31"],
          }}
        />
      </div>
    </div>
  );
}
