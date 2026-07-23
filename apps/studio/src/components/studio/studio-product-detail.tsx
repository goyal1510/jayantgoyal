import Link from "next/link";
import { ArrowRight, Check, ExternalLink, LockKeyhole } from "lucide-react";

import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card";
import { cn } from "@repo/ui/lib/utils";

import {
  studioProductDetailHref,
  type StudioProduct,
} from "@/lib/config/studio-inventory";
import { buildAbsoluteUrl } from "@/lib/seo/config";

const accessCopy: Record<
  StudioProduct["access"],
  { label: string; description: string }
> = {
  public: {
    label: "No account required",
    description: "Launch this product immediately.",
  },
  account: {
    label: "Account required",
    description: "Studio will ask you to sign in before opening the workspace.",
  },
  external: {
    label: "Independent application",
    description: "Launches in its own deployment and browser tab.",
  },
};

const typeLabels: Record<StudioProduct["type"], string> = {
  app: "App",
  game: "Game",
  tool: "Tool",
  experiment: "Experiment",
};

const statusLabels: Record<StudioProduct["status"], string> = {
  available: "Available",
  beta: "Beta",
};

const typeTones: Record<StudioProduct["type"], string> = {
  app: "border-border/80 bg-card",
  game: "border-[#cfc0e4] bg-[#e8dcf5] text-[#211512] dark:border-[#5c5068] dark:bg-[#2f2938] dark:text-[#fff8ef]",
  tool: "border-[#d93328] bg-[#ff5a4f] text-[#211512]",
  experiment:
    "border-[#bdc4a3] bg-[#d9ddc3] text-[#211512] dark:border-[#4b594b] dark:bg-[#29312a] dark:text-[#fff8ef]",
};

export function StudioProductDetail({ product }: { product: StudioProduct }) {
  const isExternal = product.access === "external";
  const access = accessCopy[product.access];
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: product.name,
    description: product.description,
    applicationCategory: product.type,
    operatingSystem: "Web",
    url: buildAbsoluteUrl(studioProductDetailHref(product)),
  };

  return (
    <article className="mx-auto w-full max-w-[1280px] space-y-6">
      <section
        className={cn(
          "overflow-hidden rounded-[2rem] border p-7 sm:p-8 lg:p-9",
          typeTones[product.type],
        )}
      >
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="max-w-3xl space-y-5">
            <span className="inline-flex size-14 items-center justify-center rounded-2xl border border-current/15 bg-white/15">
              <product.icon className="size-7" strokeWidth={1.7} />
            </span>
            <div className="flex flex-wrap gap-2">
              <Badge className="border-current/15 bg-white/25 text-current shadow-none hover:bg-white/25 dark:bg-black/10">
                {typeLabels[product.type]}
              </Badge>
              <Badge
                variant="outline"
                className="border-current/20 text-current"
              >
                {statusLabels[product.status]}
              </Badge>
            </div>
            <div className="space-y-4">
              <h1 className="text-balance text-4xl font-semibold leading-[0.98] tracking-[-0.055em] sm:text-5xl lg:text-6xl">
                {product.name}
              </h1>
              <p className="max-w-2xl text-base leading-7 opacity-85 sm:text-lg sm:leading-8">
                {product.description}
              </p>
            </div>
          </div>

          <Button
            asChild
            size="lg"
            className="h-14 rounded-xl bg-[#211512] px-6 text-[#fff8ef] shadow-none hover:bg-[#211512]/90 dark:bg-[#fff8ef] dark:text-[#211512] dark:hover:bg-[#fff8ef]/90"
          >
            <Link
              href={product.href}
              target={isExternal ? "_blank" : undefined}
              rel={isExternal ? "noopener noreferrer" : undefined}
            >
              Launch {product.name}
              {isExternal ? (
                <ExternalLink className="size-4" />
              ) : (
                <ArrowRight className="size-4" />
              )}
            </Link>
          </Button>
        </div>
      </section>

      <div className="grid gap-5 md:grid-cols-[1.45fr_0.8fr]">
        <Card className="rounded-[1.75rem] border-border/80 bg-card shadow-none">
          <CardHeader className="p-7 pb-4 sm:p-8 sm:pb-4">
            <p className="font-[family-name:var(--font-ibm-plex-mono)] text-xs uppercase tracking-[0.18em] text-muted-foreground">
              Capabilities
            </p>
            <CardTitle className="text-3xl tracking-[-0.04em]">
              What you can do
            </CardTitle>
          </CardHeader>
          <CardContent className="p-7 pt-3 sm:p-8 sm:pt-3">
            <ul className="grid gap-3 sm:grid-cols-2">
              {product.highlights.map((highlight) => (
                <li
                  key={highlight}
                  className="flex min-h-20 items-start gap-3 rounded-2xl border border-border/70 bg-background/55 p-4"
                >
                  <span className="mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/45">
                    <Check className="size-4" />
                  </span>
                  <span className="leading-6">{highlight}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="rounded-[1.75rem] border-border/80 bg-primary/30 shadow-none">
          <CardHeader className="p-7 pb-4 sm:p-8 sm:pb-4">
            <span className="inline-flex size-11 items-center justify-center rounded-xl border border-border bg-background/60">
              {product.access === "account" ? (
                <LockKeyhole className="size-5" />
              ) : (
                <ArrowRight className="size-5" />
              )}
            </span>
            <CardTitle className="pt-4 text-2xl tracking-[-0.035em]">
              {access.label}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-7 pt-2 text-sm leading-6 text-muted-foreground sm:p-8 sm:pt-2">
            <p>{access.description}</p>
            <p className="border-t border-border/70 pt-4">
              Capability:{" "}
              <span className="font-medium text-foreground">
                {product.capability}
              </span>
            </p>
          </CardContent>
        </Card>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
    </article>
  );
}
