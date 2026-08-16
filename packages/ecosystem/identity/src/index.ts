export const PERSON_IDENTITY = {
  givenName: "Jayant",
  fullName: "Jayant",
  monogram: "JG",
} as const;

export const PRODUCT_IDENTITIES = {
  portfolio: {
    id: "portfolio",
    name: "Portfolio",
    publicName: PERSON_IDENTITY.fullName,
  },
  studio: {
    id: "studio",
    name: "Studio",
    publicName: `Studio by ${PERSON_IDENTITY.fullName}`,
  },
  admin: {
    id: "admin",
    name: "Admin",
    publicName: `Admin by ${PERSON_IDENTITY.fullName}`,
  },
  auth: {
    id: "auth",
    name: "Auth",
    publicName: `Auth by ${PERSON_IDENTITY.fullName}`,
  },
} as const;

export type ProductId = keyof typeof PRODUCT_IDENTITIES;
export type ProductIdentity = (typeof PRODUCT_IDENTITIES)[ProductId];
