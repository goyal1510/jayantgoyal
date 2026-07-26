import { describe, expect, it } from "vitest";

import {
  buildPublicPageMetadata,
  isCanonicalApplicationHost,
  isIndexablePath,
  matchesPathOrChild,
  normalizeMetadataDescription,
  normalizePathname,
} from "./index";

describe("shared SEO helpers", () => {
  it("builds canonical and social metadata from the app contract", () => {
    const metadata = buildPublicPageMetadata({
      appId: "studio",
      siteUrl: "https://studio.jayantgoyal.com",
      title: "Weather",
      description: "Weather workspace",
      pathname: "/weather",
      image: "https://studio.jayantgoyal.com/opengraph-image",
    });

    expect(metadata.title).toBe("Weather");
    expect(metadata.alternates?.canonical).toBe(
      "https://studio.jayantgoyal.com/weather",
    );
    expect(metadata.openGraph?.title).toBe("Weather | Studio");
    expect(metadata.twitter?.title).toBe("Weather | Studio");
  });

  it("uses the app description when CMS metadata copy is blank", () => {
    const metadata = buildPublicPageMetadata({
      appId: "portfolio",
      siteUrl: "https://jayantgoyal.com",
      title: "About",
      description: "   ",
      pathname: "/about",
      image: "https://jayantgoyal.com/opengraph-image",
    });

    expect(metadata.description).toBe(
      "The portfolio of Jayant, a software engineer shaping clear, dependable digital products from idea through delivery.",
    );
    expect(metadata.openGraph?.description).toBe(metadata.description);
    expect(metadata.twitter?.description).toBe(metadata.description);
  });

  it("keeps metadata descriptions concise without cutting a word", () => {
    const longDescription =
      "Build and verify a deliberately long metadata description that explains a useful product decision while still staying compact enough for a search result snippet and social preview.";
    const normalized = normalizeMetadataDescription(
      longDescription,
      "Fallback",
    );

    expect(normalized.length).toBeLessThanOrEqual(160);
    expect(normalized.endsWith("…")).toBe(true);
    expect(normalized).not.toContain("previe…");
  });

  it("normalizes and matches application paths", () => {
    expect(normalizePathname(null)).toBe("/");
    expect(normalizePathname("/tools/")).toBe("/tools");
    expect(matchesPathOrChild("/tools/uuid", "/tools")).toBe(true);
    expect(isIndexablePath("/weather", ["/"], ["/weather"])).toBe(true);
    expect(isIndexablePath("/files", ["/"], ["/weather"])).toBe(false);
  });

  it("uses the platform host contract", () => {
    expect(
      isCanonicalApplicationHost("studio", "studio.jayantgoyal.com:443"),
    ).toBe(true);
    expect(isCanonicalApplicationHost("admin", "jayantgoyal.com")).toBe(false);
  });
});
