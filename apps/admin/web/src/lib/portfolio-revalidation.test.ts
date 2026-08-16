import { describe, expect, it } from "vitest";

import {
  getPortfolioPublicRevalidationPaths,
  PORTFOLIO_PUBLIC_REVALIDATION_PATHS,
} from "./portfolio-revalidation";

describe("Portfolio public revalidation contract", () => {
  it("covers every public route that renders CMS-backed Portfolio content", () => {
    expect(getPortfolioPublicRevalidationPaths()).toEqual(
      PORTFOLIO_PUBLIC_REVALIDATION_PATHS,
    );
    expect(getPortfolioPublicRevalidationPaths()).toEqual([
      "/",
      "/writing",
      "/resume",
    ]);
  });
});
