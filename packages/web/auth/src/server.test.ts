import { describe, expect, it, vi } from "vitest";

import {
  copyAuthCacheHeaders,
  promoteLegacySession,
  writeAuthResponse,
} from "./server";

function createPromotionClient({
  userId = "test-user",
  userError = null,
  session = {
    access_token: "synthetic-access-token",
    refresh_token: "synthetic-refresh-token",
  },
  sessionError = null,
  setSessionError = null,
}: {
  userId?: string | null;
  userError?: Error | null;
  session?: { access_token: string; refresh_token: string } | null;
  sessionError?: Error | null;
  setSessionError?: Error | null;
} = {}) {
  const auth = {
    getUser: vi.fn().mockResolvedValue({
      data: { user: userId ? { id: userId } : null },
      error: userError,
    }),
    getSession: vi.fn().mockResolvedValue({
      data: { session },
      error: sessionError,
    }),
    setSession: vi.fn().mockResolvedValue({
      data: {},
      error: setSessionError,
    }),
  };
  return { auth };
}

describe("copyAuthCacheHeaders", () => {
  it("copies only auth cache-safety headers to a replacement response", () => {
    const sourceHeaders = new Headers({
      "Cache-Control": "private, no-store",
      Expires: "0",
      Location: "https://example.test/old-target",
      Pragma: "no-cache",
    });
    const targetHeaders = new Headers({
      Location: "https://example.test/new-target",
    });

    copyAuthCacheHeaders(sourceHeaders, targetHeaders);

    expect(targetHeaders.get("Cache-Control")).toBe("private, no-store");
    expect(targetHeaders.get("Expires")).toBe("0");
    expect(targetHeaders.get("Pragma")).toBe("no-cache");
    expect(targetHeaders.get("Location")).toBe(
      "https://example.test/new-target",
    );
  });
});

describe("writeAuthResponse", () => {
  it("commits refreshed cookies and all required cache headers", () => {
    const cookieStore = { set: vi.fn() };
    const responseHeaders = { set: vi.fn() };

    writeAuthResponse({
      cookies: [
        {
          name: "session-cookie",
          value: "test-value",
          options: { path: "/", sameSite: "lax" },
        },
      ],
      headers: {
        "Cache-Control": "private, no-store",
        Expires: "0",
        Pragma: "no-cache",
      },
      cookieStore,
      responseHeaders,
    });

    expect(cookieStore.set).toHaveBeenCalledWith(
      "session-cookie",
      "test-value",
      { path: "/", sameSite: "lax" },
    );
    expect(responseHeaders.set).toHaveBeenCalledWith(
      "Cache-Control",
      "private, no-store",
    );
    expect(responseHeaders.set).toHaveBeenCalledWith("Expires", "0");
    expect(responseHeaders.set).toHaveBeenCalledWith("Pragma", "no-cache");
  });
});

describe("promoteLegacySession", () => {
  it("promotes only credentials from a server-validated legacy user", async () => {
    const legacyClient = createPromotionClient();
    const platformClient = createPromotionClient();

    await expect(
      promoteLegacySession({ legacyClient, platformClient }),
    ).resolves.toBe("promoted");
    expect(platformClient.auth.setSession).toHaveBeenCalledWith({
      access_token: "synthetic-access-token",
      refresh_token: "synthetic-refresh-token",
    });
    expect(platformClient.auth.getUser).toHaveBeenCalledOnce();
  });

  it("rejects an unauthenticated legacy cookie before reading credentials", async () => {
    const legacyClient = createPromotionClient({ userId: null });
    const platformClient = createPromotionClient();

    await expect(
      promoteLegacySession({ legacyClient, platformClient }),
    ).resolves.toBe("invalid");
    expect(legacyClient.auth.getSession).not.toHaveBeenCalled();
    expect(platformClient.auth.setSession).not.toHaveBeenCalled();
  });

  it("keeps the validated legacy request when credential transfer fails", async () => {
    const legacyClient = createPromotionClient();
    const platformClient = createPromotionClient({
      setSessionError: new Error("synthetic transfer failure"),
    });

    await expect(
      promoteLegacySession({ legacyClient, platformClient }),
    ).resolves.toBe("valid-unpromoted");
  });

  it("rejects a promoted identity mismatch", async () => {
    const legacyClient = createPromotionClient({ userId: "legacy-user" });
    const platformClient = createPromotionClient({ userId: "different-user" });

    await expect(
      promoteLegacySession({ legacyClient, platformClient }),
    ).resolves.toBe("valid-unpromoted");
  });
});
