import { NextRequest } from "next/server";
import { existsSync, readFileSync } from "node:fs";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

const { createRequestClientMock } = vi.hoisted(() => ({
  createRequestClientMock: vi.fn(),
}));

vi.mock("@repo/auth/server", async () => {
  const actual =
    await vi.importActual<typeof import("@repo/auth/server")>(
      "@repo/auth/server",
    );
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
  role?: string | null;
  currentLevel?: "aal1" | "aal2";
  nextLevel?: "aal1" | "aal2";
  hasVerifiedFactor?: boolean;
  exchangeError?: Error | null;
};

function useSupabaseScenario({
  user = { id: "test-user" },
  role = "admin",
  currentLevel = "aal2",
  nextLevel = "aal2",
  hasVerifiedFactor = false,
  exchangeError = null,
}: SupabaseScenario = {}) {
  const single = vi.fn().mockResolvedValue({
    data: role === null ? null : { role },
  });
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
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({ single })),
        })),
      })),
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
  vi.stubEnv("NEXT_PUBLIC_AUTH_FLOW_OWNER", "legacy");
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

  it("keeps legacy account settings and MFA cleanup routes removed", () => {
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
  });

  it("routes login entry to Auth only when the cutover flag is enabled", async () => {
    vi.stubEnv("NEXT_PUBLIC_AUTH_FLOW_OWNER", "auth");

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
      new NextRequest("https://admin.example.test/portfolio/hero"),
    );

    expect(response.headers.get("location")).toBe(
      "https://admin.example.test/welcome?redirect=%2Fportfolio%2Fhero",
    );
    expect(response.cookies.get("session-cookie")?.value).toBe("refreshed");
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  });

  it("denies a signed-in non-admin without losing refresh state", async () => {
    useSupabaseScenario({ role: "user" });

    const response = await adminProxy(
      new NextRequest("https://admin.example.test/users"),
    );

    expect(response.headers.get("location")).toBe(
      "https://admin.example.test/unauthorized",
    );
    expect(response.cookies.get("session-cookie")?.value).toBe("refreshed");
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  });

  it("allows an admin and exposes only the verified role header", async () => {
    useSupabaseScenario({ role: "admin" });

    const response = await adminProxy(
      new NextRequest("https://admin.example.test/users"),
    );

    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get("x-auth-status")).toBe("authed");
    expect(response.headers.get("x-user-role")).toBe("admin");
  });

  it("steps an AAL1 user with a verified factor up to MFA", async () => {
    useSupabaseScenario({
      currentLevel: "aal1",
      nextLevel: "aal2",
      hasVerifiedFactor: true,
    });

    const response = await adminProxy(
      new NextRequest("https://admin.example.test/users"),
    );

    expect(response.headers.get("location")).toBe(
      "https://admin.example.test/mfa-verify?redirect=%2Fusers",
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
        "https://admin.example.test/auth/callback?code=valid&next=https://evil.example",
      ),
    );

    expect(response.headers.get("location")).toBe(
      "https://admin.example.test/mfa-verify?redirect=%2F",
    );
  });
});
