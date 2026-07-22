import type { Metadata } from "next";

import { StudioProductCatalog } from "@/components/studio/studio-product-catalog";
import {
  STUDIO_PRODUCT_TYPES,
  type StudioProductType,
} from "@/lib/config/studio-inventory";
import { buildPublicPageMetadata } from "@/lib/seo/config";

export const metadata: Metadata = buildPublicPageMetadata({
  title: "Products",
  description:
    "Explore Studio utilities, tools, apps, games, and experiments with clear access requirements and launch destinations.",
  pathname: "/products",
});

type ProductsPageProps = {
  searchParams: Promise<{ type?: string | string[] }>;
};

export default async function ProductsPage({
  searchParams,
}: ProductsPageProps) {
  const { type } = await searchParams;
  const requestedType = Array.isArray(type) ? type[0] : type;
  const initialType = STUDIO_PRODUCT_TYPES.includes(
    requestedType as StudioProductType,
  )
    ? (requestedType as StudioProductType)
    : "all";

  return <StudioProductCatalog initialType={initialType} />;
}
