import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Check,
  Files,
  LifeBuoy,
  ReceiptText,
  ShieldCheck,
} from "lucide-react";

import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";

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

function metadataString(metadata: Record<string, unknown>, key: string) {
  const value = metadata[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
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
  const productSummary = getPublicProductDescription(product);
  const priceLabel = primaryPrice
    ? `${formatCommercePrice(
        primaryPrice.unit_amount,
        primaryPrice.currency,
      )}${formatCommerceInterval(primaryPrice.billing_interval)}`
    : "Coming soon";
  const deliveryPlan =
    metadataString(product.metadata, "delivery_plan") ??
    "Access appears in Purchases after payment.";

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-background text-foreground">
      <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 lg:px-8">
        <section className="border-b pb-5">
          <Button asChild variant="ghost" className="mb-4 px-0">
            <Link href="/store">
              <ArrowLeft className="mr-2 size-4" />
              Back to store
            </Link>
          </Button>

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="capitalize">
                  {product.product_type}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Account access
                </span>
              </div>
              <div>
                <h1 className="text-2xl font-semibold tracking-normal sm:text-3xl">
                  {productName}
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                  {productSummary}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="rounded-lg border bg-muted/40 px-3 py-2 font-mono text-lg font-semibold">
                  {priceLabel}
                </div>
                <CheckoutButton priceId={primaryPrice?.id}>
                  Buy product
                </CheckoutButton>
              </div>
              <CommercePolicyLinks className="text-muted-foreground" />
            </div>

            <div className="rounded-lg border bg-background p-4 shadow-sm">
              <h2 className="text-sm font-semibold">Included</h2>
              <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
                {[
                  "Purchase record",
                  "Receipt access",
                  deliveryPlan,
                  "Order support",
                ].map((item) => (
                  <li key={item} className="flex gap-2">
                    <Check className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="grid gap-3 py-5 text-sm text-muted-foreground sm:grid-cols-3">
          {[
            {
              icon: ShieldCheck,
              title: "Checkout",
              body: "Payment is verified server-side.",
            },
            {
              icon: ReceiptText,
              title: "Receipt",
              body: "Order details stay in Purchases.",
            },
            {
              icon: Files,
              title: "Delivery",
              body: deliveryPlan,
            },
            {
              icon: LifeBuoy,
              title: "Support",
              body: "Help stays linked to the order.",
            },
          ].map((item) => (
            <div key={item.title} className="rounded-lg border bg-background p-4">
              <item.icon className="size-5 text-foreground" />
              <h2 className="mt-3 font-medium text-foreground">{item.title}</h2>
              <p className="mt-1 leading-6">{item.body}</p>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
