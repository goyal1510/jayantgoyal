import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  computeLOCStats,
  filterActiveRepositories,
  getLanguageColor,
} from "./compute";

describe("shared GitHub computations", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-18T00:00:00.000Z"));
  });

  afterEach(() => vi.useRealTimers());

  it("filters forks and archived repositories for editorial code stats", () => {
    const repositories = [
      { fork: false, archived: false },
      { fork: true, archived: false },
      { fork: false, archived: true },
    ] as Parameters<typeof filterActiveRepositories>[0];

    expect(filterActiveRepositories(repositories)).toHaveLength(1);
  });

  it("aggregates language bytes deterministically and handles empty sets", () => {
    expect(
      computeLOCStats(
        [{ TypeScript: 4_000, JavaScript: 2_000 }, { TypeScript: 2_000, Astro: 400 }],
        2,
        "2022-01-01T00:00:00.000Z",
      ),
    ).toMatchObject({
      totalLinesOfCode: 210,
      totalRepos: 2,
      totalLanguages: 3,
      topLanguage: "TypeScript",
      yearsOfCoding: 4,
    });
    expect(computeLOCStats([], 0, "2026-07-01T00:00:00.000Z")).toMatchObject({
      totalLinesOfCode: 0,
      totalRepos: 0,
      totalLanguages: 0,
      topLanguage: null,
      yearsOfCoding: 1,
      languageBreakdown: [],
    });
    expect(getLanguageColor("Unknown language")).toBe("#8b8b8b");
  });
});
