import type { Metadata } from "next";

import { APP_BRANDS, APP_SOCIAL_PREVIEW_IMAGES } from "@jayantgoyal/web-brand";

const AUTH_BRAND = APP_BRANDS.auth;
const AUTH_PREVIEW = APP_SOCIAL_PREVIEW_IMAGES.auth;

export function buildAuthLandingMetadata(): Metadata {
  const canonical = new URL("/welcome", AUTH_BRAND.canonicalUrl).toString();

  return {
    title: { absolute: AUTH_BRAND.defaultTitle },
    description: AUTH_BRAND.description,
    alternates: { canonical },
    openGraph: {
      type: "website",
      locale: "en_US",
      url: canonical,
      siteName: AUTH_BRAND.publicName,
      title: AUTH_BRAND.defaultTitle,
      description: AUTH_BRAND.description,
      images: [AUTH_PREVIEW],
    },
    twitter: {
      card: "summary_large_image",
      title: AUTH_BRAND.defaultTitle,
      description: AUTH_BRAND.description,
      images: [AUTH_PREVIEW.url],
    },
    robots: { index: true, follow: true },
  };
}
