import { describe, expect, it } from "vitest";

import { buildProductionRobotsContent } from "./app/robots.txt/route";
import { getStudioProduct } from "./lib/config/studio-inventory";
import { buildStudioProductMetadata } from "./lib/seo/product-metadata";

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
});
