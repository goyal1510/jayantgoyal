import { NextRequest } from "next/server";
import { existsSync, readFileSync } from "node:fs";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

const { createRequestClientMock } = vi.hoisted(() => ({
  createRequestClientMock: vi.fn(),
}));

vi.mock("@jayantgoyal/web-auth/server", async () => {
  const actual = await vi.importActual<
    typeof import("@jayantgoyal/web-auth/server")
  >("@jayantgoyal/web-auth/server");
  return {
    ...actual,
    createSupabaseRequestClient: createRequestClientMock,
  };
});

import { GET as authCallback } from "./app/auth/callback/route";
import buildRobotsPolicy from "./app/robots";
import adminProxy from "./proxy";

type SupabaseScenario = {
  user?: { id: string } | null;
  access?: "none" | "viewer" | "full_access";
  currentLevel?: "aal1" | "aal2";
  nextLevel?: "aal1" | "aal2";
  hasVerifiedFactor?: boolean;
  exchangeError?: Error | null;
};

function useSupabaseScenario({
  user = { id: "test-user" },
  access = "full_access",
  currentLevel = "aal2",
  nextLevel = "aal2",
  hasVerifiedFactor = false,
  exchangeError = null,
}: SupabaseScenario = {}) {
  const supabase = {
    auth: {
      exchangeCodeForSession: vi
        .fn()
        .mockResolvedValue({ data: {}, error: exchangeError }),
      getUser: vi.fn().mockResolvedValue({ data: { user } }),
      mfa: {
        getAuthenticatorAssuranceLevel: vi.fn().mockResolvedValue({
          data: { currentLevel, nextLevel },
        }),
        listFactors: vi.fn().mockResolvedValue({
          data: {
            totp: hasVerifiedFactor
              ? [{ id: "test-factor", status: "verified" }]
              : [],
          },
        }),
      },
    },
    schema: vi.fn(() => ({
      rpc: vi.fn((name: string, params: { p_capability_key?: string }) => {
        if (name !== "has_capability") {
          return Promise.resolve({ data: false, error: null });
        }
        const capability = params.p_capability_key;
        const allowed =
          access === "full_access" ||
          (access === "viewer" && capability === "admin.console.enter");
        return Promise.resolve({ data: allowed, error: null });
      }),
    })),
  };

  createRequestClientMock.mockImplementation(
    ({ responseCookies, responseHeaders }) => {
      responseCookies.set("session-cookie", "refreshed", { path: "/" });
      responseHeaders.set("Cache-Control", "private, no-store");
      return supabase;
    },
  );

  return supabase;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test-project.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "synthetic-anon-key");
  vi.stubEnv("NEXT_PUBLIC_AUTH_URL", "https://auth.jayantgoyal.com");
});

afterAll(() => {
  vi.unstubAllEnvs();
});

