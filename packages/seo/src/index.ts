import type { Metadata } from "next";

import { APP_BRANDS, formatAppPageTitle, type AppBrandId } from "@repo/brand";
import { isApplicationHost } from "@repo/platform";

const MAX_METADATA_DESCRIPTION_LENGTH = 160;

export interface PublicPageMetadataInput {
  appId: AppBrandId;
  siteUrl: string;
  title: string;
  description: string;
  pathname: string;
  image: string;
  imageMetadata?: {
    width: number;
    height: number;
    type?: string;
  };
}

export function normalizeMetadataDescription(
  description: string,
  fallback: string,
): string {
  const normalized = description.replace(/\s+/g, " ").trim() || fallback;

  if (normalized.length <= MAX_METADATA_DESCRIPTION_LENGTH) {
    return normalized;
  }

  const shortened = normalized.slice(0, MAX_METADATA_DESCRIPTION_LENGTH - 1);
  const lastWordBoundary = shortened.lastIndexOf(" ");
  const safeCutoff =
    lastWordBoundary >= MAX_METADATA_DESCRIPTION_LENGTH * 0.7
      ? lastWordBoundary
      : shortened.length;

  return `${shortened.slice(0, safeCutoff).trimEnd()}…`;
}

export function buildPublicPageMetadata({
  appId,
  siteUrl,
  title,
  description,
  pathname,
  image,
  imageMetadata,
}: PublicPageMetadataInput): Metadata {
  const canonical = new URL(pathname, siteUrl).toString();
  const socialTitle = formatAppPageTitle(appId, title);
  const normalizedDescription = normalizeMetadataDescription(
    description,
    APP_BRANDS[appId].description,
  );
  const socialImage = imageMetadata
    ? { url: image, ...imageMetadata, alt: socialTitle }
    : { url: image };

  return {
    title,
    description: normalizedDescription,
    alternates: { canonical },
    openGraph: {
      type: "website",
      title: socialTitle,
      description: normalizedDescription,
      url: canonical,
      images: [socialImage],
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description: normalizedDescription,
      images: [image],
    },
  };
}

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

export function isIndexablePath(
  pathname: string,
  exactPaths: readonly string[],
  prefixes: readonly string[],
): boolean {
  return (
    exactPaths.includes(pathname) ||
    prefixes.some((prefix) => matchesPathOrChild(pathname, prefix))
  );
}

export function isCanonicalApplicationHost(
  appId: AppBrandId,
  host: string | null,
): boolean {
  return isApplicationHost(appId, host);
}
