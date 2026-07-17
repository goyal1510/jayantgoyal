import Link from "next/link";
import {
  ArrowRight,
  ExternalLink,
  LayoutGrid,
  LockKeyhole,
} from "lucide-react";

import { APP_BRANDS } from "@repo/brand";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/card";
import { cn } from "@repo/ui/lib/utils";

import {
  STUDIO_PRODUCTS,
  type StudioProduct,
} from "@/lib/config/studio-inventory";

const accessLabels: Record<StudioProduct["access"], string> = {
  public: "Public",
  account: "Account",
  external: "External",
};

export function StudioInventory() {
  const publicProducts = STUDIO_PRODUCTS.filter(
    (product) => product.access === "public",
  );
  const personalProducts = STUDIO_PRODUCTS.filter(
    (product) => product.access === "account",
  );
  const externalProducts = STUDIO_PRODUCTS.filter(
    (product) => product.access === "external",
  );

  return (
    <div className="mx-auto w-full max-w-7xl space-y-14 py-8 sm:py-12">
      <section className="overflow-hidden rounded-3xl border bg-gradient-to-br from-card via-card to-primary/10 px-6 py-12 sm:px-10 lg:px-14">
        <div className="max-w-3xl space-y-6">
          <Badge variant="secondary" className="gap-2">
            <LayoutGrid className="size-3.5" />
            Product inventory
          </Badge>
          <div className="space-y-4">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              {APP_BRANDS.studio.publicName}
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-muted-foreground sm:text-xl">
              A growing collection of useful tools, personal workspaces, games,
              and experiments—organized by what you can use right now.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/tools">
                Explore Tech Tools
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/welcome">Sign in to personal workspaces</Link>
            </Button>
          </div>
        </div>
      </section>

      <InventoryGroup
        title="Use without an account"
        description="Open workspaces you can explore immediately."
        products={publicProducts}
      />
      <InventoryGroup
        title="Personal workspaces"
        description="Private data and collaboration features that require an account."
        products={personalProducts}
      />
      <InventoryGroup
        title="Independent applications"
        description="Related applications with their own deployment and experience."
        products={externalProducts}
      />
    </div>
  );
}

function InventoryGroup({
  title,
  description,
  products,
}: {
  title: string;
  description: string;
  products: StudioProduct[];
}) {
  const headingId = `${title.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-")}-heading`;

  return (
    <section className="space-y-6" aria-labelledby={headingId}>
      <div className="space-y-2">
        <h2
          id={headingId}
          className="text-2xl font-semibold tracking-tight sm:text-3xl"
        >
          {title}
        </h2>
        <p className="text-muted-foreground">{description}</p>
      </div>
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}

function ProductCard({ product }: { product: StudioProduct }) {
  const isExternal = product.access === "external";

  return (
    <Card className="group h-full transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg">
      <CardHeader className="gap-4">
        <div className="flex items-start justify-between gap-4">
          <span className="inline-flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <product.icon className="size-5" />
          </span>
          <Badge
            variant="outline"
            className={cn(product.access === "account" && "gap-1.5")}
          >
            {product.access === "account" ? (
              <LockKeyhole className="size-3" />
            ) : null}
            {accessLabels[product.access]}
          </Badge>
        </div>
        <div className="space-y-2">
          <CardTitle>{product.name}</CardTitle>
          <CardDescription className="leading-6">
            {product.description}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="mt-auto flex items-center justify-between gap-4">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {product.capability}
        </span>
        <Button asChild variant="ghost" size="sm">
          <Link
            href={product.href}
            target={isExternal ? "_blank" : undefined}
            rel={isExternal ? "noreferrer" : undefined}
          >
            Open
            {isExternal ? (
              <ExternalLink className="size-4" />
            ) : (
              <ArrowRight className="size-4" />
            )}
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
