import { describe, expect, it } from "vitest";

import {
  hasRecentSignIn,
  isProtectedAuthPath,
  requiresAccountMfaStepUp,
} from "./policy";

describe("Auth route policy", () => {
  it.each([
    "/account",
    "/account/security",
    "/account/providers",
    "/logout",
    "/mfa",
  ])("protects %s", (pathname) =>
    expect(isProtectedAuthPath(pathname)).toBe(true),
  );

  it.each([
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/verify",
    "/callback",
    "/error",
  ])("keeps recovery and entry path %s reachable", (pathname) =>
    expect(isProtectedAuthPath(pathname)).toBe(false),
  );

  it("requires AAL2 for account mutations when an enrolled factor can raise assurance", () => {
    expect(
      requiresAccountMfaStepUp({
        pathname: "/account/security",
        hasUser: true,
        currentLevel: "aal1",
        nextLevel: "aal2",
      }),
    ).toBe(true);
    expect(
      requiresAccountMfaStepUp({
        pathname: "/account/security",
        hasUser: true,
        currentLevel: "aal2",
        nextLevel: "aal2",
      }),
    ).toBe(false);
  });

  it("accepts only a bounded recent sign-in", () => {
    const now = Date.parse("2026-07-17T12:00:00.000Z");
    expect(hasRecentSignIn("2026-07-17T11:55:00.000Z", now)).toBe(true);
    expect(hasRecentSignIn("2026-07-17T11:40:00.000Z", now)).toBe(false);
    expect(hasRecentSignIn("invalid", now)).toBe(false);
  });
});
