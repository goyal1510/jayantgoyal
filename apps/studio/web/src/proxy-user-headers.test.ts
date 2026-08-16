import { NextRequest } from "next/server";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
}));

vi.mock("@jayantgoyal/web-auth/server", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@jayantgoyal/web-auth/server")>();

  return {
    ...actual,
    createSupabaseRequestClient: vi.fn().mockResolvedValue({
      auth: {
        getUser: mocks.getUser,
        mfa: {
          getAuthenticatorAssuranceLevel: vi.fn().mockResolvedValue({
            data: { currentLevel: "aal2" },
          }),
          listFactors: vi.fn(),
        },
      },
      schema: vi.fn(),
    }),
  };
});

import studioProxy from "./proxy";

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://project.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-key");
  mocks.getUser.mockResolvedValue({
    data: {
      user: {
        id: "verified-user",
        email: "verified@example.com",
      },
    },
    error: null,
  });
});

afterAll(() => {
  vi.unstubAllEnvs();
});

describe("Studio proxy verified identity forwarding", () => {
  it("replaces forged identity headers with the verified identity", async () => {
    const response = await studioProxy(
      new NextRequest("https://studio.jayantgoyal.com/api/scratchpad", {
        headers: {
          cookie: "terms_accepted=true",
          "x-user-id": "forged-user",
          "x-user-email": "forged@example.com",
        },
      }),
    );

    expect(response.headers.get("x-middleware-request-x-user-id")).toBe(
      "verified-user",
    );
    expect(response.headers.get("x-middleware-request-x-user-email")).toBe(
      "verified@example.com",
    );
  });
});
