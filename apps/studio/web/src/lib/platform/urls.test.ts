import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("cross-application URLs", () => {
  it("uses stable production fallbacks for missing configuration", async () => {
    vi.stubEnv("NEXT_PUBLIC_PORTFOLIO_URL", "");
    vi.stubEnv("NEXT_PUBLIC_STUDIO_URL", "");

    const { PORTFOLIO_URL, STUDIO_URL } = await import("./urls");

    expect(PORTFOLIO_URL).toBe("https://jayantgoyal.com");
    expect(STUDIO_URL).toBe("https://studio.jayantgoyal.com");
  });

  it("normalizes configured origins and resolves application paths", async () => {
    vi.stubEnv("NEXT_PUBLIC_PORTFOLIO_URL", "http://localhost:3000/about");
    vi.stubEnv("NEXT_PUBLIC_STUDIO_URL", "http://localhost:3001/tools");

    const { PORTFOLIO_URL, STUDIO_URL, portfolioUrl, studioUrl } =
      await import("./urls");

    expect(PORTFOLIO_URL).toBe("http://localhost:3000");
    expect(STUDIO_URL).toBe("http://localhost:3001");
    expect(portfolioUrl("/writing")).toBe("http://localhost:3000/writing");
    expect(studioUrl("/tools/json")).toBe(
      "http://localhost:3001/tools/json",
    );
  });
});
