"use client";

import { useMemo, useState } from "react";

import { Button } from "@repo/ui/button";

import { StudioProductCard } from "@/components/studio/studio-product-card";
import {
  STUDIO_PRODUCTS,
  STUDIO_PRODUCT_TYPES,
  type StudioProductType,
} from "@/lib/config/studio-inventory";

const typeLabels: Record<StudioProductType, string> = {
  app: "Apps",
  game: "Games",
  tool: "Tools",
  experiment: "Experiments",
};

export function StudioProductCatalog() {
  const [selectedType, setSelectedType] = useState<StudioProductType | "all">(
    "all",
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

  return (
    <div className="mx-auto w-full max-w-7xl space-y-10 py-8 sm:py-12">
      <header className="max-w-3xl space-y-4">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">
          Product catalog
        </p>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Explore Studio products
        </h1>
        <p className="text-lg leading-8 text-muted-foreground">
          Compare what each product does, see whether an account is required,
          and open a dedicated page before launching it.
        </p>
      </header>

      <div
        className="flex flex-wrap gap-2"
        aria-label="Filter products by type"
      >
        <Button
          type="button"
          variant={selectedType === "all" ? "default" : "outline"}
          aria-pressed={selectedType === "all"}
          onClick={() => setSelectedType("all")}
        >
          All
        </Button>
        {availableTypes.map((type) => (
          <Button
            key={type}
            type="button"
            variant={selectedType === type ? "default" : "outline"}
            aria-pressed={selectedType === type}
            onClick={() => setSelectedType(type)}
          >
            {typeLabels[type]}
          </Button>
        ))}
      </div>

      <p className="text-sm text-muted-foreground" aria-live="polite">
        Showing {products.length}{" "}
        {products.length === 1 ? "product" : "products"}
      </p>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {products.map((product) => (
          <StudioProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
