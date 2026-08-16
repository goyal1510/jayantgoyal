import { describe, expect, it } from "vitest";

import { calculateScrollProgress } from "./scroll-progress";

describe("calculateScrollProgress", () => {
  it("tracks the document from its start to its end", () => {
    expect(calculateScrollProgress(0, 2000, 1000)).toBe(0);
    expect(calculateScrollProgress(500, 2000, 1000)).toBe(0.5);
    expect(calculateScrollProgress(1000, 2000, 1000)).toBe(1);
  });

  it("clamps overscroll at both boundaries", () => {
    expect(calculateScrollProgress(-100, 2000, 1000)).toBe(0);
    expect(calculateScrollProgress(1200, 2000, 1000)).toBe(1);
  });

  it("stays empty when the page has no scrollable distance", () => {
    expect(calculateScrollProgress(0, 1000, 1000)).toBe(0);
    expect(calculateScrollProgress(0, 800, 1000)).toBe(0);
  });
});
