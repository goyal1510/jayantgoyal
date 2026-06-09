import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Files,
  LifeBuoy,
  PackageCheck,
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
      title: "Product not found | Jayant Tools",
    };
  }

  return {
    title: `${product.name} | Jayant Tools Store`,
    description:
      product.short_description ??
      product.description ??
      "Jayant Tools product detail.",
    openGraph: {
      title: `${product.name} | Jayant Tools Store`,
      description:
        product.short_description ??
        product.description ??
        "Jayant Tools product detail.",
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
  const priceLabel = primaryPrice
    ? `${formatCommercePrice(
        primaryPrice.unit_amount,
        primaryPrice.currency,
      )}${formatCommerceInterval(primaryPrice.billing_interval)}`
    : "Price coming soon";
  const deliveryPlan =
    metadataString(product.metadata, "delivery_plan") ??
    "Access details appear in your account purchase library after payment verification.";
  const launchNote = metadataString(product.metadata, "launch_note");
  const productSummary =
    product.description ??
    product.short_description ??
    "Product details are coming soon.";

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-stone-50 text-stone-950 dark:bg-zinc-950 dark:text-zinc-50">
      <section className="border-b border-stone-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_440px] lg:px-8">
          <div className="space-y-6">
            <Button asChild variant="ghost" className="px-0">
              <Link href="/store">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to store
              </Link>
            </Button>
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <Badge className="capitalize">{product.product_type}</Badge>
                <span className="text-sm text-stone-500 dark:text-zinc-400">
                  Account-bound access
                </span>
              </div>
              <h1 className="text-4xl font-semibold tracking-normal text-balance sm:text-5xl">
                {product.name}
              </h1>
              <p className="max-w-2xl text-base leading-7 text-stone-600 dark:text-zinc-300">
                {productSummary}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-lg border border-stone-200 bg-stone-50 px-4 py-2 font-mono text-lg font-semibold dark:border-zinc-800 dark:bg-zinc-900">
                {priceLabel}
              </div>
              <CheckoutButton priceId={primaryPrice?.id}>
                Buy product
              </CheckoutButton>
            </div>
            {launchNote ? (
              <div className="rounded-lg border border-amber-500/30 bg-amber-50 p-4 text-sm leading-6 text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
                {launchNote}
              </div>
            ) : null}
            <CommercePolicyLinks className="text-stone-500 dark:text-zinc-400" />
          </div>

          <div className="space-y-4">
            <div className="rounded-lg border border-stone-200 bg-stone-950 p-3 shadow-sm dark:border-zinc-800">
              <Image
                src="/assets/ProjectImages/Dark/tools.png"
                alt="Jayant Tools workspace"
                width={900}
                height={675}
                className="aspect-[16/10] rounded-md object-cover"
                priority
              />
              <div className="mt-3 grid grid-cols-2 gap-3">
                <Image
                  src="/assets/ProjectImages/Dark/files.png"
                  alt="Purchase delivery files"
                  width={520}
                  height={390}
                  className="aspect-[4/3] rounded-md object-cover"
                />
                <Image
                  src="/assets/ProjectImages/Dark/custom-calculator.png"
                  alt="Workspace utility builder"
                  width={520}
                  height={390}
                  className="aspect-[4/3] rounded-md object-cover"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                ["Checkout", "Razorpay"],
                ["Receipt", "Ready"],
                ["Support", "Linked"],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-lg border border-stone-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <div className="text-sm font-semibold">{value}</div>
                  <div className="mt-1 text-xs uppercase tracking-wide text-stone-500 dark:text-zinc-400">
                    {label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 px-4 py-6 sm:px-6 lg:grid-cols-3 lg:px-8">
        {[
          {
            icon: PackageCheck,
            title: "Delivery plan",
            body: deliveryPlan,
            tone: "text-emerald-600 dark:text-emerald-400",
          },
          {
            icon: ShieldCheck,
            title: "Account access",
            body: "Payment is verified server-side. Your order, receipt, downloads, and support state stay linked to your signed-in account.",
            tone: "text-sky-600 dark:text-sky-400",
          },
          {
            icon: LifeBuoy,
            title: "Support included",
            body: "Every paid order can open a support thread with the product, payment, and delivery context attached automatically.",
            tone: "text-amber-600 dark:text-amber-400",
          },
        ].map((item) => (
          <div
            key={item.title}
            className="rounded-lg border border-stone-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <item.icon className={`size-5 ${item.tone}`} />
            <h2 className="mt-4 font-semibold">{item.title}</h2>
            <p className="mt-2 text-sm leading-6 text-stone-600 dark:text-zinc-400">
              {item.body}
            </p>
          </div>
        ))}
      </section>

      <section className="border-y border-stone-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 py-6 sm:px-6 md:grid-cols-4 lg:px-8">
          {[
            {
              icon: CheckCircle2,
              title: "Secure checkout",
              body: "Provider order and app order stay linked.",
            },
            {
              icon: ReceiptText,
              title: "Receipt",
              body: "Printable receipt appears after purchase.",
            },
            {
              icon: Clock3,
              title: "Access status",
              body: "Delivery readiness is visible in Purchases.",
            },
            {
              icon: Files,
              title: "Delivery",
              body: "Links, files, manual work, or service details.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-lg border border-stone-200 bg-stone-50 p-4 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <item.icon className="h-5 w-5 text-stone-700 dark:text-zinc-300" />
              <p className="mt-3 text-sm font-medium">{item.title}</p>
              <p className="mt-1 text-sm leading-6 text-stone-600 dark:text-zinc-400">
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
