import { afterAll, describe, expect, it, vi } from "vitest";

import {
  CANONICAL_AUTH_ORIGIN,
  buildAuthLoginUrl,
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
});
