import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { computeLOCStats } from "./compute";

describe("editorial GitHub code statistics", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-18T00:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("aggregates repository language bytes into stable portfolio metrics", () => {
    const result = computeLOCStats(
      [
        { TypeScript: 4_000, JavaScript: 2_000 },
        { TypeScript: 2_000, Astro: 400 },
      ],
      2,
      "2022-01-01T00:00:00.000Z",
    );

    expect(result).toMatchObject({
      totalLinesOfCode: 210,
      totalRepos: 2,
      totalLanguages: 3,
      topLanguage: "TypeScript",
      yearsOfCoding: 4,
    });
    expect(result.languageBreakdown.map((language) => language.name)).toEqual([
      "TypeScript",
      "JavaScript",
      "Astro",
    ]);
    expect(result.languageBreakdown[0]).toMatchObject({
      lines: 150,
      color: "#3178c6",
    });
    expect(result.languageBreakdown[2]?.color).toBe("#8b8b8b");
  });

  it("returns a safe empty state when repositories report no languages", () => {
    expect(computeLOCStats([], 0, "2026-07-01T00:00:00.000Z")).toEqual({
      totalLinesOfCode: 0,
      totalRepos: 0,
      totalLanguages: 0,
      topLanguage: null,
      yearsOfCoding: 1,
      languageBreakdown: [],
    });
  });
});
