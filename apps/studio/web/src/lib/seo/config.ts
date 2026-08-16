import type { Metadata } from "next";

import {
  APP_BRANDS,
  APP_SOCIAL_PREVIEW_IMAGES,
  PERSON_BRAND,
} from "@jayant/web-brand";
import {
  buildPublicPageMetadata as buildSharedPageMetadata,
  isCanonicalApplicationHost,
  isIndexablePath as isSharedIndexablePath,
  matchesPathOrChild,
  normalizePathname,
} from "@jayant/web-seo";

import { STUDIO_URL } from "@/lib/platform/urls";

const STUDIO_BRAND = APP_BRANDS.studio;

export const SITE_URL = STUDIO_URL;
export const PERSON_NAME = PERSON_BRAND.fullName;
export const SITE_NAME = STUDIO_BRAND.publicName;
export const SITE_TITLE = STUDIO_BRAND.defaultTitle;
export const SITE_TITLE_TEMPLATE = STUDIO_BRAND.titleTemplate;
export const SITE_DESCRIPTION = STUDIO_BRAND.description;
export const DEFAULT_OG_IMAGE = APP_SOCIAL_PREVIEW_IMAGES.studio.url;
export const DEFAULT_OG_IMAGE_METADATA = APP_SOCIAL_PREVIEW_IMAGES.studio;
// Keep this aligned with the latest material page-content or search-metadata
// change. Do not advance it for routine deployments.
export const LAST_SIGNIFICANT_UPDATE = "2026-07-26T00:00:00.000Z";

const INDEXABLE_EXACT_PATHS = ["/", "/terms-conditions"] as const;
const INDEXABLE_PREFIXES = [
  "/products",
  "/tools",
  "/weather",
  "/custom-calculator",
  "/github-stats",
] as const;

export { matchesPathOrChild, normalizePathname };

export function isIndexablePath(pathname: string): boolean {
  return isSharedIndexablePath(
    pathname,
    INDEXABLE_EXACT_PATHS,
    INDEXABLE_PREFIXES,
  );
}

export function isProductionStudioHost(host: string | null): boolean {
  return isCanonicalApplicationHost("studio", host);
}

export function buildAbsoluteUrl(pathname: string): string {
  return new URL(pathname, SITE_URL).toString();
}

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
    appId: "studio",
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
