import { PERSON_IDENTITY } from "./person";
import { TECHNICAL_IDENTITY } from "./technical";

const primaryDomain = TECHNICAL_IDENTITY.primaryDomain;

/** Product names and infrastructure endpoints shared by every client layer. */
export const PRODUCT_IDENTITIES = {
  portfolio: {
    id: "portfolio",
    name: "Portfolio",
    publicName: PERSON_IDENTITY.displayName,
    canonicalOrigin: `https://${primaryDomain}`,
    canonicalHosts: [primaryDomain, `www.${primaryDomain}`],
    developmentOrigin: "http://localhost:3000",
  },
  studio: {
    id: "studio",
    name: "Studio",
    publicName: `Studio by ${PERSON_IDENTITY.displayName}`,
    canonicalOrigin: `https://studio.${primaryDomain}`,
    canonicalHosts: [`studio.${primaryDomain}`],
    developmentOrigin: "http://localhost:3001",
  },
  admin: {
    id: "admin",
    name: "Admin",
    publicName: `Admin by ${PERSON_IDENTITY.displayName}`,
    canonicalOrigin: `https://admin.${primaryDomain}`,
    canonicalHosts: [`admin.${primaryDomain}`],
    developmentOrigin: "http://localhost:3002",
  },
  auth: {
    id: "auth",
    name: "Auth",
    publicName: `Auth by ${PERSON_IDENTITY.displayName}`,
    canonicalOrigin: `https://auth.${primaryDomain}`,
    canonicalHosts: [`auth.${primaryDomain}`],
    developmentOrigin: "http://localhost:3003",
  },
} as const;

export type ProductId = keyof typeof PRODUCT_IDENTITIES;
export type ProductIdentity = (typeof PRODUCT_IDENTITIES)[ProductId];
