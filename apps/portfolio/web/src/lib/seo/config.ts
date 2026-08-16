import type { Metadata } from "next";

import {
  APP_SOCIAL_PREVIEW_IMAGES,
  PERSON_BRAND,
} from "@jayantgoyal/web-brand";
import { applicationOrigin, isApplicationHost } from "@jayantgoyal/web-urls";
import { buildPublicPageMetadata as buildSharedPageMetadata } from "@jayantgoyal/web-seo";

export const SITE_URL = applicationOrigin(
  "portfolio",
  process.env.NEXT_PUBLIC_SITE_URL,
);
export const PERSON_NAME = PERSON_BRAND.displayName;
export const DEFAULT_OG_IMAGE = APP_SOCIAL_PREVIEW_IMAGES.portfolio.url;
export const DEFAULT_OG_IMAGE_METADATA = APP_SOCIAL_PREVIEW_IMAGES.portfolio;
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
    imageMetadata: {
      width: DEFAULT_OG_IMAGE_METADATA.width,
      height: DEFAULT_OG_IMAGE_METADATA.height,
      type: DEFAULT_OG_IMAGE_METADATA.type,
    },
  });
}

export function isCanonicalProductionHost(host: string | null): boolean {
  return isApplicationHost("portfolio", host);
}
