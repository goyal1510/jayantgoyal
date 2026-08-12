"use client";

import { Github } from "lucide-react";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";

import type { ContributionCalendarData } from "@/lib/github/contributions";

const ActivityCalendar = dynamic(
  () =>
    import("react-activity-calendar").then((module) => module.ActivityCalendar),
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

type ContributionResponse =
  | ({ available: true } & ContributionCalendarData)
  | {
      available: false;
      period: ContributionPeriod;
      periodLabel: string;
    };

function isContributionResponse(value: unknown): value is ContributionResponse {
  if (!value || typeof value !== "object") return false;

  const candidate = value as Partial<ContributionResponse>;
  if (candidate.available === false) return true;

  return (
    candidate.available === true &&
    Array.isArray(candidate.activities) &&
    typeof candidate.totalContributions === "number" &&
    typeof candidate.periodLabel === "string"
  );
}

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
  const [calendar, setCalendar] = useState<ContributionCalendarData | null>(
    null,
  );
  const [status, setStatus] = useState<"loading" | "ready" | "unavailable">(
    "loading",
  );
  const years = useMemo<ContributionPeriod[]>(
    () => [
      "last",
      ...Array.from({ length: 5 }, (_, index) => currentYear - index - 1),
    ],
    [currentYear],
  );

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      setStatus("loading");

      try {
        const response = await fetch(
          `/api/github-contributions?username=${encodeURIComponent(username)}&period=${selectedYear}`,
          { signal: controller.signal },
        );
        const data: unknown = await response.json();

        if (!response.ok || !isContributionResponse(data)) {
          throw new Error("Invalid GitHub contribution response");
        }

        if (!data.available) {
          setCalendar(null);
          setStatus("unavailable");
          return;
        }

        setCalendar(data);
        setStatus("ready");
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        setCalendar(null);
        setStatus("unavailable");
      }
    }

    void load();
    return () => controller.abort();
  }, [selectedYear, username]);

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
        {status === "loading" ? (
          <div className="github-contributions__loading" aria-live="polite">
            Loading contribution history…
          </div>
        ) : null}
        {status === "unavailable" ? (
          <div className="github-contributions__loading" aria-live="polite">
            Contribution history is temporarily unavailable.
          </div>
        ) : null}
        {status === "ready" && calendar ? (
          <ActivityCalendar
            data={calendar.activities}
            colorScheme="light"
            blockSize={14}
            blockMargin={6}
            blockRadius={0}
            fontSize={12}
            labels={{
              totalCount: `${calendar.totalContributions} contributions ${calendar.periodLabel}`,
            }}
            showWeekdayLabels
            weekStart={1}
            theme={{
              light: ["#ebe8df", "#d9e8c9", "#a9ce88", "#6ea74e", "#2d6c31"],
              dark: ["#ebe8df", "#d9e8c9", "#a9ce88", "#6ea74e", "#2d6c31"],
            }}
          />
        ) : null}
      </div>
    </div>
  );
}
