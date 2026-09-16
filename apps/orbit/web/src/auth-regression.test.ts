import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

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

import orbitProxy from "./proxy";

type SupabaseScenario = {
  user?: { id: string } | null;
  productAccess?: boolean;
  currentLevel?: "aal1" | "aal2";
  nextLevel?: "aal1" | "aal2";
};

function useSupabaseScenario({
  user = { id: "test-user" },
  productAccess = true,
  currentLevel = "aal2",
  nextLevel = "aal2",
}: SupabaseScenario = {}) {
  const supabase = {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user } }),
      mfa: {
        getAuthenticatorAssuranceLevel: vi.fn().mockResolvedValue({
          data: { currentLevel, nextLevel },
        }),
        listFactors: vi.fn().mockResolvedValue({ data: { totp: [] } }),
      },
    },
    schema: vi.fn(() => ({
      rpc: vi.fn((name: string) => {
        if (name === "has_product_access") {
          return Promise.resolve({ data: productAccess, error: null });
        }
        return Promise.resolve({ data: false, error: null });
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

describe("orbit proxy", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-key");
    createRequestClientMock.mockReset();
  });

  it("redirects unauthenticated users from protected routes to Auth", async () => {
    useSupabaseScenario({ user: null });
    const response = await orbitProxy(
      new NextRequest("http://localhost:3004/home"),
    );
    expect(response.status).toBeGreaterThanOrEqual(300);
    expect(response.headers.get("location")).toContain("/welcome");
  });

  it("redirects entitled users away from the landing page", async () => {
    useSupabaseScenario({ productAccess: true });
    const response = await orbitProxy(
      new NextRequest("http://localhost:3004/"),
    );
    expect(response.headers.get("location")).toBe("http://localhost:3004/home");
  });

  it("sends signed-in users without Orbit access to /no-access", async () => {
    useSupabaseScenario({ productAccess: false });
    const response = await orbitProxy(
      new NextRequest("http://localhost:3004/home"),
    );
    expect(response.headers.get("location")).toBe(
      "http://localhost:3004/no-access",
    );
  });
});
