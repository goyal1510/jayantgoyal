import { NextRequest, NextResponse } from "next/server";
import { describe, expect, it, vi } from "vitest";

import { mfaMiddleware } from "./mfa";
import { recoveryMiddleware } from "./recovery";
import { routeGuardMiddleware } from "./route-guard";
import { runMiddleware } from "./runner";
import { termsMiddleware } from "./terms";
import type { ProxyContext } from "./types";

function createContext({
  url = "https://studio.example.test/files",
  isAuthed = true,
  isPublic = false,
  termsAccepted = true,
  aalLevel = "aal2",
  verifiedFactor = false,
  cookies,
}: {
  url?: string;
  isAuthed?: boolean;
  isPublic?: boolean;
  termsAccepted?: boolean;
  aalLevel?: string | null;
  verifiedFactor?: boolean;
  cookies?: Record<string, string>;
} = {}): ProxyContext {
  const request = new NextRequest(url, {
    headers: cookies
      ? {
          cookie: Object.entries(cookies)
            .map(([k, v]) => `${k}=${v}`)
            .join("; "),
        }
      : undefined,
  });
  const response = NextResponse.next();
  const supabase = {
    auth: {
      mfa: {
        listFactors: vi.fn().mockResolvedValue({
          data: {
            totp: verifiedFactor
              ? [{ id: "test-factor", status: "verified" }]
              : [],
          },
        }),
      },
    },
  };

  return {
    request,
    response,
    supabase,
    user: isAuthed ? { id: "test-user" } : null,
    pathname: request.nextUrl.pathname,
    isAuthed,
    termsAccepted,
    isPublic,
    aalLevel,
  } as unknown as ProxyContext;
}

describe("Studio authentication middleware policy", () => {
  it("redirects an anonymous protected request to canonical Auth", async () => {
    const result = await routeGuardMiddleware(
      createContext({ isAuthed: false }),
    );

    expect(result?.headers.get("location")).toBe(
      "https://auth.jayantgoyal.com/welcome?return_to=https%3A%2F%2Fstudio.example.test%2Ffiles",
    );
  });

  it("leaves authenticated requests for later authorization layers", async () => {
    const result = await routeGuardMiddleware(
      createContext({
        url: "https://studio.example.test/welcome?redirect=https://evil.example",
      }),
    );

    expect(result).toBeNull();
  });

  it("requires MFA for an AAL1 user with a verified factor", async () => {
    const result = await mfaMiddleware(
      createContext({ aalLevel: "aal1", verifiedFactor: true }),
    );

    expect(result?.headers.get("location")).toBe(
      "https://auth.jayantgoyal.com/mfa?return_to=https%3A%2F%2Fstudio.example.test%2Ffiles",
    );
  });

  it("locks a recovery session to password reset", async () => {
    const result = await recoveryMiddleware(
      createContext({ cookies: { recovery_mode: "true" } }),
    );

    expect(result?.headers.get("location")).toBe(
      "https://studio.example.test/reset-password",
    );
  });

  it("blocks a protected API until terms are accepted", async () => {
    const result = await termsMiddleware(
      createContext({
        url: "https://studio.example.test/api/files",
        termsAccepted: false,
      }),
    );

    expect(result?.status).toBe(403);
    await expect(result?.json()).resolves.toEqual({
      error: "You must accept the Terms and Conditions to use this feature.",
    });
  });
});

describe("Studio middleware response propagation", () => {
  it("moves refreshed auth state to a replacement response", async () => {
    const context = createContext();
    context.response.cookies.set("session-cookie", "refreshed", { path: "/" });
    context.response.headers.set("Cache-Control", "private, no-store");
    const replacement = NextResponse.redirect(
      new URL("/mfa-verify", context.request.url),
    );

    const result = await runMiddleware(context, [async () => replacement]);

    expect(result.headers.get("location")).toBe(
      "https://studio.example.test/mfa-verify",
    );
    expect(result.cookies.get("session-cookie")?.value).toBe("refreshed");
    expect(result.headers.get("Cache-Control")).toBe("private, no-store");
  });
});
