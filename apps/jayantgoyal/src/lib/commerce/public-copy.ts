import type { CommerceProduct, CommerceProductWithPrices } from "./types";

type PublicProduct = Pick<
  CommerceProduct | CommerceProductWithPrices,
  "name" | "slug" | "short_description" | "description"
>;

const publicProductCopy: Record<string, { name: string; description: string }> = {
  "jayant-tools-starter-pass": {
    name: "Tools Access",
    description: "Access pass for Jayant tools.",
  },
};

export function getPublicProductName(product: PublicProduct) {
  return publicProductCopy[product.slug]?.name ?? product.name;
}

export function getPublicProductDescription(product: PublicProduct) {
  return (
    publicProductCopy[product.slug]?.description ??
    product.short_description ??
    product.description ??
    "Product details are coming soon."
  );
}
