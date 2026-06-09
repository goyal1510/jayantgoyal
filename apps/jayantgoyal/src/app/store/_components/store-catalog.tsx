"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  PackageOpen,
  PackageSearch,
  Search,
  SlidersHorizontal,
} from "lucide-react";

import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";

import { CheckoutButton } from "@/components/commerce/checkout-button";
import {
  formatCommerceInterval,
  formatCommercePrice,
} from "@/lib/commerce/format";
import type {
  CommerceProductType,
  CommerceProductWithPrices,
} from "@/lib/commerce/types";

type CatalogSort = "featured" | "price-low" | "price-high";
type CatalogFilter = "all" | CommerceProductType;

const filterOptions: { label: string; value: CatalogFilter }[] = [
  { label: "All", value: "all" },
  { label: "Digital", value: "digital" },
  { label: "Services", value: "service" },
  { label: "Bundles", value: "bundle" },
  { label: "Subscriptions", value: "subscription" },
];

function productPrice(product: CommerceProductWithPrices) {
  return product.prices[0]?.unit_amount ?? Number.POSITIVE_INFINITY;
}

function priceLabel(product: CommerceProductWithPrices) {
  const primaryPrice = product.prices[0];
  if (!primaryPrice) return "Price coming soon";

  return `${formatCommercePrice(
    primaryPrice.unit_amount,
    primaryPrice.currency,
  )}${formatCommerceInterval(primaryPrice.billing_interval)}`;
}

export function StoreCatalog({
  products,
}: {
  products: CommerceProductWithPrices[];
}) {
  const [query, setQuery] = React.useState("");
  const [filter, setFilter] = React.useState<CatalogFilter>("all");
  const [sort, setSort] = React.useState<CatalogSort>("featured");

  const filteredProducts = React.useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return [...products]
      .filter((product) => {
        if (filter !== "all" && product.product_type !== filter) return false;
        if (!normalizedQuery) return true;

        return [
          product.name,
          product.short_description,
          product.description,
          product.product_type,
        ]
          .filter(Boolean)
          .some((value) => value!.toLowerCase().includes(normalizedQuery));
      })
      .sort((a, b) => {
        if (sort === "price-low") return productPrice(a) - productPrice(b);
        if (sort === "price-high") return productPrice(b) - productPrice(a);
        return a.sort_order - b.sort_order || a.name.localeCompare(b.name);
      });
  }, [filter, products, query, sort]);

  if (products.length === 0) {
    return (
      <div className="rounded-lg border border-dashed bg-white p-8 text-center">
        <PackageOpen className="mx-auto h-10 w-10 text-zinc-500" />
        <h3 className="mt-4 text-lg font-semibold">
          Storefront is ready for products
        </h3>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-zinc-600">
          The commerce schema and API are wired. Add published products and
          active prices in the admin commerce phase to start selling.
        </p>
        <Button asChild className="mt-5">
          <Link href="/pricing">View pricing plan</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-3 rounded-lg border border-stone-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900 xl:grid-cols-[minmax(0,1fr)_auto]">
        <label className="relative block">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-stone-500 dark:text-zinc-400" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search products, services, bundles..."
            className="pl-9 dark:bg-zinc-950"
          />
        </label>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap gap-2">
            {filterOptions.map((option) => (
              <Button
                key={option.value}
                type="button"
                variant={filter === option.value ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </div>
          <div className="flex items-center gap-2 rounded-md border border-stone-200 px-2 py-1 dark:border-zinc-800">
            <SlidersHorizontal className="size-4 text-stone-500 dark:text-zinc-400" />
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as CatalogSort)}
              className="h-8 bg-transparent text-sm outline-none dark:bg-zinc-900"
              aria-label="Sort catalog"
            >
              <option value="featured">Featured</option>
              <option value="price-low">Price low to high</option>
              <option value="price-high">Price high to low</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-stone-600 dark:text-zinc-400">
        <span>
          {filteredProducts.length} of {products.length} product
          {products.length === 1 ? "" : "s"}
        </span>
        <span>Checkout, access, delivery, and support stay account-bound.</span>
      </div>

      {filteredProducts.length > 0 ? (
        <div className="overflow-hidden rounded-lg border border-stone-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <div className="hidden grid-cols-[minmax(0,1.4fr)_130px_120px_140px_210px] border-b border-stone-200 px-5 py-3 text-xs font-medium uppercase tracking-wide text-stone-500 dark:border-zinc-800 dark:text-zinc-500 lg:grid">
            <span>Product</span>
            <span>Type</span>
            <span>Price</span>
            <span>Status</span>
            <span className="text-right">Actions</span>
          </div>
          {filteredProducts.map((product) => {
            const primaryPrice = product.prices[0];

            return (
              <div
                key={product.id}
                className="grid gap-4 border-b border-stone-200 px-5 py-5 last:border-b-0 dark:border-zinc-800 lg:grid-cols-[minmax(0,1.4fr)_130px_120px_140px_210px] lg:items-center"
              >
                <div className="flex min-w-0 gap-3">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-md border border-stone-200 bg-stone-100 text-stone-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
                    <PackageSearch className="size-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base font-semibold leading-6">
                      {product.name}
                    </h3>
                    <p className="mt-1 max-w-2xl text-sm leading-6 text-stone-600 dark:text-zinc-400">
                      {product.short_description ??
                        product.description ??
                        "Product details are coming soon."}
                    </p>
                  </div>
                </div>
                <div>
                  <div className="mb-1 text-xs font-medium uppercase tracking-wide text-stone-500 dark:text-zinc-500 lg:hidden">
                    Type
                  </div>
                  <Badge variant="secondary" className="capitalize">
                    {product.product_type}
                  </Badge>
                </div>
                <div>
                  <div className="mb-1 text-xs font-medium uppercase tracking-wide text-stone-500 dark:text-zinc-500 lg:hidden">
                    Price
                  </div>
                  <div className="w-fit rounded-md bg-stone-100 px-2 py-1 font-mono text-sm font-semibold dark:bg-zinc-950">
                    {priceLabel(product)}
                  </div>
                </div>
                <div>
                  <div className="mb-1 text-xs font-medium uppercase tracking-wide text-stone-500 dark:text-zinc-500 lg:hidden">
                    Status
                  </div>
                  <div className="flex w-fit items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                    <CheckCircle2 className="size-3.5" />
                    Published
                  </div>
                </div>
                <div className="grid gap-2 sm:grid-cols-2 lg:justify-end">
                  <Button asChild variant="outline">
                    <Link href={`/store/${product.slug}`}>
                      Details
                      <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                  <CheckoutButton priceId={primaryPrice?.id}>Buy</CheckoutButton>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-stone-300 bg-white p-8 text-center dark:border-zinc-700 dark:bg-zinc-900">
          <Search className="mx-auto h-10 w-10 text-stone-500 dark:text-zinc-400" />
          <h3 className="mt-4 text-lg font-semibold">No products match</h3>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-stone-600 dark:text-zinc-400">
            Clear the search or switch category filters to see the full catalog.
          </p>
          <Button
            type="button"
            className="mt-5"
            onClick={() => {
              setQuery("");
              setFilter("all");
            }}
          >
            Reset catalog
          </Button>
        </div>
      )}
    </div>
  );
}
