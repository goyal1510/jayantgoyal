import type { Metadata } from "next";

import { formatAppPageTitle, type AppBrandId } from "@repo/brand";
import { isApplicationHost } from "@repo/platform";

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
  const socialImage = imageMetadata
    ? { url: image, ...imageMetadata, alt: socialTitle }
    : { url: image };

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: "website",
      title: socialTitle,
      description,
      url: canonical,
      images: [socialImage],
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description,
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
