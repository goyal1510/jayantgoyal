import { describe, expect, it } from "vitest";

import { PRODUCT_PROOF_POINTS } from "./product-proof";

describe("portfolio product proof", () => {
  it("keeps the proof strip tied to the canonical application registry", () => {
    expect(PRODUCT_PROOF_POINTS).toHaveLength(4);
    expect(PRODUCT_PROOF_POINTS[1]).toEqual({
      label: "Platform architecture",
      value: "4 purpose-built applications",
    });
  });

  it("describes meaningful ownership and system depth", () => {
    expect(PRODUCT_PROOF_POINTS.map((point) => point.label)).toEqual([
      "Product ownership",
      "Platform architecture",
      "Backend depth",
      "Delivery system",
    ]);
  });
});
