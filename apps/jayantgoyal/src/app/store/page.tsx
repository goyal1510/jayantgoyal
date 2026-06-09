import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Files,
  LifeBuoy,
  ReceiptText,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";

import { CommercePolicyLinks } from "@/components/commerce/policy-links";
import { listPublishedCommerceProducts } from "@/lib/commerce/database.server";
import { StoreCatalog } from "./_components/store-catalog";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Store | Jayant Tools",
  description:
    "Buy Jayant Tools products, templates, service packages, and workspace upgrades.",
  openGraph: {
    title: "Store | Jayant Tools",
    description:
      "Digital products, templates, service packages, and workspace upgrades for developers and creators.",
    images: ["/assets/ProjectImages/Dark/tools.png"],
  },
};

const buyerFlow = [
  {
    icon: CheckCircle2,
    title: "Checkout proof",
    body: "Razorpay test/live orders map to account-bound purchase records.",
  },
  {
    icon: Files,
    title: "Delivery layer",
    body: "Links, files, manual services, and versions stay attached to orders.",
  },
  {
    icon: LifeBuoy,
    title: "Support context",
    body: "Purchase questions carry the product, payment, and delivery state.",
  },
];

async function getProducts() {
  try {
    return await listPublishedCommerceProducts();
  } catch (error) {
    console.error("Unable to load store catalog:", error);
    return [];
  }
}

export default async function StorePage() {
  const products = await getProducts();
  const activeProducts = products.filter((product) => product.prices.length > 0);
  const digitalCount = products.filter(
    (product) => product.product_type === "digital",
  ).length;

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-stone-50 text-stone-950 dark:bg-zinc-950 dark:text-zinc-50">
      <section className="border-b border-stone-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-7 sm:px-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:px-8">
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <Badge className="w-fit bg-emerald-600 text-white hover:bg-emerald-600">
                Jayant Tools Store
              </Badge>
              <span className="text-sm text-stone-500 dark:text-zinc-400">
                Catalog, checkout, access, delivery
              </span>
            </div>
            <div className="max-w-3xl space-y-4">
              <h1 className="max-w-3xl text-4xl font-semibold leading-tight tracking-normal text-balance sm:text-[2.75rem]">
                Paid products inside the same workspace shell.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-stone-600 dark:text-zinc-300">
                The store is now part of the same app shell as tools, files,
                billing, and purchases. Buyers can browse publicly, then sign in
                only when checkout needs an account-bound order.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link href="#catalog">
                  Browse catalog
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/account/purchases">Purchase library</Link>
              </Button>
            </div>
            <CommercePolicyLinks className="text-stone-500 dark:text-zinc-400" />
          </div>

          <div className="grid gap-3">
            <div className="rounded-lg border border-stone-200 bg-stone-950 p-2.5 shadow-sm dark:border-zinc-800">
              <div className="grid grid-cols-2 gap-2">
                <Image
                  src="/assets/ProjectImages/Dark/tools.png"
                  alt="Jayant Tools workspace"
                  width={520}
                  height={390}
                  className="aspect-[4/3] rounded-md object-cover"
                  priority
                />
                <Image
                  src="/assets/ProjectImages/Dark/files.png"
                  alt="File delivery workspace"
                  width={520}
                  height={390}
                  className="aspect-[4/3] rounded-md object-cover"
                  priority
                />
              </div>
              <div className="mt-3 grid gap-2 text-sm text-zinc-300">
                {[
                  ["Checkout", "Public catalog, account checkout"],
                  ["Access", "Purchase library and delivery rows"],
                  ["Support", "Order-linked help context"],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="flex items-center justify-between gap-3 rounded-md border border-white/10 bg-white/[0.03] px-3 py-2"
                  >
                    <span className="text-zinc-500">{label}</span>
                    <span className="text-right text-zinc-200">{value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                ["Products", products.length.toString()],
                ["Priced", activeProducts.length.toString()],
                ["Digital", digitalCount.toString()],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-lg border border-stone-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <div className="text-xl font-semibold">{value}</div>
                  <div className="mt-1 text-xs uppercase tracking-wide text-stone-500 dark:text-zinc-400">
                    {label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-stone-200 bg-stone-100/70 dark:border-zinc-800 dark:bg-zinc-900/60">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 py-6 sm:px-6 md:grid-cols-3 lg:px-8">
          {buyerFlow.map((item) => (
            <div
              key={item.title}
              className="rounded-lg border border-stone-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950"
            >
              <item.icon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              <h2 className="mt-4 font-semibold">{item.title}</h2>
              <p className="mt-2 text-sm leading-6 text-stone-600 dark:text-zinc-400">
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section
        id="catalog"
        className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8"
      >
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm text-stone-500 dark:text-zinc-400">
              <Sparkles className="size-4 text-emerald-600 dark:text-emerald-400" />
              Sellable workspace catalog
            </div>
            <h2 className="text-2xl font-semibold">Catalog</h2>
            <p className="mt-1 text-sm text-stone-600 dark:text-zinc-400">
              Published commerce products appear here with checkout, delivery,
              receipt, and support state wired together.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
            <Search className="h-4 w-4" />
            Live catalog data
          </div>
        </div>

        <StoreCatalog products={products} />

        <div className="mt-6 grid gap-3 rounded-lg border border-stone-200 bg-white p-4 text-sm text-stone-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 md:grid-cols-3">
          <div className="flex gap-3">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            Payment verification is server-side.
          </div>
          <div className="flex gap-3">
            <ReceiptText className="mt-0.5 size-4 shrink-0 text-sky-600 dark:text-sky-400" />
            Receipts live in the purchase library.
          </div>
          <div className="flex gap-3">
            <LifeBuoy className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
            Support can stay attached to orders.
          </div>
        </div>
      </section>
    </main>
  );
}
