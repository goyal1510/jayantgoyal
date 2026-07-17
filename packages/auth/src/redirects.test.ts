import { describe, expect, it } from "vitest";

import { safeReturnPath, safeReturnTarget } from "./redirects";

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

describe("safeReturnTarget", () => {
  const options = {
    requestOrigin: "https://auth.jayantgoyal.com",
    allowedOrigins: [
      "https://studio.jayantgoyal.com",
      "https://admin.jayantgoyal.com",
    ],
  } as const;

  it("keeps application-local destinations relative", () => {
    expect(
      safeReturnTarget(
        "https://auth.jayantgoyal.com/account/security?changed=true",
        options,
      ),
    ).toBe("/account/security?changed=true");
  });

  it("allows exact platform origins", () => {
    expect(
      safeReturnTarget(
        "https://studio.jayantgoyal.com/files?folder=one#recent",
        options,
      ),
    ).toBe("https://studio.jayantgoyal.com/files?folder=one#recent");
  });

  it.each([
    "https://evil.example/phish",
    "https://studio.jayantgoyal.com.evil.example/phish",
    "https://user@studio.jayantgoyal.com/phish",
    "javascript:alert(1)",
    "//evil.example/phish",
    "/\\evil.example/phish",
  ])("rejects unsafe destination %s", (value) => {
    expect(safeReturnTarget(value, options)).toBe("/");
  });
});
