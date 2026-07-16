import type { Metadata } from "next";

import { normalizeHostname } from "@/lib/platform/surface";
import { STUDIO_URL } from "@/lib/platform/urls";

export const SITE_URL = "https://www.jayantgoyal.com";
export const PERSON_NAME = "Jayant Goyal";
export const SITE_NAME = PERSON_NAME;
export const SITE_TITLE = `${PERSON_NAME} | Full-Stack Developer`;
export const SITE_DESCRIPTION =
  "Full-stack developer portfolio by Jayant Goyal. Explore projects, 99+ developer tools, games, and utilities built with Next.js, React, TypeScript, and Supabase.";
export const DEFAULT_OG_IMAGE = `${SITE_URL}/opengraph-image?v=5`;
export const STUDIO_SITE_NAME = "Jayant Goyal Studio";
export const STUDIO_SITE_TITLE =
  "Jayant Goyal Studio | Tools, Apps, and Experiments";
export const STUDIO_SITE_DESCRIPTION =
  "Explore developer tools, personal workspaces, games, utilities, and experiments in Jayant Goyal Studio.";
export const STUDIO_DEFAULT_OG_IMAGE = `${STUDIO_URL}/opengraph-image?v=5`;
export const LAST_SIGNIFICANT_UPDATE = "2026-06-24T00:00:00.000Z";

export const INDEXABLE_EXACT_PATHS = ["/", "/about", "/terms-conditions"] as const;
export const INDEXABLE_PREFIXES = [
  "/tools",
  "/blogs",
  "/blog",
  "/weather",
  "/custom-calculator",
  "/github-stats",
] as const;
export const STUDIO_INDEXABLE_EXACT_PATHS = [
  "/",
  "/terms-conditions",
] as const;
export const STUDIO_INDEXABLE_PREFIXES = [
  "/tools",
  "/weather",
  "/custom-calculator",
  "/github-stats",
] as const;

export function normalizePathname(pathname: string | null): string {
  if (!pathname || !pathname.startsWith("/")) return "/";
  if (pathname.length > 1 && pathname.endsWith("/")) return pathname.slice(0, -1);
  return pathname;
}

export function matchesPathOrChild(pathname: string, basePath: string): boolean {
  return pathname === basePath || pathname.startsWith(`${basePath}/`);
}

export function isIndexablePath(pathname: string): boolean {
  if (INDEXABLE_EXACT_PATHS.includes(pathname as (typeof INDEXABLE_EXACT_PATHS)[number])) {
    return true;
  }
  return INDEXABLE_PREFIXES.some((prefix) => matchesPathOrChild(pathname, prefix));
}

export function isStudioIndexablePath(pathname: string): boolean {
  if (
    STUDIO_INDEXABLE_EXACT_PATHS.includes(
      pathname as (typeof STUDIO_INDEXABLE_EXACT_PATHS)[number],
    )
  ) {
    return true;
  }
  return STUDIO_INDEXABLE_PREFIXES.some((prefix) =>
    matchesPathOrChild(pathname, prefix),
  );
}

export function isProductionStudioHost(host: string | null): boolean {
  return normalizeHostname(host) === "studio.jayantgoyal.com";
}

export function isProductionLegacyHost(host: string | null): boolean {
  const hostname = normalizeHostname(host);
  return hostname === "jayantgoyal.com" || hostname === "www.jayantgoyal.com";
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
  const image = "/opengraph-image?v=5";

  return {
    title,
    description,
    alternates: {
      canonical: pathname,
    },
    openGraph: {
      type: "website",
      title,
      description,
      url: pathname,
      images: [
        {
          url: image,
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
      images: [image],
    },
  };
}
