import { describe, expect, it } from "vitest";

import {
  FEATURED_WORK_LIMIT,
  getFeaturedWork,
} from "../../lib/portfolio/featured-work";

describe("featured work selection", () => {
  it("keeps the homepage focused on four canonical systems", () => {
    expect(FEATURED_WORK_LIMIT).toBe(4);
    expect(getFeaturedWork(["one", "two", "three", "four"])).toEqual([
      "one",
      "two",
      "three",
      "four",
    ]);
  });
});
