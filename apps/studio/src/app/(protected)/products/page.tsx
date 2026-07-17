import type { Metadata } from "next";

import { StudioProductCatalog } from "@/components/studio/studio-product-catalog";
import { buildPublicPageMetadata } from "@/lib/seo/config";

export const metadata: Metadata = buildPublicPageMetadata({
  title: "Products",
  description:
    "Explore Studio tools, apps, games, and experiments with clear access requirements and launch destinations.",
  pathname: "/products",
});

export default function ProductsPage() {
  return <StudioProductCatalog />;
}
