import { describe, expect, it, vi } from "vitest";

import {
  fetchGitHubContributionCalendar,
  normaliseContributionCalendar,
  resolveContributionPeriod,
} from "./contributions";

describe("Portfolio GitHub contributions", () => {
  const now = new Date("2026-08-12T10:30:00.000Z");

  it("resolves rolling and fixed contribution periods", () => {
    const rolling = resolveContributionPeriod("last", now);
    const fixed = resolveContributionPeriod("2025", now);

    expect(rolling).toMatchObject({
      period: "last",
      periodLabel: "in the last year",
      to: now,
    });
    expect(rolling?.from.toISOString()).toBe("2025-08-12T10:30:00.000Z");
    expect(fixed).toMatchObject({
      period: 2025,
      periodLabel: "in 2025",
    });
    expect(fixed?.from.toISOString()).toBe("2025-01-01T00:00:00.000Z");
    expect(fixed?.to.toISOString()).toBe("2025-12-31T23:59:59.999Z");
    expect(resolveContributionPeriod("2030", now)).toBeNull();
    expect(resolveContributionPeriod("invalid", now)).toBeNull();
  });

  it("maps GitHub contribution levels to calendar activity levels", () => {
    const result = normaliseContributionCalendar(
      {
        totalContributions: 7,
        weeks: [
          {
            contributionDays: [
              {
                contributionCount: 0,
                contributionLevel: "NONE",
                date: "2026-08-10",
              },
              {
                contributionCount: 7,
                contributionLevel: "FOURTH_QUARTILE",
                date: "2026-08-11",
              },
            ],
          },
        ],
      },
      "last",
      "in the last year",
    );

    expect(result.activities).toEqual([
      { count: 0, date: "2026-08-10", level: 0 },
      { count: 7, date: "2026-08-11", level: 4 },
    ]);
    expect(result.totalContributions).toBe(7);
  });

  it("requests contribution data through GitHub GraphQL with a server token", async () => {
    const fetcher = vi.fn<typeof fetch>(async () =>
      Response.json({
        data: {
          user: {
            contributionsCollection: {
              contributionCalendar: {
                totalContributions: 2,
                weeks: [
                  {
                    contributionDays: [
                      {
                        contributionCount: 2,
                        contributionLevel: "SECOND_QUARTILE",
                        date: "2025-01-01",
                      },
                    ],
                  },
                ],
              },
            },
          },
        },
      }),
    );

    const result = await fetchGitHubContributionCalendar({
      fetcher,
      from: new Date("2025-01-01T00:00:00.000Z"),
      period: 2025,
      periodLabel: "in 2025",
      to: new Date("2025-12-31T23:59:59.999Z"),
      token: "test-token",
      username: "goyal1510",
    });

    expect(fetcher).toHaveBeenCalledOnce();
    const [url, init] = fetcher.mock.calls[0] ?? [];
    expect(url).toBe("https://api.github.com/graphql");
    expect(new Headers(init?.headers).get("Authorization")).toBe(
      "Bearer test-token",
    );
    expect(result.activities[0]).toEqual({
      count: 2,
      date: "2025-01-01",
      level: 2,
    });
  });
});
