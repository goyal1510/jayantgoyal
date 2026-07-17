import { describe, expect, it, vi } from "vitest";

import { copyAuthCacheHeaders, writeAuthResponse } from "./server";

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
