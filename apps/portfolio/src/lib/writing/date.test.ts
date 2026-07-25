import { describe, expect, it } from "vitest";

import { formatEditorialDate } from "./date";

describe("formatEditorialDate", () => {
  it("uses UTC for timestamps near a local calendar-day boundary", () => {
    expect(formatEditorialDate("2026-07-18T23:30:00.000Z")).toBe(
      "18 July 2026",
    );
    expect(formatEditorialDate("2026-07-18T23:30:00.000Z", "short")).toBe(
      "18 Jul 2026",
    );
  });

  it("returns null when no timestamp is available", () => {
    expect(formatEditorialDate(null)).toBeNull();
  });
});
