import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { StudioProductDetail } from "@/components/studio/studio-product-detail";
import {
  STUDIO_PRODUCTS,
  getStudioProduct,
} from "@/lib/config/studio-inventory";
import { buildPublicPageMetadata } from "@/lib/seo/config";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return STUDIO_PRODUCTS.map((product) => ({ slug: product.id }));
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = getStudioProduct(slug);

  if (!product) return { title: "Product not found" };

  return buildPublicPageMetadata({
    title: product.name,
    description: product.description,
    pathname: `/products/${product.id}`,
  });
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = getStudioProduct(slug);

  if (!product) notFound();

  return <StudioProductDetail product={product} />;
}
