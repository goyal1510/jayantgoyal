import { NextRequest } from "next/server";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

const { createRequestClientMock } = vi.hoisted(() => ({
  createRequestClientMock: vi.fn(),
}));

vi.mock("@jayant/web-auth/server", async () => {
  const actual = await vi.importActual<
    typeof import("@jayant/web-auth/server")
  >("@jayant/web-auth/server");
  return {
    ...actual,
    createSupabaseRequestClient: createRequestClientMock,
  };
});

import { GET as authCallback } from "./route";

type CallbackScenario = {
  exchangeError?: Error | null;
  verifyError?: Error | null;
  user?: {
    id: string;
    identities?: Array<{
      id: string;
      user_id: string;
      identity_id: string;
      provider: string;
      identity_data?: Record<string, unknown>;
      last_sign_in_at?: string;
    }>;
  } | null;
};

function useCallbackScenario({
  exchangeError = null,
  verifyError = null,
  user = null,
}: CallbackScenario = {}) {
  const supabase = {
    auth: {
      exchangeCodeForSession: vi.fn().mockResolvedValue({
        data: { user },
        error: exchangeError,
      }),
      verifyOtp: vi.fn().mockResolvedValue({ error: verifyError }),
      getUser: vi.fn().mockResolvedValue({ data: { user } }),
    },
    schema: vi.fn(),
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
});

afterAll(() => {
  vi.unstubAllEnvs();
});

describe("Studio callback contract", () => {
  it("returns a generic entry destination with refreshed response state", async () => {
    useCallbackScenario({ exchangeError: new Error("invalid code") });

    const response = await authCallback(
      new NextRequest("https://studio.example.test/auth/callback?code=bad"),
    );

    expect(response.headers.get("location")).toBe(
      "https://studio.example.test/welcome",
    );
    expect(response.cookies.get("session-cookie")?.value).toBe("refreshed");
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  });

  it("rejects an external success destination", async () => {
    useCallbackScenario();

    const response = await authCallback(
      new NextRequest(
        "https://studio.example.test/auth/callback?code=valid&next=https://evil.example",
      ),
    );

    expect(response.headers.get("location")).toBe(
      "https://studio.example.test/?login_success=true",
    );
  });

  it("keeps refreshed state while entering password recovery", async () => {
    useCallbackScenario();

    const response = await authCallback(
      new NextRequest(
        "https://studio.example.test/auth/callback?token_hash=synthetic&type=recovery",
      ),
    );

    expect(response.headers.get("location")).toBe(
      "https://auth.jayantgoyal.com/mfa?return_to=https%3A%2F%2Fstudio.example.test%2Freset-password",
    );
    expect(response.cookies.get("session-cookie")?.value).toBe("refreshed");
    expect(response.cookies.get("recovery_mode")?.value).toBe("true");
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  });
});