describe("Admin Proxy authentication contract", () => {
  it("serves the crawler policy without authentication", async () => {
    const response = await adminProxy(
      new NextRequest("https://admin.jayantgoyal.com/robots.txt"),
    );

    expect(response.headers.get("location")).toBeNull();
    expect(createRequestClientMock).not.toHaveBeenCalled();
    expect(buildRobotsPolicy()).toEqual({
      rules: { userAgent: "*", disallow: "/" },
    });
  });

  it("switches account navigation through the shared owner contract", () => {
    const topbar = readFileSync(
      new URL("./components/header/topbar-user-menu.tsx", import.meta.url),
      "utf8",
    );
    expect(topbar).toContain("buildAuthAccountSecurityUrl");
    expect(topbar).toContain("buildAuthLogoutUrl");
    expect(topbar).not.toContain("AccountSettingsSheet");
    expect(
      existsSync(new URL("./components/sidebar/nav-user.tsx", import.meta.url)),
    ).toBe(false);
  });

  it("keeps duplicated account and MFA implementations removed", () => {
    expect(
      existsSync(
        new URL(
          "./components/sidebar/account-settings-sheet.tsx",
          import.meta.url,
        ),
      ),
    ).toBe(false);
    expect(
      existsSync(
        new URL("./components/auth/mfa-settings-section.tsx", import.meta.url),
      ),
    ).toBe(false);
    expect(
      existsSync(
        new URL("./app/api/account/mfa-cleanup/route.ts", import.meta.url),
      ),
    ).toBe(false);
    expect(
      existsSync(new URL("./app/api/account/delete/route.ts", import.meta.url)),
    ).toBe(true);
    expect(
      existsSync(
        new URL("./components/auth/mfa-verify-step.tsx", import.meta.url),
      ),
    ).toBe(false);
    const welcomePage = readFileSync(
      new URL("./app/welcome/page.tsx", import.meta.url),
      "utf8",
    );
    const mfaPage = readFileSync(
      new URL("./app/mfa-verify/page.tsx", import.meta.url),
      "utf8",
    );
    expect(welcomePage).toContain("buildAuthLoginUrl");
    expect(welcomePage).not.toContain("signInWithPassword");
    expect(mfaPage).toContain("buildAuthMfaUrl");
  });

  it("routes login entry to Auth unconditionally", async () => {
    const response = await adminProxy(
      new NextRequest(
        "https://admin.jayantgoyal.com/welcome?redirect=%2Fdeployments",
      ),
    );

    expect(response.headers.get("location")).toBe(
      "https://auth.jayantgoyal.com/welcome?return_to=https%3A%2F%2Fadmin.jayantgoyal.com%2Fdeployments",
    );
    expect(createRequestClientMock).not.toHaveBeenCalled();
  });

  it("redirects an anonymous protected request and keeps refresh state", async () => {
    useSupabaseScenario({ user: null });

    const response = await adminProxy(
      new NextRequest("https://admin.jayantgoyal.com/portfolio/hero"),
    );

    expect(response.headers.get("location")).toBe(
      "https://auth.jayantgoyal.com/welcome?return_to=https%3A%2F%2Fadmin.jayantgoyal.com%2Fportfolio%2Fhero",
    );
    expect(response.cookies.get("session-cookie")?.value).toBe("refreshed");
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  });

  it("denies a signed-in non-admin without losing refresh state", async () => {
    useSupabaseScenario({ access: "none" });

    const response = await adminProxy(
      new NextRequest("https://admin.example.test/users"),
    );

    expect(response.headers.get("location")).toBe(
      "https://admin.example.test/unauthorized",
    );
    expect(response.cookies.get("session-cookie")?.value).toBe("refreshed");
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  });

  it("allows a viewer and exposes only the verified access header", async () => {
    useSupabaseScenario({ access: "viewer" });

    const response = await adminProxy(
      new NextRequest("https://admin.example.test/users"),
    );

    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get("x-auth-status")).toBe("authed");
    expect(response.headers.get("x-user-access")).toBe("viewer");
  });

  it("steps an AAL1 user with a verified factor up to MFA", async () => {
    useSupabaseScenario({
      currentLevel: "aal1",
      nextLevel: "aal2",
      hasVerifiedFactor: true,
    });

    const response = await adminProxy(
      new NextRequest("https://admin.jayantgoyal.com/users"),
    );

    expect(response.headers.get("location")).toBe(
      "https://auth.jayantgoyal.com/mfa?return_to=https%3A%2F%2Fadmin.jayantgoyal.com%2Fusers",
    );
    expect(response.cookies.get("session-cookie")?.value).toBe("refreshed");
  });
});

describe("Admin callback contract", () => {
  it("returns a local error destination and keeps auth response state", async () => {
    useSupabaseScenario({ exchangeError: new Error("invalid code") });

    const response = await authCallback(
      new NextRequest(
        "https://admin.example.test/auth/callback?code=bad&next=https://evil.example",
      ),
    );

    expect(response.headers.get("location")).toBe(
      "https://admin.example.test/welcome?error=auth",
    );
    expect(response.cookies.get("session-cookie")?.value).toBe("refreshed");
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  });

  it("normalizes an external success destination before MFA", async () => {
    useSupabaseScenario();

    const response = await authCallback(
      new NextRequest(
        "https://admin.jayantgoyal.com/auth/callback?code=valid&next=https://evil.example",
      ),
    );

    expect(response.headers.get("location")).toBe(
      "https://auth.jayantgoyal.com/mfa?return_to=https%3A%2F%2Fadmin.jayantgoyal.com%2F",
    );
  });
});
