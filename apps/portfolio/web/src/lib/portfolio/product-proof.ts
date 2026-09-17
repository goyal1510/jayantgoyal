import { APP_BRANDS } from "@jayantgoyal/web-brand";

import type { PortfolioSectionContent } from "./editorial-data";

const applicationCount = Object.keys(APP_BRANDS).length;

function splitPair(value: string): { label: string; value: string } | null {
  const separator = value.indexOf("|");
  if (separator === -1) return null;
  const label = value.slice(0, separator).trim();
  const pairValue = value.slice(separator + 1).trim();
  if (!label || !pairValue) return null;
  return { label, value: pairValue };
}

/** Home proof strip: CMS copy plus the live application count from identity. */
export function getProductProofPoints(content: PortfolioSectionContent) {
  const delivery = splitPair(content.supportingText);

  return [
    { label: content.eyebrow, value: content.headline },
    {
      label: "Platform architecture",
      value: `${applicationCount} purpose-built applications`,
    },
    { label: content.accent, value: content.description },
    delivery ?? {
      label: "Delivery system",
      value: "CMS · CI · independent deploys",
    },
  ];
}
