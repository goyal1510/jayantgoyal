import {
  PERSON_IDENTITY,
  PRODUCT_IDENTITIES,
  type ProductId,
} from "@jayantgoyal/identity";

export * from "./assets";

export const PERSON_BRAND = {
  ...PERSON_IDENTITY,
  canonicalUrl: PRODUCT_IDENTITIES.portfolio.canonicalOrigin,
} as const;

export const APP_BRANDS = {
  portfolio: {
    ...PRODUCT_IDENTITIES.portfolio,
    canonicalUrl: PRODUCT_IDENTITIES.portfolio.canonicalOrigin,
    defaultTitle: `${PERSON_IDENTITY.displayName} | Software Engineer`,
    titleTemplate: `%s | ${PERSON_IDENTITY.displayName}`,
    description: `The portfolio of ${PERSON_IDENTITY.displayName}, a software engineer shaping clear, dependable digital products from idea through delivery.`,
  },
  studio: {
    ...PRODUCT_IDENTITIES.studio,
    canonicalUrl: PRODUCT_IDENTITIES.studio.canonicalOrigin,
    defaultTitle: `Studio by ${PERSON_IDENTITY.displayName} | Apps, Tools, and Experiments`,
    titleTemplate: "%s | Studio",
    description: `Explore apps, developer tools, games, personal workspaces, and experiments built by ${PERSON_IDENTITY.displayName}.`,
  },
  admin: {
    ...PRODUCT_IDENTITIES.admin,
    canonicalUrl: PRODUCT_IDENTITIES.admin.canonicalOrigin,
    defaultTitle: `Admin by ${PERSON_IDENTITY.displayName}`,
    titleTemplate: "%s | Admin",
    description: `Private administration for ${PERSON_IDENTITY.displayName}'s portfolio content and application operations.`,
  },
  auth: {
    ...PRODUCT_IDENTITIES.auth,
    canonicalUrl: PRODUCT_IDENTITIES.auth.canonicalOrigin,
    defaultTitle: `Auth by ${PERSON_IDENTITY.displayName}`,
    titleTemplate: "%s | Auth",
    description: `Secure sign-in and account security for ${PERSON_IDENTITY.displayName}'s applications.`,
  },
} as const satisfies Record<ProductId, object>;

const SOCIAL_PREVIEW_VERSION = "20260816";

export const APP_SOCIAL_PREVIEW_IMAGES = {
  portfolio: {
    url: `${PRODUCT_IDENTITIES.portfolio.canonicalOrigin}/images/social/portfolio-preview.jpg?v=${SOCIAL_PREVIEW_VERSION}`,
    width: 1200,
    height: 630,
    type: "image/jpeg",
    alt: `${PERSON_IDENTITY.displayName}'s Software Engineer portfolio`,
  },
  studio: {
    url: `${PRODUCT_IDENTITIES.studio.canonicalOrigin}/images/social/studio-preview.jpg?v=${SOCIAL_PREVIEW_VERSION}`,
    width: 1200,
    height: 630,
    type: "image/jpeg",
    alt: `Studio apps, tools, and experiments by ${PERSON_IDENTITY.displayName}`,
  },
  admin: {
    url: `${PRODUCT_IDENTITIES.admin.canonicalOrigin}/images/social/admin-preview.jpg?v=${SOCIAL_PREVIEW_VERSION}`,
    width: 1200,
    height: 630,
    type: "image/jpeg",
    alt: `Admin content management system by ${PERSON_IDENTITY.displayName}`,
  },
  auth: {
    url: `${PRODUCT_IDENTITIES.auth.canonicalOrigin}/images/social/auth-preview.jpg?v=${SOCIAL_PREVIEW_VERSION}`,
    width: 1200,
    height: 630,
    type: "image/jpeg",
    alt: `Auth account security application by ${PERSON_IDENTITY.displayName}`,
  },
} as const;

export type AppBrandId = keyof typeof APP_BRANDS;
export type AppBrand = (typeof APP_BRANDS)[AppBrandId];

export function formatAppPageTitle(
  appId: AppBrandId,
  pageTitle: string,
): string {
  return APP_BRANDS[appId].titleTemplate.replace("%s", pageTitle);
}
