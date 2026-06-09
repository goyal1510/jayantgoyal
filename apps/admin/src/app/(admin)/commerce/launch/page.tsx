import Link from "next/link";
import type { Metadata } from "next";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Circle,
  ExternalLink,
  PackageCheck,
  Receipt,
  Rocket,
  ShoppingBag,
} from "lucide-react";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { formatDateTime, formatMoneyMinor } from "@/lib/commerce-format";
import type {
  CommerceDelivery,
  CommerceEvent,
  CommerceOrder,
  CommercePrice,
  CommerceProduct,
} from "@/lib/types";

export const metadata: Metadata = {
  title: "Product Launch Checklist",
  description: "Launch-readiness workflow for paid commerce products.",
};

type LaunchData = {
  products: CommerceProduct[];
  prices: CommercePrice[];
  orders: CommerceOrder[];
  deliveries: CommerceDelivery[];
  events: CommerceEvent[];
};

type LaunchCheck = {
  key: string;
  label: string;
  detail: string;
  complete: boolean;
  href?: string;
};

async function getLaunchData(): Promise<LaunchData> {
  const app = createSupabaseAdminClient().schema("jg_app");

  const [productsResult, pricesResult, ordersResult, deliveriesResult, eventsResult] =
    await Promise.all([
      app
        .from("commerce_products")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false }),
      app
        .from("commerce_prices")
        .select("*")
        .order("created_at", { ascending: true }),
      app
        .from("commerce_orders")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500),
      app
        .from("commerce_deliveries")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500),
      app
        .from("commerce_events")
        .select("*")
        .in("event_type", ["product_view", "checkout_started", "checkout_verified", "entitlement_granted"])
        .order("created_at", { ascending: false })
        .limit(1000),
    ]);

  const firstError = [
    productsResult.error,
    pricesResult.error,
    ordersResult.error,
    deliveriesResult.error,
    eventsResult.error,
  ].find(Boolean);

  if (firstError) {
    throw new Error(firstError.message);
  }

  return {
    products: (productsResult.data ?? []) as CommerceProduct[],
    prices: (pricesResult.data ?? []) as CommercePrice[],
    orders: (ordersResult.data ?? []) as CommerceOrder[],
    deliveries: (deliveriesResult.data ?? []) as CommerceDelivery[],
    events: (eventsResult.data ?? []) as CommerceEvent[],
  };
}

function metadataText(product: CommerceProduct, key: "delivery_plan" | "launch_note") {
  const value = product.metadata?.[key];
  return typeof value === "string" ? value.trim() : "";
}

function statusVariant(status: CommerceProduct["status"]) {
  if (status === "published") return "default";
  if (status === "archived") return "outline";
  return "secondary";
}

