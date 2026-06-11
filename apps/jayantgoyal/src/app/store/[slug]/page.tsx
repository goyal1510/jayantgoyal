import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CheckoutButton } from "@/components/commerce/checkout-button";
import { CommercePolicyLinks } from "@/components/commerce/policy-links";
import { getPublishedCommerceProductBySlug } from "@/lib/commerce/database.server";
import { trackCommerceEvent } from "@/lib/commerce/events.server";
import {
  formatCommerceInterval,
  formatCommercePrice,
} from "@/lib/commerce/format";
import {
  getPublicProductDescription,
  getPublicProductName,
} from "@/lib/commerce/public-copy";

export const dynamic = "force-dynamic";

async function getProduct(slug: string) {
  try {
    return await getPublishedCommerceProductBySlug(slug);
  } catch (error) {
    console.error("Unable to load store product:", error);
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    return {
      title: "Product not found | Store",
    };
  }

  const name = getPublicProductName(product);
  const description = getPublicProductDescription(product);

  return {
    title: `${name} | Store`,
    description,
    openGraph: {
      title: `${name} | Store | Jayant`,
      description,
      images: ["/assets/ProjectImages/Dark/tools.png"],
    },
  };
}

export default async function StoreProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) notFound();

  const primaryPrice = product.prices[0];
  trackCommerceEvent({
    eventType: "product_view",
    productId: product.id,
    priceId: primaryPrice?.id ?? null,
    source: "store_product_page",
    metadata: {
      slug: product.slug,
      productType: product.product_type,
    },
  });

  const productName = getPublicProductName(product);
  const productImage = product.image_url || "/assets/ProjectImages/Dark/tools.png";
  const priceLabel = primaryPrice
    ? `${formatCommercePrice(
        primaryPrice.unit_amount,
        primaryPrice.currency,
      )}${formatCommerceInterval(primaryPrice.billing_interval)}`
    : "Coming soon";

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-background text-foreground">
      <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 lg:px-8">
        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
          <div className="overflow-hidden rounded-lg border bg-muted/20">
            {/* eslint-disable-next-line @next/next/no-img-element -- Product media can be external; project guidance avoids next/image proxying for external URLs. */}
            <img
              src={productImage}
              alt={productName}
              className="aspect-[16/10] w-full object-cover"
            />
          </div>

          <div className="space-y-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-normal sm:text-3xl">
                {productName}
              </h1>
            </div>
            <div className="font-mono text-2xl font-semibold">{priceLabel}</div>
            <CheckoutButton priceId={primaryPrice?.id} className="w-full">
              Buy
            </CheckoutButton>
            <CommercePolicyLinks className="text-muted-foreground" />
          </div>
        </section>
      </div>
    </main>
  );
}
