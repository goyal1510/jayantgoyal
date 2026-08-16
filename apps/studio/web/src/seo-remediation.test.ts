import { describe, expect, it } from "vitest";

import sitemap from "./app/sitemap";
import { buildProductionRobotsContent } from "./app/robots.txt/route";
import { getStudioProduct } from "./lib/config/studio-inventory";
import { LAST_SIGNIFICANT_UPDATE } from "./lib/seo/config";
import { buildStudioProductMetadata } from "./lib/seo/product-metadata";
import { allTools } from "./lib/tools/tools";

describe("Studio search metadata", () => {
  it("emits a supported robots policy with the canonical sitemap", () => {
    const robots = buildProductionRobotsContent(
      "https://studio.jayantgoyal.com",
    );

    expect(robots).toContain(
      "Sitemap: https://studio.jayantgoyal.com/sitemap.xml",
    );
    expect(robots).not.toContain("Content-Signal");
  });

  it("distinguishes product overviews from their launch routes", () => {
    const weather = getStudioProduct("weather");
    if (!weather) throw new Error("Weather product fixture is missing");
    const metadata = buildStudioProductMetadata(weather);

    expect(metadata.title).toBe("Weather Product Overview");
    expect(metadata.alternates?.canonical).toBe(
      "https://studio.jayantgoyal.com/products/weather",
    );
  });

  it("dates submitted pages from the latest material SEO update", () => {
    const entries = sitemap();

    expect(entries.length).toBeGreaterThan(0);
    expect(
      entries.every((entry) => entry.lastModified === LAST_SIGNIFICANT_UPDATE),
    ).toBe(true);
    expect(new Date(LAST_SIGNIFICANT_UPDATE).toISOString()).toBe(
      "2026-07-26T00:00:00.000Z",
    );
  });

  it("keeps every tool description useful and snippet-safe", () => {
    const invalidDescriptions = allTools
      .filter(
        (tool) => tool.description.length < 50 || tool.description.length > 160,
      )
      .map((tool) => ({
        path: tool.path,
        length: tool.description.length,
      }));

    expect(invalidDescriptions).toEqual([]);
  });
});
