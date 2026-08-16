import { describe, expect, it } from "vitest";

import nextConfig from "./next.config";

async function configuredRedirects() {
  if (!nextConfig.redirects) throw new Error("Redirects are not configured");
  return nextConfig.redirects();
}

async function configuredHeaders() {
  if (!nextConfig.headers) throw new Error("Headers are not configured");
  return nextConfig.headers();
}

describe("Portfolio compatibility redirects", () => {
  it("consolidates public Studio pages with permanent redirects", async () => {
    const redirects = await configuredRedirects();

    expect(redirects).toContainEqual({
      source: "/tools",
      destination: "https://studio.jayantgoyal.com/tools",
      permanent: true,
    });
    expect(redirects).toContainEqual({
      source: "/tools/:path*",
      destination: "https://studio.jayantgoyal.com/tools/:path*",
      permanent: true,
    });
  });

  it("keeps Studio APIs and session routes temporary", async () => {
    const redirects = await configuredRedirects();

    expect(redirects).toContainEqual({
      source: "/welcome",
      destination: "https://studio.jayantgoyal.com/welcome",
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
    expect(sources).not.toContain("/api/github-contributions");
    expect(sources).not.toContain("/api/github-loc");
    expect(sources).not.toContain("/api/resume");
  });

  it("maps historical Portfolio and Auth entry routes explicitly", async () => {
    const redirects = await configuredRedirects();

    expect(redirects).toContainEqual({
      source: "/home",
      destination: "/#top",
      permanent: true,
    });
    expect(redirects).toContainEqual({
      source: "/login",
      destination: "https://studio.jayantgoyal.com/welcome",
      permanent: false,
    });
    expect(redirects).toContainEqual({
      source: "/portfolio",
      destination: "/",
      permanent: true,
    });
    expect(redirects).toContainEqual({
      source: "/assets/Jayant_Resume.pdf",
      destination: "/resume",
      permanent: true,
    });
  });

  it("retires deleted Writing URLs without leaving soft 404s", async () => {
    const redirects = await configuredRedirects();

    expect(redirects).toContainEqual({
      source: "/blog",
      destination: "/writing",
      permanent: true,
    });
    expect(redirects).toContainEqual({
      source:
        "/writing/how-i-built-a-live-resume-download-with-google-docs-next-js-and-vercel",
      destination: "/writing",
      permanent: true,
    });
    expect(redirects).toContainEqual({
      source: "/blog/fixing-google-indexing-seo",
      destination: "/writing",
      permanent: true,
    });
  });

  it("keeps historical Studio project URLs pointing at the Studio system page", async () => {
    const redirects = await configuredRedirects();

    expect(redirects).toContainEqual({
      source: "/case-studies/tech-tools",
      destination: "/work/studio",
      permanent: true,
    });
    expect(redirects).toContainEqual({
      source: "/projects/sync-scratchpad",
      destination: "/work/studio",
      permanent: true,
    });
  });

  it("keeps the retired identity case-study URL pointed at Auth", async () => {
    const redirects = await configuredRedirects();

    expect(redirects).toContainEqual({
      source: "/work/identity-sso",
      destination: "/work/auth",
      permanent: true,
    });
  });
});

describe("Portfolio security headers", () => {
  it("allows the Cloudflare Web Analytics beacon without exposing GitHub APIs to the browser", async () => {
    const headers = await configuredHeaders();
    const globalHeaders = headers.find((entry) => entry.source === "/(.*)");
    const csp = globalHeaders?.headers.find(
      (header) => header.key === "Content-Security-Policy",
    )?.value;

    expect(csp).toContain("https://static.cloudflareinsights.com");
    expect(csp).toContain("https://cloudflareinsights.com");
    expect(csp).not.toContain("github-contributions-api.jogruber.de");
    expect(csp).not.toContain("https://api.github.com");
  });

  it("prevents Cloudflare from rewriting the contact email into a crawler URL", async () => {
    const headers = await configuredHeaders();
    const contactRule = headers.find((entry) => entry.source === "/contact");
    const cacheControl = contactRule?.headers.find(
      (header) => header.key === "Cache-Control",
    )?.value;

    expect(cacheControl).toContain("no-transform");
  });
});
