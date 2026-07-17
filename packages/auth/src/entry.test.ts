import { afterAll, describe, expect, it, vi } from "vitest";

import {
  CANONICAL_AUTH_ORIGIN,
  buildAuthAccountSecurityUrl,
  buildAuthLoginUrl,
  buildAuthLogoutUrl,
  resolveAuthApplicationOrigin,
  resolveAuthFlowOwner,
} from "./entry";

afterAll(() => {
  vi.unstubAllEnvs();
});

describe("canonical Auth entry ownership", () => {
  it("keeps the current application as the default and rollback owner", () => {
    vi.stubEnv("NEXT_PUBLIC_AUTH_FLOW_OWNER", "");
    expect(resolveAuthFlowOwner()).toBe("legacy");
    expect(resolveAuthFlowOwner("unknown")).toBe("legacy");
  });

  it("enables Auth only through the exact rollout value", () => {
    expect(resolveAuthFlowOwner("auth")).toBe("auth");
  });

  it("accepts only the canonical or approved local Auth origins", () => {
    expect(resolveAuthApplicationOrigin()).toBe(CANONICAL_AUTH_ORIGIN);
    expect(resolveAuthApplicationOrigin("http://localhost:3003")).toBe(
      "http://localhost:3003",
    );
    expect(resolveAuthApplicationOrigin("https://evil.example")).toBe(
      CANONICAL_AUTH_ORIGIN,
    );
    expect(
      resolveAuthApplicationOrigin(
        "https://auth.jayantgoyal.com.evil.example",
      ),
    ).toBe(CANONICAL_AUTH_ORIGIN);
  });

  it("builds an exact cross-application return destination", () => {
    const login = buildAuthLoginUrl({
      requestUrl: "https://studio.jayantgoyal.com/welcome",
      returnPath: "/files?folder=one",
    });

    expect(login.origin).toBe(CANONICAL_AUTH_ORIGIN);
    expect(login.pathname).toBe("/login");
    expect(login.searchParams.get("return_to")).toBe(
      "https://studio.jayantgoyal.com/files?folder=one",
    );
  });

  it("rejects external and protocol-relative return destinations", () => {
    const login = buildAuthLoginUrl({
      requestUrl: "https://admin.jayantgoyal.com/welcome",
      returnPath: "//evil.example/phish",
    });

    expect(login.searchParams.get("return_to")).toBe(
      "https://admin.jayantgoyal.com/",
    );
  });

  it("preserves the exact application context for account security", () => {
    const settings = buildAuthAccountSecurityUrl({
      requestUrl: "https://admin.jayantgoyal.com/users?role=admin#active",
    });

    expect(settings.toString()).toBe(
      "https://auth.jayantgoyal.com/account/security?return_to=https%3A%2F%2Fadmin.jayantgoyal.com%2Fusers%3Frole%3Dadmin%23active",
    );
  });

  it("preserves the exact application context for canonical logout", () => {
    const logout = buildAuthLogoutUrl({
      requestUrl: "http://localhost:3001/files?folder=one",
      authOrigin: "http://localhost:3003",
    });

    expect(logout.toString()).toBe(
      "http://localhost:3003/logout?return_to=http%3A%2F%2Flocalhost%3A3001%2Ffiles%3Ffolder%3Done",
    );
  });
});
