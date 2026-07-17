import { describe, expect, it } from "vitest";

import {
  buildPublicPageMetadata,
  isCanonicalApplicationHost,
  isIndexablePath,
  matchesPathOrChild,
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
