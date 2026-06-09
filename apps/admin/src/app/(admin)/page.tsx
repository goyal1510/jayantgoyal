import Link from "next/link";
import type { Metadata } from "next";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  LifeBuoy,
  PackageCheck,
  Receipt,
  Rocket,
  ShoppingBag,
  TrendingUp,
} from "lucide-react";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { formatDateTime, formatMoneyMinor, shortId } from "@/lib/commerce-format";
import type {
  CommerceOrder,
  CommercePrice,
  CommerceProduct,
  CommerceProductStatus,
} from "@/lib/types";

export const metadata: Metadata = {
  title: "Admin Command Center",
  description: "Commerce, support, product, and launch-readiness command center.",
};

type SupportStatus = "open" | "pending" | "resolved";

type SupportThreadRow = {
  id: string;
  title: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  last_message_at: string | null;
};

type WebhookRow = {
  id: string;
  provider: string;
  event_type: string;
  status: string;
  created_at: string;
};

type DashboardData = {
  orders: CommerceOrder[];
  products: CommerceProduct[];
  prices: CommercePrice[];
  supportThreads: SupportThreadRow[];
  failedWebhooks: WebhookRow[];
};

function supportStatus(metadata: Record<string, unknown>): SupportStatus {
  const value = metadata.support_status;
  return value === "pending" || value === "resolved" ? value : "open";
}

function statusBadgeVariant(status: CommerceOrder["status"] | CommerceProductStatus) {
  if (status === "paid" || status === "published") return "default";
  if (status === "pending" || status === "draft") return "secondary";
  return "outline";
}

function countByStatus<T extends string>(items: { status: T }[]) {
  return items.reduce<Record<T, number>>(
    (acc, item) => ({
      ...acc,
      [item.status]: (acc[item.status] ?? 0) + 1,
    }),
    {} as Record<T, number>
  );
}

async function getDashboardData(): Promise<DashboardData> {
  const app = createSupabaseAdminClient().schema("jg_app");

  const [ordersResult, productsResult, pricesResult, supportResult, webhooksResult] =
    await Promise.all([
      app
        .from("commerce_orders")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(25),
      app
        .from("commerce_products")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false })
        .limit(50),
      app
        .from("commerce_prices")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(100),
      app
        .from("messenger_conversations")
        .select("id,title,metadata,created_at,last_message_at")
        .eq("conversation_type", "support")
        .eq("is_archived", false)
        .order("last_message_at", { ascending: false, nullsFirst: false })
        .limit(20),
      app
        .from("commerce_webhook_events")
        .select("id,provider,event_type,status,created_at")
        .eq("status", "failed")
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

  if (ordersResult.error) throw new Error(ordersResult.error.message);
  if (productsResult.error) throw new Error(productsResult.error.message);
  if (pricesResult.error) throw new Error(pricesResult.error.message);
  if (supportResult.error) throw new Error(supportResult.error.message);
  if (webhooksResult.error) throw new Error(webhooksResult.error.message);

  return {
    orders: (ordersResult.data ?? []) as CommerceOrder[],
    products: (productsResult.data ?? []) as CommerceProduct[],
    prices: (pricesResult.data ?? []) as CommercePrice[],
    supportThreads: (supportResult.data ?? []) as SupportThreadRow[],
    failedWebhooks: (webhooksResult.data ?? []) as WebhookRow[],
  };
}

function productReadiness(product: CommerceProduct, prices: CommercePrice[]) {
  const productPrices = prices.filter((price) => price.product_id === product.id);
  const hasActivePrice = productPrices.some((price) => price.is_active);
  const checks = [
    Boolean(product.short_description || product.description),
    hasActivePrice,
    Boolean(product.image_url),
    product.status === "published",
  ];
  const completed = checks.filter(Boolean).length;

  return {
    completed,
    total: checks.length,
    label:
      completed === checks.length
        ? "Ready"
        : `${checks.length - completed} missing`,
  };
}

