import type { Metadata } from "next";

import { APP_BRANDS, PERSON_BRAND } from "@repo/brand";
import { applicationOrigin, isApplicationHost } from "@repo/platform";
import { buildPublicPageMetadata as buildSharedPageMetadata } from "@repo/seo";

const PORTFOLIO_BRAND = APP_BRANDS.portfolio;
export const SITE_URL = applicationOrigin(
  "portfolio",
  process.env.NEXT_PUBLIC_SITE_URL,
);
export const PERSON_NAME = PERSON_BRAND.fullName;
export const SITE_NAME = PORTFOLIO_BRAND.publicName;
export const SITE_TITLE_TEMPLATE = PORTFOLIO_BRAND.titleTemplate;
export const DEFAULT_OG_IMAGE = `${SITE_URL}/opengraph-image`;
export const LAST_SIGNIFICANT_UPDATE = "2026-07-24T00:00:00.000Z";

export function buildPublicPageMetadata({
  title,
  description,
  pathname,
}: {
  title: string;
  description: string;
  pathname: string;
}): Metadata {
  return buildSharedPageMetadata({
    appId: "portfolio",
    siteUrl: SITE_URL,
    title,
    description,
    pathname,
    image: DEFAULT_OG_IMAGE,
  });
}

export function isCanonicalProductionHost(host: string | null): boolean {
  return isApplicationHost("portfolio", host);
}
