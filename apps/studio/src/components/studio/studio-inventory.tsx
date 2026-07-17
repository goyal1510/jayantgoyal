import Link from "next/link";
import { ArrowRight, LayoutGrid, LockKeyhole, Sparkles } from "lucide-react";

import { APP_BRANDS } from "@repo/brand";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@repo/ui/card";

import { StudioProductCard } from "@/components/studio/studio-product-card";
import {
  FEATURED_STUDIO_PRODUCTS,
  STUDIO_PRODUCTS,
} from "@/lib/config/studio-inventory";

const accessSummaries = [
  {
    access: "public",
    title: "Use without an account",
    description: "Open tools and apps you can explore immediately.",
    icon: Sparkles,
  },
  {
    access: "account",
    title: "Personal workspaces",
    description:
      "Private data and collaboration features tied to your account.",
    icon: LockKeyhole,
  },
  {
    access: "external",
    title: "Independent applications",
    description: "Related products with their own deployment and experience.",
    icon: LayoutGrid,
  },
] as const;

export function StudioInventory() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-14 py-8 sm:py-12">
      <section className="overflow-hidden rounded-3xl border bg-gradient-to-br from-card via-card to-primary/10 px-6 py-12 sm:px-10 lg:px-14">
        <div className="max-w-3xl space-y-6">
          <Badge variant="secondary" className="gap-2">
            <LayoutGrid className="size-3.5" />
            Product studio
          </Badge>
          <div className="space-y-4">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              {APP_BRANDS.studio.publicName}
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-muted-foreground sm:text-xl">
              Discover practical tools, personal workspaces, games, and
              experiments—then launch each product from one clear catalog.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/products">
                Explore products
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/welcome">Sign in to personal workspaces</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="space-y-6" aria-labelledby="featured-products">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-2">
            <h2
              id="featured-products"
              className="text-2xl font-semibold tracking-tight sm:text-3xl"
            >
              Featured products
            </h2>
            <p className="text-muted-foreground">
              A focused starting point across tools, games, and personal apps.
            </p>
          </div>
          <Button asChild variant="ghost">
            <Link href="/products">
              Browse all {STUDIO_PRODUCTS.length}
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {FEATURED_STUDIO_PRODUCTS.map((product) => (
            <StudioProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      <section
        className="grid gap-5 md:grid-cols-3"
        aria-label="Product access"
      >
        {accessSummaries.map((summary) => {
          const count = STUDIO_PRODUCTS.filter(
            (product) => product.access === summary.access,
          ).length;

          return (
            <Card key={summary.access}>
              <CardHeader>
                <span className="inline-flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <summary.icon className="size-5" />
                </span>
                <CardTitle>{summary.title}</CardTitle>
                <CardDescription>{summary.description}</CardDescription>
                <p className="pt-2 text-sm font-medium">
                  {count} {count === 1 ? "product" : "products"}
                </p>
              </CardHeader>
            </Card>
          );
        })}
      </section>
    </div>
  );
}
