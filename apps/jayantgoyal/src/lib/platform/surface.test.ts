import { afterEach, describe, expect, it, vi } from "vitest";

import {
  isStudioHost,
  normalizeHostname,
  resolvePlatformSurface,
} from "./surface";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("platform surface detection", () => {
  it("normalizes URLs, ports, paths, and casing", () => {
    expect(
      normalizeHostname("HTTPS://Studio.JayantGoyal.com:443/tools"),
    ).toBe("studio.jayantgoyal.com");
  });

  it("recognizes the approved Studio hosts", () => {
    expect(isStudioHost("studio.jayantgoyal.com")).toBe(true);
    expect(isStudioHost("studio.staging.jayantgoyal.com")).toBe(true);
    expect(isStudioHost("studio.localhost:3001")).toBe(true);
  });

  it("keeps the apex on the legacy surface during compatibility", () => {
    expect(resolvePlatformSurface("jayantgoyal.com")).toBe("legacy");
    expect(resolvePlatformSurface("www.jayantgoyal.com")).toBe("legacy");
  });

  it("does not treat an absent host as Studio", () => {
    vi.stubEnv("VERCEL_URL", "");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "");

    expect(isStudioHost(undefined)).toBe(false);
    expect(isStudioHost(null)).toBe(false);
    expect(isStudioHost("")).toBe(false);
  });

  it("recognizes the active Vercel deployment host", () => {
    vi.stubEnv("VERCEL_URL", "studio-preview.example.vercel.app");

    expect(isStudioHost("studio-preview.example.vercel.app")).toBe(true);
  });
});
