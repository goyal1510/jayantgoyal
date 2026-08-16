import type { Metadata, MetadataRoute } from "next";

import {
  APP_BRANDS,
  APP_SOCIAL_PREVIEW_IMAGES,
  BRAND_ASSET_PATHS,
  PERSON_BRAND,
  type AppBrandId,
} from "@jayantgoyal/web-brand";

export interface AppRootMetadataInput {
  appId: AppBrandId;
  siteUrl?: string;
  canonicalUrl?: string;
  title?: string;
  description?: string;
  type?: "website" | "profile";
  keywords?: string[];
  robots?: Metadata["robots"];
}

export interface AppManifestInput {
  appId: AppBrandId;
  backgroundColor: string;
  themeColor: string;
  startUrl?: string;
}

/** Builds the complete root metadata projection for one web client. */
export function buildAppRootMetadata({
  appId,
  siteUrl,
  canonicalUrl,
  title,
  description,
  type = "website",
  keywords,
  robots,
}: AppRootMetadataInput): Metadata {
  const brand = APP_BRANDS[appId];
  const preview = APP_SOCIAL_PREVIEW_IMAGES[appId];
  const resolvedSiteUrl = siteUrl ?? brand.canonicalUrl;
  const resolvedCanonicalUrl = canonicalUrl ?? resolvedSiteUrl;
  const resolvedTitle = title ?? brand.defaultTitle;
  const resolvedDescription = description ?? brand.description;

  return {
    metadataBase: new URL(resolvedSiteUrl),
    title: {
      default: resolvedTitle,
      template: brand.titleTemplate,
    },
    description: resolvedDescription,
    applicationName: brand.publicName,
    keywords,
    authors: [
      { name: PERSON_BRAND.displayName, url: PERSON_BRAND.canonicalUrl },
    ],
    creator: PERSON_BRAND.displayName,
    alternates: { canonical: resolvedCanonicalUrl },
    openGraph: {
      type,
      locale: "en_US",
      url: resolvedCanonicalUrl,
      siteName: brand.publicName,
      title: resolvedTitle,
      description: resolvedDescription,
      images: [preview],
    },
    twitter: {
      card: "summary_large_image",
      title: resolvedTitle,
      description: resolvedDescription,
      images: [preview.url],
    },
    robots,
    icons: {
      icon: [
        { url: BRAND_ASSET_PATHS.favicon },
        {
          url: BRAND_ASSET_PATHS.favicon32,
          sizes: "32x32",
          type: "image/png",
        },
        {
          url: BRAND_ASSET_PATHS.favicon16,
          sizes: "16x16",
          type: "image/png",
        },
      ],
      apple: [
        {
          url: BRAND_ASSET_PATHS.appleTouchIcon,
          sizes: "180x180",
          type: "image/png",
        },
      ],
    },
  };
}

/** Builds a consistently named installable-app manifest. */
export function buildAppManifest({
  appId,
  backgroundColor,
  themeColor,
  startUrl = "/",
}: AppManifestInput): MetadataRoute.Manifest {
  const brand = APP_BRANDS[appId];

  return {
    name: brand.publicName,
    short_name: brand.name,
    description: brand.description,
    start_url: startUrl,
    display: "standalone",
    background_color: backgroundColor,
    theme_color: themeColor,
    icons: [
      {
        src: BRAND_ASSET_PATHS.android192,
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: BRAND_ASSET_PATHS.android512,
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
