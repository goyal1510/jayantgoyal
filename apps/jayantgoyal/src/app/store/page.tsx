import type { Metadata } from "next";
import Link from "next/link";
import { Check, ReceiptText, ShieldCheck } from "lucide-react";

import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";

import { CheckoutButton } from "@/components/commerce/checkout-button";
import { CommercePolicyLinks } from "@/components/commerce/policy-links";
import { listPublishedCommerceProducts } from "@/lib/commerce/database.server";
import {
  formatCommerceInterval,
  formatCommercePrice,
} from "@/lib/commerce/format";
import {
  getPublicProductDescription,
  getPublicProductName,
} from "@/lib/commerce/public-copy";
import type { CommerceProductWithPrices } from "@/lib/commerce/types";
import { StoreCatalog } from "./_components/store-catalog";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Store | Jayant Tools",
  description: "Buy Jayant Tools products and workspace access.",
  openGraph: {
    title: "Store | Jayant Tools",
    description: "Products, plans, checkout, and purchases in one place.",
    images: ["/assets/ProjectImages/Dark/tools.png"],
  },
};

const freeFeatures = ["Core tools", "Games", "Weather", "Calculator"];
const paidFeatures = ["Purchase history", "Receipts", "Delivery", "Support"];

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
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-2">
              <Badge variant="secondary" className="rounded-sm">
                Store
              </Badge>
              <h1 className="text-2xl font-semibold tracking-normal sm:text-3xl">
                Products and plans
              </h1>
              <p className="max-w-xl text-sm leading-6 text-muted-foreground">
                Buy access, view purchases, and manage delivery from your
                account.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild size="sm">
                <Link href="#catalog">Catalog</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href="#plans">Plans</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href="/account/purchases">Purchases</Link>
              </Button>
            </div>
          </div>
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
            <ul className="mt-4 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
              {freeFeatures.map((feature) => (
                <li key={feature} className="flex gap-2">
                  <Check className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
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
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {primaryPaidProduct
                ? getPublicProductDescription(primaryPaidProduct)
                : "Paid products will appear here once published."}
            </p>
            <ul className="mt-4 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
              {paidFeatures.map((feature) => (
                <li key={feature} className="flex gap-2">
                  <Check className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section id="catalog" className="py-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold tracking-normal">Catalog</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Search, filter, and buy.
              </p>
            </div>
            <CommercePolicyLinks className="hidden text-muted-foreground sm:flex" />
          </div>
          <StoreCatalog products={products} />
        </section>

        <section className="grid gap-3 border-t py-5 text-sm text-muted-foreground sm:grid-cols-2">
          <div className="rounded-lg border bg-background p-4">
            <ShieldCheck className="size-5 text-foreground" />
            <h3 className="mt-3 font-medium text-foreground">Secure checkout</h3>
            <p className="mt-1 leading-6">
              Payment verification and access are handled server-side.
            </p>
          </div>
          <div className="rounded-lg border bg-background p-4">
            <ReceiptText className="size-5 text-foreground" />
            <h3 className="mt-3 font-medium text-foreground">Receipts</h3>
            <p className="mt-1 leading-6">
              Purchases stay available from your account.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
