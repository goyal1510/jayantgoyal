import { describe, expect, it } from "vitest";

import {
  PORTFOLIO_ASSET_MAX_BYTES,
  portfolioAssetExtension,
  validatePortfolioAssetMetadata,
} from "./portfolio-assets";

describe("Portfolio asset validation", () => {
  it("accepts an image for a project and a PDF for a resume", () => {
    expect(
      validatePortfolioAssetMetadata("project-image", {
        type: "image/webp",
        size: 1024,
      }),
    ).toBeNull();
    expect(
      validatePortfolioAssetMetadata("resume", {
        type: "application/pdf",
        size: 2048,
      }),
    ).toBeNull();
  });

  it("rejects mismatched, empty, and oversized files", () => {
    expect(
      validatePortfolioAssetMetadata("certificate-document", {
        type: "image/png",
        size: 1024,
      }),
    ).toMatch(/Unsupported file type/);
    expect(
      validatePortfolioAssetMetadata("blog-cover", {
        type: "image/png",
        size: 0,
      }),
    ).toMatch(/empty/);
    expect(
      validatePortfolioAssetMetadata("project-image", {
        type: "image/png",
        size: PORTFOLIO_ASSET_MAX_BYTES + 1,
      }),
    ).toMatch(/15 MB/);
  });

  it("uses stable storage extensions derived from trusted MIME types", () => {
    expect(portfolioAssetExtension("image/jpeg")).toBe("jpg");
    expect(portfolioAssetExtension("application/pdf")).toBe("pdf");
  });
});
