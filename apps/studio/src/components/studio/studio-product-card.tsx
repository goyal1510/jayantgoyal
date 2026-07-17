import Link from "next/link";
import { ArrowRight, LockKeyhole } from "lucide-react";

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
  studioProductDetailHref,
  type StudioProduct,
} from "@/lib/config/studio-inventory";

const accessLabels: Record<StudioProduct["access"], string> = {
  public: "Public",
  account: "Account",
  external: "External",
};

const typeLabels: Record<StudioProduct["type"], string> = {
  app: "App",
  game: "Game",
  tool: "Tool",
  experiment: "Experiment",
};

export function StudioProductCard({ product }: { product: StudioProduct }) {
  return (
    <Card className="group h-full transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg">
      <CardHeader className="gap-4">
        <div className="flex items-start justify-between gap-4">
          <span className="inline-flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <product.icon className="size-5" />
          </span>
          <div className="flex flex-wrap justify-end gap-2">
            <Badge variant="secondary">{typeLabels[product.type]}</Badge>
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
          <Link href={studioProductDetailHref(product)}>
            Details
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
