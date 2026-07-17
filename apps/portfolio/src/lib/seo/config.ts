import type { Metadata } from "next";

import { APP_BRANDS, formatAppPageTitle, PERSON_BRAND } from "@repo/brand";

const PORTFOLIO_BRAND = APP_BRANDS.portfolio;
const FALLBACK_SITE_URL = PORTFOLIO_BRAND.canonicalUrl;

function normalizeSiteUrl(value?: string): string {
  if (!value) return FALLBACK_SITE_URL;

  try {
    return new URL(value).origin;
  } catch {
    return FALLBACK_SITE_URL;
  }
}

export const SITE_URL = normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL);
export const PERSON_NAME = PERSON_BRAND.fullName;
export const SITE_NAME = PORTFOLIO_BRAND.publicName;
export const SITE_TITLE = PORTFOLIO_BRAND.defaultTitle;
export const SITE_TITLE_TEMPLATE = PORTFOLIO_BRAND.titleTemplate;
export const SITE_DESCRIPTION = PORTFOLIO_BRAND.description;
export const DEFAULT_OG_IMAGE = `${SITE_URL}/opengraph-image`;
export const LAST_SIGNIFICANT_UPDATE = "2026-07-17T00:00:00.000Z";

export function buildPublicPageMetadata({
  title,
  description,
  pathname,
}: {
  title: string;
  description: string;
  pathname: string;
}): Metadata {
  const url = new URL(pathname, SITE_URL).toString();
  const socialTitle = formatAppPageTitle("portfolio", title);

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: socialTitle,
      description,
      url,
      images: [{ url: DEFAULT_OG_IMAGE }],
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description,
      images: [DEFAULT_OG_IMAGE],
    },
  };
}

export function isCanonicalProductionHost(host: string | null): boolean {
  const hostname = host?.split(":")[0]?.toLowerCase();
  return hostname === "jayantgoyal.com" || hostname === "www.jayantgoyal.com";
}
