import { describe, expect, it } from "vitest";

import nextConfig from "./next.config";

async function configuredRedirects() {
  if (!nextConfig.redirects) throw new Error("Redirects are not configured");
  return nextConfig.redirects();
}

describe("Studio Portfolio ownership redirects", () => {
  it("sends professional pages to the canonical Portfolio", async () => {
    const redirects = await configuredRedirects();

    expect(redirects).toContainEqual({
      source: "/about",
      destination: "https://jayantgoyal.com/#about",
      permanent: true,
    });
    expect(redirects).toContainEqual({
      source: "/blog/:path*",
      destination: "https://jayantgoyal.com/blog/:path*",
      permanent: true,
    });
  });

  it("preserves methods for Portfolio-owned server endpoints", async () => {
    const redirects = await configuredRedirects();

    expect(redirects).toContainEqual({
      source: "/api/contact",
      destination: "https://jayantgoyal.com/api/contact",
      permanent: false,
    });
    expect(redirects).toContainEqual({
      source: "/api/resume",
      destination: "https://jayantgoyal.com/api/resume",
      permanent: false,
    });
  });
});
