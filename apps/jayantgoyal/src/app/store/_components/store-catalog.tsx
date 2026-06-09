"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowRight,
  PackageOpen,
  Search,
  SlidersHorizontal,
} from "lucide-react";

import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import { Card, CardContent } from "@repo/ui/card";
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
      <div className="grid gap-3 rounded-lg border bg-white p-3 lg:grid-cols-[minmax(0,1fr)_auto]">
        <label className="relative block">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-500" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search products, services, bundles..."
            className="pl-9"
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
          <div className="flex items-center gap-2 rounded-md border px-2 py-1">
            <SlidersHorizontal className="size-4 text-zinc-500" />
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as CatalogSort)}
              className="h-8 bg-transparent text-sm outline-none"
              aria-label="Sort catalog"
            >
              <option value="featured">Featured</option>
              <option value="price-low">Price low to high</option>
              <option value="price-high">Price high to low</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-zinc-600">
        <span>
          {filteredProducts.length} of {products.length} product
          {products.length === 1 ? "" : "s"}
        </span>
        <span>Checkout, access, delivery, and support stay account-bound.</span>
      </div>

      {filteredProducts.length > 0 ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredProducts.map((product) => {
            const primaryPrice = product.prices[0];

            return (
              <Card key={product.id} className="overflow-hidden rounded-lg">
                {product.image_url ? (
                  <div
                    role="img"
                    aria-label={product.name}
                    className="aspect-[16/9] w-full bg-cover bg-center"
                    style={{ backgroundImage: `url(${product.image_url})` }}
                  />
                ) : null}
                <CardContent className="space-y-4 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <Badge variant="secondary" className="mb-3 capitalize">
                        {product.product_type}
                      </Badge>
                      <h3 className="text-lg font-semibold">{product.name}</h3>
                    </div>
                    <div className="shrink-0 font-mono text-sm font-semibold">
                      {priceLabel(product)}
                    </div>
                  </div>
                  <p className="min-h-12 text-sm leading-6 text-zinc-600">
                    {product.short_description ??
                      product.description ??
                      "Product details are coming soon."}
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Button asChild variant="outline">
                      <Link href={`/store/${product.slug}`}>
                        Details
                        <ArrowRight className="size-4" />
                      </Link>
                    </Button>
                    <CheckoutButton priceId={primaryPrice?.id}>
                      Buy
                    </CheckoutButton>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed bg-white p-8 text-center">
          <Search className="mx-auto h-10 w-10 text-zinc-500" />
          <h3 className="mt-4 text-lg font-semibold">No products match</h3>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-zinc-600">
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
