import { NextRequest } from "next/server";
import { readFileSync } from "node:fs";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

import studioProxy from "./proxy";

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_AUTH_FLOW_OWNER", "legacy");
  vi.stubEnv("NEXT_PUBLIC_AUTH_URL", "https://auth.jayantgoyal.com");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");
});

afterAll(() => {
  vi.unstubAllEnvs();
});

describe("Studio Auth entry cutover", () => {
  it("switches account navigation through the shared owner contract", () => {
    const navUser = readFileSync(
      new URL("./components/sidebar/nav-user.tsx", import.meta.url),
      "utf8",
    );

    expect(navUser).toContain("resolveAuthFlowOwner");
    expect(navUser).toContain("buildAuthAccountSecurityUrl");
    expect(navUser).toContain("buildAuthLogoutUrl");
    expect(navUser).toMatch(/authOwnsNavigation\s*\?\s*undefined/);
  });

  it("keeps the protected layout on the shared session-cookie contract", () => {
    const layout = readFileSync(
      new URL("./app/(protected)/layout.tsx", import.meta.url),
      "utf8",
    );

    expect(layout).toContain("hasAuthSessionCookie");
    expect(layout).toContain("resolveAuthSessionMode");
    expect(layout).not.toContain("sb-${projectRef}-auth-token");
  });

  it("keeps the local welcome route in rollback mode", async () => {
    const response = await studioProxy(
      new NextRequest("https://studio.jayantgoyal.com/welcome?redirect=%2Ffiles"),
    );

    expect(response.headers.get("location")).toBeNull();
  });

  it("routes login entry to Auth with an exact Studio return target", async () => {
    vi.stubEnv("NEXT_PUBLIC_AUTH_FLOW_OWNER", "auth");

    const response = await studioProxy(
      new NextRequest("https://studio.jayantgoyal.com/welcome?redirect=%2Ffiles"),
    );

    expect(response.headers.get("location")).toBe(
      "https://auth.jayantgoyal.com/login?return_to=https%3A%2F%2Fstudio.jayantgoyal.com%2Ffiles",
    );
  });
});
