"use client";

import { useMemo, useState } from "react";
import { Button } from "@repo/ui/button";

import { StudioProductCard } from "@/components/studio/studio-product-card";
import {
  STUDIO_PRODUCTS,
  STUDIO_PRODUCT_TYPES,
  studioProductDetailHref,
  type StudioProductType,
} from "@/lib/config/studio-inventory";

const typeLabels: Record<StudioProductType, string> = {
  app: "Apps",
  utility: "Utilities",
  game: "Games",
  tool: "Tools",
  experiment: "Experiments",
};

export function StudioProductCatalog({
  initialType = "all",
}: {
  initialType?: StudioProductType | "all";
}) {
  const [selectedType, setSelectedType] = useState<StudioProductType | "all">(
    initialType,
  );
  const availableTypes = STUDIO_PRODUCT_TYPES.filter((type) =>
    STUDIO_PRODUCTS.some((product) => product.type === type),
  );
  const products = useMemo(
    () =>
      selectedType === "all"
        ? STUDIO_PRODUCTS
        : STUDIO_PRODUCTS.filter((product) => product.type === selectedType),
    [selectedType],
  );

  const selectType = (type: StudioProductType | "all") => {
    setSelectedType(type);
    window.history.replaceState(
      null,
      "",
      type === "all" ? "/products" : `/products?type=${type}`,
    );
  };

  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-6">
      <header className="max-w-4xl space-y-3">
        <h1 className="text-balance text-4xl font-semibold leading-none tracking-[-0.045em] sm:text-5xl">
          Studio products
        </h1>
        <p className="max-w-3xl text-base leading-7 text-muted-foreground">
          Utilities, tools, workspaces, games, and experiments in one catalog.
        </p>
      </header>

      <section className="space-y-4" aria-labelledby="product-results">
        <div className="flex flex-col gap-3 border-b border-border/80 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div
            className="flex flex-wrap gap-2"
            aria-label="Filter products by type"
          >
            <Button
              type="button"
              variant={selectedType === "all" ? "default" : "outline"}
              aria-pressed={selectedType === "all"}
              className="h-11 rounded-full px-5 shadow-none sm:h-9"
              onClick={() => selectType("all")}
            >
              All
            </Button>
            {availableTypes.map((type) => (
              <Button
                key={type}
                type="button"
                variant={selectedType === type ? "default" : "outline"}
                aria-pressed={selectedType === type}
                className="h-11 rounded-full px-5 shadow-none sm:h-9"
                onClick={() => selectType(type)}
              >
                {typeLabels[type]}
              </Button>
            ))}
          </div>

          <p
            id="product-results"
            className="font-[family-name:var(--font-ibm-plex-mono)] text-xs uppercase tracking-[0.14em] text-muted-foreground"
            aria-live="polite"
          >
            {products.length} {products.length === 1 ? "product" : "products"}
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {products.map((product) => (
            <StudioProductCard
              key={product.id}
              product={product}
              detailsHref={`${studioProductDetailHref(product)}${
                selectedType === "all" ? "" : `?type=${selectedType}`
              }`}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