function buildChecks({
  product,
  prices,
  orders,
  deliveries,
  events,
}: {
  product: CommerceProduct;
  prices: CommercePrice[];
  orders: CommerceOrder[];
  deliveries: CommerceDelivery[];
  events: CommerceEvent[];
}): LaunchCheck[] {
  const activePrices = prices.filter((price) => price.product_id === product.id && price.is_active);
  const paidOrders = orders.filter((order) => order.product_id === product.id && order.status === "paid");
  const startedCheckouts = events.filter(
    (event) => event.product_id === product.id && event.event_type === "checkout_started"
  );
  const verifiedCheckouts = events.filter(
    (event) => event.product_id === product.id && event.event_type === "checkout_verified"
  );
  const fulfilledDeliveries = deliveries.filter(
    (delivery) =>
      delivery.product_id === product.id &&
      (delivery.status === "available" || delivery.status === "fulfilled")
  );
  const hasDeliveryPlan = Boolean(metadataText(product, "delivery_plan"));
  const hasOfferCopy = Boolean(product.name && product.slug && product.short_description && product.description);
  const hasMedia = Boolean(product.image_url);
  const hasActivePrice = activePrices.some((price) => price.unit_amount >= 0);
  const hasCheckoutProof = verifiedCheckouts.length > 0 || paidOrders.length > 0;

  return [
    {
      key: "offer",
      label: "Offer copy",
      detail: hasOfferCopy
        ? "Name, slug, short copy, and long description are present."
        : "Add short and long copy so buyers understand the product.",
      complete: hasOfferCopy,
      href: "/commerce/products",
    },
    {
      key: "media",
      label: "Store media",
      detail: hasMedia ? "Product image is configured." : "Add an image URL for the store card/detail page.",
      complete: hasMedia,
      href: "/commerce/products",
    },
    {
      key: "price",
      label: "Active price",
      detail: hasActivePrice
        ? `${activePrices.length} active price${activePrices.length === 1 ? "" : "s"} configured.`
        : "Add at least one active checkout price.",
      complete: hasActivePrice,
      href: "/commerce/products",
    },
    {
      key: "delivery",
      label: "Delivery plan",
      detail: hasDeliveryPlan
        ? metadataText(product, "delivery_plan")
        : fulfilledDeliveries.length > 0
          ? "Existing fulfilled delivery proves the path, but add a reusable delivery plan."
          : "Document how the buyer receives this product after payment.",
      complete: hasDeliveryPlan || fulfilledDeliveries.length > 0,
      href: "/commerce/products",
    },
    {
      key: "checkout",
      label: "Test checkout",
      detail: hasCheckoutProof
        ? `${verifiedCheckouts.length || paidOrders.length} verified checkout signal${(verifiedCheckouts.length || paidOrders.length) === 1 ? "" : "s"}.`
        : startedCheckouts.length > 0
          ? "Checkout was started but not verified. Finish one test purchase."
          : "Open the store page and complete one test checkout before launch.",
      complete: hasCheckoutProof,
      href: `/store/${product.slug}`,
    },
    {
      key: "publish",
      label: "Published",
      detail:
        product.status === "published"
          ? `Published ${formatDateTime(product.published_at)}.`
          : "Move the product to published only after the previous checks are green.",
      complete: product.status === "published",
      href: "/commerce/products",
    },
  ];
}

