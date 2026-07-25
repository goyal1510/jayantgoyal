export * from "./assets";

export const PERSON_BRAND = {
  givenName: "Jayant",
  fullName: "Jayant",
  monogram: "JG",
  canonicalUrl: "https://jayantgoyal.com",
} as const;

export const APP_BRANDS = {
  portfolio: {
    id: "portfolio",
    name: "Portfolio",
    publicName: PERSON_BRAND.fullName,
    canonicalUrl: PERSON_BRAND.canonicalUrl,
    defaultTitle: `${PERSON_BRAND.fullName} | Software Engineer`,
    titleTemplate: `%s | ${PERSON_BRAND.fullName}`,
    description: `The portfolio of ${PERSON_BRAND.fullName}, a software engineer shaping clear, dependable digital products from idea through delivery.`,
  },
  studio: {
    id: "studio",
    name: "Studio",
    publicName: `Studio by ${PERSON_BRAND.fullName}`,
    canonicalUrl: "https://studio.jayantgoyal.com",
    defaultTitle: `Studio by ${PERSON_BRAND.fullName} | Apps, Tools, and Experiments`,
    titleTemplate: "%s | Studio",
    description: `Explore apps, developer tools, games, personal workspaces, and experiments built by ${PERSON_BRAND.fullName}.`,
  },
  admin: {
    id: "admin",
    name: "Admin",
    publicName: `Admin by ${PERSON_BRAND.fullName}`,
    canonicalUrl: "https://admin.jayantgoyal.com",
    defaultTitle: `Admin by ${PERSON_BRAND.fullName}`,
    titleTemplate: "%s | Admin",
    description: `Private administration for ${PERSON_BRAND.fullName}'s portfolio content and platform operations.`,
  },
  auth: {
    id: "auth",
    name: "Auth",
    publicName: `Auth by ${PERSON_BRAND.fullName}`,
    canonicalUrl: "https://auth.jayantgoyal.com",
    defaultTitle: `Auth by ${PERSON_BRAND.fullName}`,
    titleTemplate: "%s | Auth",
    description: `Secure sign-in and account security for ${PERSON_BRAND.fullName}'s applications.`,
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
