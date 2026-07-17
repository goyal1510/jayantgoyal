import { describe, expect, it } from "vitest";

import { safeReturnPath } from "./redirects";

describe("safeReturnPath", () => {
  it("preserves same-origin paths, queries, and fragments", () => {
    expect(safeReturnPath("/activity-tracker/dashboard?day=1#summary")).toBe(
      "/activity-tracker/dashboard?day=1#summary",
    );
  });

  it.each([
    "https://example.com/phishing",
    "//example.com/phishing",
    "/\\example.com/phishing",
    "javascript:alert(1)",
    "dashboard",
    "",
  ])("rejects unsafe or non-relative destination %s", (value) => {
    expect(safeReturnPath(value)).toBe("/");
  });

  it("normalizes the fallback through the same policy", () => {
    expect(safeReturnPath(null, "/welcome?reason=auth")).toBe(
      "/welcome?reason=auth",
    );
    expect(safeReturnPath(null, "https://example.com")).toBe("/");
  });
});
