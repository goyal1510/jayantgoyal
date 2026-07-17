export const PERSON_BRAND = {
  givenName: "Jayant",
  familyName: "Goyal",
  fullName: "Jayant Goyal",
  monogram: "JG",
  canonicalUrl: "https://jayantgoyal.com",
} as const;

export const APP_BRANDS = {
  portfolio: {
    id: "portfolio",
    name: "Portfolio",
    publicName: PERSON_BRAND.fullName,
    canonicalUrl: PERSON_BRAND.canonicalUrl,
    defaultTitle: `${PERSON_BRAND.fullName} | Full-Stack Developer`,
    titleTemplate: `%s | ${PERSON_BRAND.fullName}`,
    description: `The portfolio of ${PERSON_BRAND.fullName}, a full-stack developer building reliable products with Next.js, React, TypeScript, and Supabase.`,
  },
  studio: {
    id: "studio",
    name: "Studio",
    publicName: `Studio by ${PERSON_BRAND.fullName}`,
    canonicalUrl: "https://studio.jayantgoyal.com",
    defaultTitle: `Studio by ${PERSON_BRAND.fullName} | Apps, Tools, and Experiments`,
    titleTemplate: `%s | Studio by ${PERSON_BRAND.fullName}`,
    description: `Explore apps, developer tools, games, personal workspaces, and experiments built by ${PERSON_BRAND.fullName}.`,
  },
  admin: {
    id: "admin",
    name: "Admin",
    publicName: "Admin",
    canonicalUrl: "https://admin.jayantgoyal.com",
    defaultTitle: "Admin",
    titleTemplate: "%s | Admin",
    description:
      "Private administration for portfolio content and platform operations.",
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
