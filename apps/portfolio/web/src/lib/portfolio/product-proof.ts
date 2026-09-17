import { APP_BRANDS } from "@jayantgoyal/web-brand";
import { getSectionLabel } from "@jayantgoyal/portfolio-contracts";

import type { PortfolioSectionContent } from "./editorial-data";

const applicationCount = Object.keys(APP_BRANDS).length;

/** Home proof strip: CMS copy plus the live application count from identity. */
export function getProductProofPoints(content: PortfolioSectionContent) {
  return [
    { label: content.eyebrow, value: content.headline },
    {
      label: "Platform architecture",
      value: `${applicationCount} purpose-built applications`,
    },
    { label: content.accent, value: content.description },
    {
      label: getSectionLabel(content.labels, "deliveryLabel", "Delivery system"),
      value: getSectionLabel(
        content.labels,
        "deliveryValue",
        "CMS · CI · independent deploys",
      ),
    },
  ];
}
