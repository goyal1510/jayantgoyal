import { describe, expect, it } from "vitest";

import {
  FEATURED_STUDIO_PRODUCTS,
  STUDIO_PRODUCTS,
  getStudioProduct,
  studioProductDetailHref,
} from "./studio-inventory";

describe("Studio product inventory", () => {
  it("uses unique stable product identifiers and valid launch destinations", () => {
    const ids = STUDIO_PRODUCTS.map((product) => product.id);

    expect(new Set(ids).size).toBe(ids.length);
    expect(
      STUDIO_PRODUCTS.every(
        (product) =>
          product.href.startsWith("/") || product.href.startsWith("https://"),
      ),
    ).toBe(true);
  });

  it("keeps professional writing outside the Studio product catalog", () => {
    expect(getStudioProduct("blog")).toBeUndefined();
  });

  it("classifies Media Lab as a utility instead of a Tech Tool", () => {
    expect(getStudioProduct("media-lab")).toMatchObject({
      type: "utility",
      href: "/media-lab/youtube-converter",
    });
  });

  it("features an intentional subset and builds public detail routes", () => {
    expect(FEATURED_STUDIO_PRODUCTS.map((product) => product.id)).toEqual([
      "tech-tools",
      "game-hub",
      "activity-tracker",
    ]);
    expect(studioProductDetailHref(getStudioProduct("tech-tools")!)).toBe(
      "/products/tech-tools",
    );
  });
});