export default async function CommerceLaunchPage() {
  const data = await getLaunchData();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.jayantgoyal.com";
  const rows = data.products.map((product) => {
    const checks = buildChecks({
      product,
      prices: data.prices,
      orders: data.orders,
      deliveries: data.deliveries,
      events: data.events,
    });
    const completeCount = checks.filter((check) => check.complete).length;
    const activePrices = data.prices.filter((price) => price.product_id === product.id && price.is_active);
    const primaryPrice = activePrices[0] ?? data.prices.find((price) => price.product_id === product.id) ?? null;
    const paidOrders = data.orders.filter((order) => order.product_id === product.id && order.status === "paid");

    return {
      product,
      checks,
      completeCount,
      totalCount: checks.length,
      percentage: Math.round((completeCount / checks.length) * 100),
      primaryPrice,
      paidOrders,
      launchNote: metadataText(product, "launch_note"),
    };
  });
  const readyRows = rows.filter((row) => row.completeCount === row.totalCount);
  const blockedRows = rows.filter((row) => row.completeCount < row.totalCount);
  const publishedRows = rows.filter((row) => row.product.status === "published");

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="max-w-3xl">
          <p className="text-sm font-medium uppercase tracking-[0.22em] text-muted-foreground">
            Launch Workflow
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Product Launch Checklist</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            One operational view for turning a product draft into something you can sell:
            offer, media, price, delivery plan, test checkout, and publish state.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href="/commerce/products">
              <ShoppingBag className="size-4" />
              Manage products
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/commerce/orders">
              <Receipt className="size-4" />
              Review orders
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Products" value={rows.length} detail="Catalog items in admin" icon={PackageCheck} />
        <MetricCard label="Launch Ready" value={readyRows.length} detail="All checklist items green" icon={CheckCircle2} />
        <MetricCard label="Needs Work" value={blockedRows.length} detail="Missing launch proof" icon={AlertTriangle} />
        <MetricCard label="Published" value={publishedRows.length} detail="Visible in store when public" icon={Rocket} />
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center">
          <PackageCheck className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-3 text-sm font-medium">No products yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Create a product, add pricing, then return here to run the launch checklist.
          </p>
          <Button asChild className="mt-4">
            <Link href="/commerce/products">Create product</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {rows.map((row) => (
            <section key={row.product.id} className="overflow-hidden rounded-xl border bg-card">
              <div className="grid gap-4 border-b p-4 xl:grid-cols-[minmax(0,1fr)_220px_180px]">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="truncate text-lg font-semibold">{row.product.name}</h2>
                    <Badge variant={statusVariant(row.product.status)} className="capitalize">
                      {row.product.status}
                    </Badge>
                    <Badge variant="outline" className="capitalize">
                      {row.product.product_type}
                    </Badge>
                    {row.completeCount === row.totalCount ? (
                      <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">Ready</Badge>
                    ) : (
                      <Badge variant="secondary">{row.totalCount - row.completeCount} open</Badge>
                    )}
                  </div>
                  <p className="mt-1 truncate font-mono text-xs text-muted-foreground">
                    /store/{row.product.slug}
                  </p>
                  {row.launchNote && (
                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                      {row.launchNote}
                    </p>
                  )}
                </div>

                <div>
                  <p className="text-xs font-medium uppercase text-muted-foreground">Readiness</p>
                  <div className="mt-2 h-2 rounded-full bg-muted">
                    <div
                      className="h-2 rounded-full bg-primary transition-all"
                      style={{ width: `${row.percentage}%` }}
                    />
                  </div>
                  <p className="mt-2 text-sm">
                    {row.completeCount}/{row.totalCount} checks complete
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase text-muted-foreground">Price / sales</p>
                  <p className="mt-1 text-sm font-medium">
                    {row.primaryPrice
                      ? formatMoneyMinor(row.primaryPrice.unit_amount, row.primaryPrice.currency)
                      : "No price"}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {row.paidOrders.length} paid order{row.paidOrders.length === 1 ? "" : "s"}
                  </p>
                </div>
              </div>

              <div className="grid gap-3 p-4 lg:grid-cols-2 xl:grid-cols-3">
                {row.checks.map((check) => (
                  <ChecklistItem
                    key={check.key}
                    check={check}
                    storeUrl={`${siteUrl.replace(/\/$/, "")}/store/${row.product.slug}`}
                  />
                ))}
              </div>

              <div className="flex flex-wrap gap-2 border-t bg-muted/20 p-4">
                <Button asChild variant="outline" size="sm">
                  <Link href="/commerce/products">
                    Edit product
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link href={`${siteUrl.replace(/\/$/, "")}/store/${row.product.slug}`} target="_blank">
                    Store page
                    <ExternalLink className="size-4" />
                  </Link>
                </Button>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/commerce/orders">Orders</Link>
                </Button>
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
}: {
  label: string;
  value: number;
  detail: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <Icon className="size-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold">{value}</div>
        <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
  );
}

function ChecklistItem({
  check,
  storeUrl,
}: {
  check: LaunchCheck;
  storeUrl: string;
}) {
  const Icon = check.complete ? CheckCircle2 : Circle;
  const href = check.key === "checkout" ? storeUrl : check.href;
  const isExternal = check.key === "checkout";

  return (
    <div className="flex min-w-0 gap-3 rounded-lg border p-4">
      <Icon className={check.complete ? "mt-0.5 size-5 shrink-0 text-emerald-600" : "mt-0.5 size-5 shrink-0 text-muted-foreground"} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-medium">{check.label}</p>
          <Badge variant={check.complete ? "default" : "secondary"}>
            {check.complete ? "Done" : "Open"}
          </Badge>
        </div>
        <p className="mt-1 break-words text-sm text-muted-foreground">{check.detail}</p>
        {href && (
          <Button asChild variant="link" size="sm" className="mt-2 h-auto p-0">
            <Link href={href} target={isExternal ? "_blank" : undefined}>
              {check.complete ? "Review" : "Fix this"}
              {isExternal ? <ExternalLink className="size-3.5" /> : <ArrowRight className="size-3.5" />}
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}
