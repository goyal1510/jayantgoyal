import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ExternalLink,
  LockKeyhole,
} from "lucide-react";

import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card";

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
    <article className="mx-auto w-full max-w-5xl space-y-8 py-8 sm:py-12">
      <Button asChild variant="ghost" className="-ml-4">
        <Link href="/products">
          <ArrowLeft className="size-4" />
          All products
        </Link>
      </Button>

      <section className="overflow-hidden rounded-3xl border bg-gradient-to-br from-card via-card to-primary/10 p-6 sm:p-10">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div className="max-w-2xl space-y-5">
            <span className="inline-flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <product.icon className="size-7" />
            </span>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{product.type}</Badge>
              <Badge variant="outline">{product.status}</Badge>
            </div>
            <div className="space-y-3">
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
                {product.name}
              </h1>
              <p className="text-lg leading-8 text-muted-foreground">
                {product.description}
              </p>
            </div>
          </div>

          <Button asChild size="lg">
            <Link
              href={product.href}
              target={isExternal ? "_blank" : undefined}
              rel={isExternal ? "noreferrer" : undefined}
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

      <div className="grid gap-5 md:grid-cols-[1.6fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>What you can do</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {product.highlights.map((highlight) => (
                <li key={highlight} className="flex gap-3">
                  <span className="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Check className="size-3.5" />
                  </span>
                  <span>{highlight}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {product.access === "account" ? (
                <LockKeyhole className="size-4" />
              ) : null}
              {access.label}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>{access.description}</p>
            <p>
              Capability:{" "}
              <span className="text-foreground">{product.capability}</span>
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
