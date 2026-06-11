import type { Metadata } from "next";
import Link from "next/link";

import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";

import { CheckoutButton } from "@/components/commerce/checkout-button";
import { CommercePolicyLinks } from "@/components/commerce/policy-links";
import { listPublishedCommerceProducts } from "@/lib/commerce/database.server";
import {
  formatCommerceInterval,
  formatCommercePrice,
} from "@/lib/commerce/format";
import { getPublicProductName } from "@/lib/commerce/public-copy";
import type { CommerceProductWithPrices } from "@/lib/commerce/types";
import { StoreCatalog } from "./_components/store-catalog";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Store",
  description: "Buy Jayant products and workspace access.",
  openGraph: {
    title: "Store | Jayant",
    description: "Products, plans, checkout, and purchases in one place.",
    images: ["/assets/ProjectImages/Dark/tools.png"],
  },
};

async function getProducts() {
  try {
    return await listPublishedCommerceProducts();
  } catch (error) {
    console.error("Unable to load store catalog:", error);
    return [];
  }
}

function getPrimaryPaidProduct(products: CommerceProductWithPrices[]) {
  return (
    products.find(
      (product) => product.is_featured && product.prices.length > 0,
    ) ??
    products.find((product) => product.prices.length > 0) ??
    null
  );
}

function getPriceLabel(product: CommerceProductWithPrices | null) {
  const price = product?.prices[0];
  if (!price) return "Coming soon";

  return `${formatCommercePrice(price.unit_amount, price.currency)}${formatCommerceInterval(
    price.billing_interval,
  )}`;
}

export default async function StorePage() {
  const products = await getProducts();
  const primaryPaidProduct = getPrimaryPaidProduct(products);
  const primaryPaidPrice = primaryPaidProduct?.prices[0] ?? null;

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-background text-foreground">
      <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 lg:px-8">
        <section className="border-b pb-5">
          <h1 className="text-2xl font-semibold tracking-normal sm:text-3xl">
            Store
          </h1>
        </section>

        <section id="plans" className="grid gap-4 border-b py-5 lg:grid-cols-2">
          <div className="rounded-lg border bg-background p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <Badge variant="outline" className="rounded-sm">
                  Free
                </Badge>
                <h2 className="mt-3 text-lg font-semibold">Explore</h2>
                <div className="mt-1 font-mono text-2xl font-semibold">$0</div>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href="/welcome">Create account</Link>
              </Button>
            </div>
          </div>

          <div className="rounded-lg border border-foreground/25 bg-background p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <Badge className="rounded-sm">Paid</Badge>
                <h2 className="mt-3 text-lg font-semibold">
                  {primaryPaidProduct
                    ? getPublicProductName(primaryPaidProduct)
                    : "Paid access"}
                </h2>
                <div className="mt-1 font-mono text-2xl font-semibold">
                  {getPriceLabel(primaryPaidProduct)}
                </div>
              </div>
              <CheckoutButton
                priceId={primaryPaidPrice?.id}
                className="h-9 px-3 text-sm"
              >
                Buy
              </CheckoutButton>
            </div>
          </div>
        </section>

        <section id="catalog" className="py-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold tracking-normal">Products</h2>
            <CommercePolicyLinks className="hidden text-muted-foreground sm:flex" />
          </div>
          <StoreCatalog products={products} />
        </section>
      </div>
    </main>
  );
}
