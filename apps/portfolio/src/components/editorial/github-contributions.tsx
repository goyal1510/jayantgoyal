"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";

const GitHubCalendar = dynamic(
  () => import("react-github-calendar").then((module) => module.GitHubCalendar),
  {
    ssr: false,
    loading: () => (
      <div className="contribution-calendar__loading">
        Loading contribution history…
      </div>
    ),
  },
);

export function GithubContributions({ username }: { username: string }) {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number | "last">("last");
  const years = useMemo(() => {
    const options: Array<number | "last"> = ["last"];
    for (let year = currentYear; year >= 2025; year -= 1) options.push(year);
    return options;
  }, [currentYear]);

  return (
    <div className="contribution-calendar">
      <div className="contribution-calendar__controls">
        <span>Contribution map</span>
        <label>
          <span>Period</span>
          <select
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
                {year === "last" ? "Last year" : year}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="contribution-calendar__viewport">
        <GitHubCalendar
          username={username}
          year={selectedYear}
          colorScheme="light"
          blockSize={13}
          blockMargin={5}
          fontSize={12}
          showWeekdayLabels
          weekStart={1}
          theme={{
            light: ["#e5dfd4", "#ffc9bb", "#ff9b83", "#ff6848", "#b92e17"],
            dark: ["#e5dfd4", "#ffc9bb", "#ff9b83", "#ff6848", "#b92e17"],
          }}
        />
      </div>
    </div>
  );
}
