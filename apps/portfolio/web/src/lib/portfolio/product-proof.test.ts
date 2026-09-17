import { describe, expect, it } from "vitest";

import { getProductProofPoints } from "./product-proof";

const cmsCopy = {
  eyebrow: "Product ownership",
  headline: "Brief to production",
  accent: "Backend depth",
  description: "Auth · PostgreSQL · Storage · Realtime",
  supportingText: "",
  labels: {
    deliveryLabel: "Delivery system",
    deliveryValue: "CMS · CI · independent deploys",
  },
  isVisible: true,
};

describe("portfolio product proof", () => {
  it("keeps the proof strip tied to the canonical application registry", () => {
    const points = getProductProofPoints(cmsCopy);
    expect(points).toHaveLength(4);
    expect(points[1]).toEqual({
      label: "Platform architecture",
      value: "4 purpose-built applications",
    });
  });

  it("reads ownership and depth copy from CMS fields", () => {
    expect(getProductProofPoints(cmsCopy).map((point) => point.label)).toEqual([
      "Product ownership",
      "Platform architecture",
      "Backend depth",
      "Delivery system",
    ]);
  });
});
