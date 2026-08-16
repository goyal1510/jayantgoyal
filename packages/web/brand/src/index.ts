import {
  PERSON_IDENTITY,
  PRODUCT_IDENTITIES,
  type ProductId,
} from "@jayant/identity";

export * from "./assets";

const PORTFOLIO_ORIGIN = "https://jayantgoyal.com";

export const PERSON_BRAND = {
  ...PERSON_IDENTITY,
  canonicalUrl: PORTFOLIO_ORIGIN,
} as const;

export const APP_BRANDS = {
  portfolio: {
    ...PRODUCT_IDENTITIES.portfolio,
    canonicalUrl: PORTFOLIO_ORIGIN,
    defaultTitle: `${PERSON_IDENTITY.fullName} | Software Engineer`,
    titleTemplate: `%s | ${PERSON_IDENTITY.fullName}`,
    description: `The portfolio of ${PERSON_IDENTITY.fullName}, a software engineer shaping clear, dependable digital products from idea through delivery.`,
  },
  studio: {
    ...PRODUCT_IDENTITIES.studio,
    canonicalUrl: "https://studio.jayantgoyal.com",
    defaultTitle: `Studio by ${PERSON_IDENTITY.fullName} | Apps, Tools, and Experiments`,
    titleTemplate: "%s | Studio",
    description: `Explore apps, developer tools, games, personal workspaces, and experiments built by ${PERSON_IDENTITY.fullName}.`,
  },
  admin: {
    ...PRODUCT_IDENTITIES.admin,
    canonicalUrl: "https://admin.jayantgoyal.com",
    defaultTitle: `Admin by ${PERSON_IDENTITY.fullName}`,
    titleTemplate: "%s | Admin",
    description: `Private administration for ${PERSON_IDENTITY.fullName}'s portfolio content and application operations.`,
  },
  auth: {
    ...PRODUCT_IDENTITIES.auth,
    canonicalUrl: "https://auth.jayantgoyal.com",
    defaultTitle: `Auth by ${PERSON_IDENTITY.fullName}`,
    titleTemplate: "%s | Auth",
    description: `Secure sign-in and account security for ${PERSON_IDENTITY.fullName}'s applications.`,
  },
} as const satisfies Record<ProductId, object>;

const SOCIAL_PREVIEW_VERSION = "20260727";

export const APP_SOCIAL_PREVIEW_IMAGES = {
  portfolio: {
    url: `${PORTFOLIO_ORIGIN}/images/social/portfolio-preview.jpg?v=${SOCIAL_PREVIEW_VERSION}`,
    width: 1200,
    height: 630,
    type: "image/jpeg",
    alt: `${PERSON_IDENTITY.fullName}'s Software Engineer portfolio`,
  },
  studio: {
    url: `${PORTFOLIO_ORIGIN}/images/social/studio-preview.jpg?v=${SOCIAL_PREVIEW_VERSION}`,
    width: 1200,
    height: 630,
    type: "image/jpeg",
    alt: `Studio apps, tools, and experiments by ${PERSON_IDENTITY.fullName}`,
  },
  admin: {
    url: `${PORTFOLIO_ORIGIN}/images/social/admin-preview.jpg?v=${SOCIAL_PREVIEW_VERSION}`,
    width: 1200,
    height: 630,
    type: "image/jpeg",
    alt: `Admin content management system by ${PERSON_IDENTITY.fullName}`,
  },
  auth: {
    url: `${PORTFOLIO_ORIGIN}/images/social/auth-preview.jpg?v=${SOCIAL_PREVIEW_VERSION}`,
    width: 1200,
    height: 630,
    type: "image/jpeg",
    alt: `Auth account security application by ${PERSON_IDENTITY.fullName}`,
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