export default async function DashboardPage() {
  const data = await getDashboardData();
  const paidOrders = data.orders.filter((order) => order.status === "paid");
  const pendingOrders = data.orders.filter((order) => order.status === "pending");
  const revenueByCurrency = paidOrders.reduce<Record<string, number>>((acc, order) => {
    acc[order.currency] = (acc[order.currency] ?? 0) + order.amount_total;
    return acc;
  }, {});
  const primaryRevenue = Object.entries(revenueByCurrency).sort((a, b) => b[1] - a[1])[0];
  const productCounts = countByStatus(data.products);
  const supportCounts = data.supportThreads.reduce<Record<SupportStatus, number>>(
    (acc, thread) => {
      const status = supportStatus(thread.metadata);
      acc[status] += 1;
      return acc;
    },
    { open: 0, pending: 0, resolved: 0 }
  );
  const productsNeedingWork = data.products
    .map((product) => ({ product, readiness: productReadiness(product, data.prices) }))
    .filter((item) => item.readiness.completed < item.readiness.total)
    .slice(0, 5);
  const recentOrders = data.orders.slice(0, 5);
  const activeSupport = data.supportThreads
    .filter((thread) => supportStatus(thread.metadata) !== "resolved")
    .slice(0, 5);

  const summaryCards = [
    {
      label: "Revenue",
      value: primaryRevenue ? formatMoneyMinor(primaryRevenue[1], primaryRevenue[0]) : "₹0.00",
      detail: `${paidOrders.length} paid orders in latest sample`,
      icon: TrendingUp,
    },
    {
      label: "Pending Orders",
      value: pendingOrders.length.toString(),
      detail: "Need payment, manual review, or expiry cleanup",
      icon: Clock3,
    },
    {
      label: "Published Products",
      value: (productCounts.published ?? 0).toString(),
      detail: `${productCounts.draft ?? 0} drafts, ${productCounts.archived ?? 0} archived`,
      icon: ShoppingBag,
    },
    {
      label: "Open Support",
      value: supportCounts.open.toString(),
      detail: `${supportCounts.pending} pending, ${supportCounts.resolved} resolved`,
      icon: LifeBuoy,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="max-w-3xl">
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-muted-foreground">
            Admin OS
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Command Center</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            A business dashboard for products, orders, support, and launch readiness.
            Portfolio editing still exists, but the first admin screen now starts from revenue operations.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href="/commerce/products">
              <ShoppingBag className="size-4" />
              Create product
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
        {summaryCards.map((card) => (
          <Card key={card.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.label}
              </CardTitle>
              <card.icon className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{card.value}</div>
              <p className="mt-1 text-xs text-muted-foreground">{card.detail}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(360px,0.7fr)]">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <div>
              <CardTitle>Launch Readiness</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Products missing offer copy, active pricing, media, or publish state.
              </p>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/commerce/launch">
                Manage
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {productsNeedingWork.length === 0 ? (
              <div className="rounded-lg border border-dashed p-6 text-center">
                <CheckCircle2 className="mx-auto size-6 text-emerald-600" />
                <p className="mt-2 text-sm font-medium">All listed products are launch-ready.</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Keep pricing, delivery, and support proof current before promoting them.
                </p>
              </div>
            ) : (
              productsNeedingWork.map(({ product, readiness }) => (
                <div
                  key={product.id}
                  className="grid gap-3 rounded-lg border p-4 md:grid-cols-[minmax(0,1fr)_160px_110px]"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-medium">{product.name}</p>
                      <Badge variant={statusBadgeVariant(product.status)} className="capitalize">
                        {product.status}
                      </Badge>
                    </div>
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      /store/{product.slug}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase text-muted-foreground">Checklist</p>
                    <p className="mt-1 text-sm">
                      {readiness.completed}/{readiness.total} complete
                    </p>
                  </div>
                  <div className="flex items-start md:justify-end">
                    <Badge variant="outline">{readiness.label}</Badge>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Next Actions</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              The shortest path to making the product sellable.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            <ActionLink
              href="/commerce/launch"
              icon={PackageCheck}
              title="Run launch checklist"
              detail="Confirm offer, price, delivery plan, test checkout, and publish state."
            />
            <ActionLink
              href="/commerce/orders"
              icon={Receipt}
              title="Resolve order queue"
              detail="Check pending payments and manual lifecycle updates."
            />
            <ActionLink
              href="/commerce/support"
              icon={LifeBuoy}
              title="Reply to buyers"
              detail="Keep support tied to order context and delivery status."
            />
            <ActionLink
              href="/deployments"
              icon={Rocket}
              title="Check deployments"
              detail="Confirm the production app is ready after shipping."
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <div>
              <CardTitle>Recent Orders</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Latest checkout and payment records.
              </p>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/commerce/orders">View all</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentOrders.length === 0 ? (
              <EmptyState
                icon={Receipt}
                title="No orders yet"
                detail="Checkout attempts and paid purchases will appear here."
              />
            ) : (
              recentOrders.map((order) => (
                <Link
                  key={order.id}
                  href={`/commerce/orders/${order.id}`}
                  className="grid gap-3 rounded-lg border p-4 transition-colors hover:bg-muted/40 md:grid-cols-[minmax(0,1fr)_140px_110px]"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-mono text-sm font-medium">{shortId(order.id)}</p>
                      <Badge variant={statusBadgeVariant(order.status)} className="capitalize">
                        {order.status}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatDateTime(order.created_at)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase text-muted-foreground">Amount</p>
                    <p className="mt-1 text-sm font-medium">
                      {formatMoneyMinor(order.amount_total, order.currency)}
                    </p>
                  </div>
                  <div className="flex items-start md:justify-end">
                    <Badge variant="outline" className="capitalize">
                      {order.payment_provider}
                    </Badge>
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <div>
              <CardTitle>Support Queue</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Purchase-linked conversations needing admin attention.
              </p>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/commerce/support">Open inbox</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {activeSupport.length === 0 ? (
              <EmptyState
                icon={LifeBuoy}
                title="No active support"
                detail="Open and pending buyer conversations will appear here."
              />
            ) : (
              activeSupport.map((thread) => {
                const status = supportStatus(thread.metadata);
                return (
                  <Link
                    key={thread.id}
                    href="/commerce/support"
                    className="grid gap-3 rounded-lg border p-4 transition-colors hover:bg-muted/40 md:grid-cols-[minmax(0,1fr)_110px]"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-medium">
                          {thread.title ?? shortId(thread.id)}
                        </p>
                        {status === "open" && (
                          <AlertTriangle className="size-4 text-amber-600" />
                        )}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Last activity {formatDateTime(thread.last_message_at ?? thread.created_at)}
                      </p>
                    </div>
                    <div className="flex items-start md:justify-end">
                      <Badge variant={status === "open" ? "default" : "outline"} className="capitalize">
                        {status}
                      </Badge>
                    </div>
                  </Link>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      {data.failedWebhooks.length > 0 && (
        <Card className="border-destructive/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="size-5" />
              Failed Webhooks
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Payment provider events that failed processing and need investigation.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.failedWebhooks.map((webhook) => (
              <div
                key={webhook.id}
                className="grid gap-3 rounded-lg border p-4 md:grid-cols-[150px_minmax(0,1fr)_180px]"
              >
                <Badge variant="outline" className="w-fit capitalize">
                  {webhook.provider}
                </Badge>
                <p className="min-w-0 truncate text-sm font-medium">{webhook.event_type}</p>
                <p className="text-sm text-muted-foreground">
                  {formatDateTime(webhook.created_at)}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ActionLink({
  href,
  icon: Icon,
  title,
  detail,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  detail: string;
}) {
  return (
    <Link
      href={href}
      className="flex gap-3 rounded-lg border p-4 transition-colors hover:bg-muted/40"
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted">
        <Icon className="size-5 text-muted-foreground" />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-medium">{title}</span>
        <span className="mt-1 block text-sm text-muted-foreground">{detail}</span>
      </span>
    </Link>
  );
}

function EmptyState({
  icon: Icon,
  title,
  detail,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  detail: string;
}) {
  return (
    <div className="rounded-lg border border-dashed p-6 text-center">
      <Icon className="mx-auto size-6 text-muted-foreground" />
      <p className="mt-2 text-sm font-medium">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{detail}</p>
    </div>
  );
}
