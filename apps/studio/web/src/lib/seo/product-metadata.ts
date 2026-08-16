import type { Metadata } from "next";

import type { StudioProduct } from "@/lib/config/studio-inventory";
import { buildPublicPageMetadata } from "@/lib/seo/config";

export function buildStudioProductMetadata(product: StudioProduct): Metadata {
  return buildPublicPageMetadata({
    title: `${product.name} Product Overview`,
    description: product.description,
    pathname: `/products/${product.id}`,
  });
}
