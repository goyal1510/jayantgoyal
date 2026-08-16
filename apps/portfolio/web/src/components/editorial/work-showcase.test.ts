import { describe, expect, it } from "vitest";

import { getFeaturedWork } from "../../lib/portfolio/featured-work";

describe("featured work selection", () => {
  it("keeps the homepage focused on four canonical systems", () => {
    expect(getFeaturedWork(["one", "two", "three", "four"])).toEqual([
      "one",
      "two",
      "three",
      "four",
    ]);
  });
});
