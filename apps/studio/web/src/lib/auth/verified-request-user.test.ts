import { NextRequest } from "next/server";
import { describe, expect, it, vi } from "vitest";

import { getVerifiedRequestUserId } from "./verified-request-user";

describe("getVerifiedRequestUserId", () => {
  it("uses the proxy-verified user ID without another auth request", async () => {
    const getUser = vi.fn();
    const request = new NextRequest("https://studio.jayantgoyal.com/api/test", {
      headers: { "x-user-id": "verified-user" },
    });

    const userId = await getVerifiedRequestUserId(request, {
      auth: { getUser },
    } as never);

    expect(userId).toBe("verified-user");
    expect(getUser).not.toHaveBeenCalled();
  });

  it("falls back to Supabase auth when the proxy header is unavailable", async () => {
    const getUser = vi.fn().mockResolvedValue({
      data: { user: { id: "fallback-user" } },
      error: null,
    });
    const request = new NextRequest("https://studio.jayantgoyal.com/api/test");

    const userId = await getVerifiedRequestUserId(request, {
      auth: { getUser },
    } as never);

    expect(userId).toBe("fallback-user");
    expect(getUser).toHaveBeenCalledOnce();
  });
});
