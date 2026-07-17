import Link from "next/link";
import { ArrowUpRight, LockKeyhole } from "lucide-react";

import { Badge } from "@repo/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/card";
import { cn } from "@repo/ui/lib/utils";

import { type StudioProduct } from "@/lib/config/studio-inventory";

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

const typeTones: Record<StudioProduct["type"], string> = {
  app: "border-border/80 bg-card",
  game: "border-[#cfc0e4] bg-[#e8dcf5] text-[#211512] dark:border-[#5c5068] dark:bg-[#2f2938] dark:text-[#fff8ef]",
  tool: "border-[#d93328] bg-[#ff5a4f] text-[#211512]",
  experiment:
    "border-[#bdc4a3] bg-[#d9ddc3] text-[#211512] dark:border-[#4b594b] dark:bg-[#29312a] dark:text-[#fff8ef]",
};

export function StudioProductCard({
  product,
  detailsHref,
}: {
  product: StudioProduct;
  detailsHref: string;
}) {
  return (
    <Link
      href={detailsHref}
      aria-label={`View ${product.name} details`}
      onClick={() => window.scrollTo({ top: 0, behavior: "auto" })}
      className="group block h-full rounded-[1.75rem] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <Card
        className={cn(
          "flex h-full min-h-[24rem] flex-col overflow-hidden rounded-[1.75rem] shadow-none transition-transform duration-300 group-hover:-translate-y-1",
          typeTones[product.type],
        )}
      >
        <CardHeader className="gap-7 p-7 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <span className="inline-flex size-14 items-center justify-center rounded-2xl border border-current/15 bg-white/15">
              <product.icon className="size-7" strokeWidth={1.7} />
            </span>
            <div className="flex flex-wrap justify-end gap-2">
              <Badge className="border-current/15 bg-white/25 text-current shadow-none hover:bg-white/25 dark:bg-black/10">
                {typeLabels[product.type]}
              </Badge>
              <Badge
                variant="outline"
                className={cn(
                  "border-current/20 bg-transparent text-current",
                  product.access === "account" && "gap-1.5",
                )}
              >
                {product.access === "account" ? (
                  <LockKeyhole className="size-3" />
                ) : null}
                {accessLabels[product.access]}
              </Badge>
            </div>
          </div>
          <div className="space-y-4">
            <CardTitle className="text-3xl leading-none tracking-[-0.04em]">
              {product.name}
            </CardTitle>
            <CardDescription className="text-base leading-7 text-current opacity-85">
              {product.description}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="mt-auto flex items-end justify-between gap-4 p-7 pt-0 sm:p-8 sm:pt-0">
          <span className="max-w-[65%] font-[family-name:var(--font-ibm-plex-mono)] text-[0.7rem] font-medium uppercase tracking-[0.15em] opacity-85">
            {product.capability}
          </span>
          <span className="inline-flex size-12 items-center justify-center rounded-full border border-current/25 transition-colors group-hover:bg-white/25">
            <ArrowUpRight className="size-5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </span>
        </CardContent>
      </Card>
    </Link>
  );
}
