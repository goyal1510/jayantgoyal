import type { Metadata } from "next";

import { APP_BRANDS, PERSON_BRAND } from "@repo/brand";

import { normalizeHostname } from "@/lib/platform/surface";
import { STUDIO_URL } from "@/lib/platform/urls";

const STUDIO_BRAND = APP_BRANDS.studio;

export const SITE_URL = STUDIO_URL;
export const PERSON_NAME = PERSON_BRAND.fullName;
export const SITE_NAME = STUDIO_BRAND.publicName;
export const SITE_TITLE = STUDIO_BRAND.defaultTitle;
export const SITE_TITLE_TEMPLATE = STUDIO_BRAND.titleTemplate;
export const SITE_DESCRIPTION = STUDIO_BRAND.description;
export const DEFAULT_OG_IMAGE = `${SITE_URL}/opengraph-image?v=6`;
export const LAST_SIGNIFICANT_UPDATE = "2026-07-17T00:00:00.000Z";

export const INDEXABLE_EXACT_PATHS = ["/", "/terms-conditions"] as const;
export const INDEXABLE_PREFIXES = [
  "/tools",
  "/weather",
  "/custom-calculator",
  "/github-stats",
] as const;

export function normalizePathname(pathname: string | null): string {
  if (!pathname || !pathname.startsWith("/")) return "/";
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }
  return pathname;
}

export function matchesPathOrChild(
  pathname: string,
  basePath: string,
): boolean {
  return pathname === basePath || pathname.startsWith(`${basePath}/`);
}

export function isIndexablePath(pathname: string): boolean {
  if (
    INDEXABLE_EXACT_PATHS.includes(
      pathname as (typeof INDEXABLE_EXACT_PATHS)[number],
    )
  ) {
    return true;
  }
  return INDEXABLE_PREFIXES.some((prefix) =>
    matchesPathOrChild(pathname, prefix),
  );
}

export function isProductionStudioHost(host: string | null): boolean {
  return normalizeHostname(host) === "studio.jayantgoyal.com";
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
  const canonical = buildAbsoluteUrl(pathname);

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: "website",
      title,
      description,
      url: canonical,
      images: [
        {
          url: DEFAULT_OG_IMAGE,
          width: 1200,
          height: 630,
          alt: title,
          type: "image/png",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [DEFAULT_OG_IMAGE],
    },
  };
}
