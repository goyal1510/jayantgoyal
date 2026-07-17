import { describe, expect, it } from "vitest";

import nextConfig from "./next.config";

async function configuredRedirects() {
  if (!nextConfig.redirects) throw new Error("Redirects are not configured");
  return nextConfig.redirects();
}

describe("Portfolio compatibility redirects", () => {
  it("keeps exact and nested Studio redirects separate and temporary", async () => {
    const redirects = await configuredRedirects();

    expect(redirects).toContainEqual({
      source: "/tools",
      destination: "https://studio.jayantgoyal.com/tools",
      permanent: false,
    });
    expect(redirects).toContainEqual({
      source: "/tools/:path*",
      destination: "https://studio.jayantgoyal.com/tools/:path*",
      permanent: false,
    });
    expect(redirects).toContainEqual({
      source: "/api/calculator",
      destination: "https://studio.jayantgoyal.com/api/calculator",
      permanent: false,
    });
  });

  it("keeps Portfolio-owned APIs out of the Studio redirect set", async () => {
    const redirects = await configuredRedirects();
    const sources = redirects.map((redirect) => redirect.source);

    expect(sources).not.toContain("/api/contact");
    expect(sources).not.toContain("/api/github-stats");
    expect(sources).not.toContain("/api/github-loc");
    expect(sources).not.toContain("/api/resume");
  });

  it("maps historical Portfolio and Auth entry routes explicitly", async () => {
    const redirects = await configuredRedirects();

    expect(redirects).toContainEqual({
      source: "/about",
      destination: "/#about",
      permanent: true,
    });
    expect(redirects).toContainEqual({
      source: "/login",
      destination: "https://studio.jayantgoyal.com/welcome",
      permanent: false,
    });
  });
});
