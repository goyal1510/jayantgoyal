import { APP_BRANDS } from "@jayantgoyal/web-brand";

const applicationCount = Object.keys(APP_BRANDS).length;

export const PRODUCT_PROOF_POINTS = [
  {
    label: "Product ownership",
    value: "Brief to production",
  },
  {
    label: "Platform architecture",
    value: `${applicationCount} purpose-built applications`,
  },
  {
    label: "Backend depth",
    value: "Auth · PostgreSQL · Storage · Realtime",
  },
  {
    label: "Delivery system",
    value: "CMS · CI · independent deploys",
  },
] as const;
