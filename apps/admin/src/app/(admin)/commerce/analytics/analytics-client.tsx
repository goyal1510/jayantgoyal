"use client";

import * as React from "react";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import { cn } from "@repo/ui/lib/utils";
import {
  AlertTriangle,
  BarChart3,
  CreditCard,
  LifeBuoy,
  RefreshCw,
  ShoppingCart,
  TrendingUp,
  Users,
  Webhook,
} from "lucide-react";
import { formatMoneyMinor } from "@/lib/commerce-format";

interface CurrencyRevenue {
  currency: string;
  amountMinor: number;
  paidOrders: number;
}

interface FunnelItem {
  key: string;
  label: string;
  count: number;
}

interface DailyRevenue {
  date: string;
  amountMinor: number;
  paidOrders: number;
}

interface ProductSale {
  productId: string;
  name: string;
  slug: string;
  status: string;
  productType: string;
  views: number;
  checkoutStarts: number;
  paidOrders: number;
  revenueMinor: number;
  conversionRate: number;
}

interface CountRow {
  key: string;
  count: number;
}

interface CommerceAnalytics {
  generatedAt: string;
  rangeDays: number;
  primaryCurrency: string;
  summary: {
    totalOrders: number;
    paidOrders: number;
    pendingOrders: number;
    failedOrders: number;
    grossRevenue: CurrencyRevenue;
    checkoutConversionRate: number;
    activeSubscriptions: number;
    churnedSubscriptions: number;
    activeEntitlementUsers: number;
    openSupportThreads: number;
    failedWebhooks: number;
    processedWebhooks: number;
  };
  funnel: FunnelItem[];
  revenueByCurrency: CurrencyRevenue[];
  dailyRevenue: DailyRevenue[];
  productSales: ProductSale[];
  orderStatus: CountRow[];
  eventCounts: CountRow[];
  webhookStatus: CountRow[];
  supportStatus: CountRow[];
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(new Date(`${value}T00:00:00.000Z`));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function percent(value: number) {
  return `${value.toFixed(1).replace(".0", "")}%`;
}

function SummaryCard({
  label,
  value,
  detail,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: string;
  detail: string;
  icon: React.ComponentType<{ className?: string }>;
  tone?: "default" | "warning";
}) {
  return (
    <div className="rounded-lg border bg-background p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase text-muted-foreground">{label}</p>
          <p className="mt-2 truncate text-2xl font-semibold tracking-tight">{value}</p>
        </div>
        <span
          className={cn(
            "rounded-md border p-2",
            tone === "warning"
              ? "border-amber-200 bg-amber-50 text-amber-700"
              : "bg-muted text-muted-foreground"
          )}
        >
          <Icon className="size-4" />
        </span>
      </div>
      <p className="mt-3 text-sm text-muted-foreground">{detail}</p>
    </div>
  );
}

function LoadingPanel() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="h-32 animate-pulse rounded-lg border bg-muted/40" />
      ))}
    </div>
  );
}

function CountList({ rows, empty }: { rows: CountRow[]; empty: string }) {
  const max = Math.max(...rows.map((row) => row.count), 1);

  if (!rows.length) {
    return <p className="py-6 text-sm text-muted-foreground">{empty}</p>;
  }

  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <div key={row.key} className="space-y-1.5">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="capitalize">{row.key.replaceAll("_", " ")}</span>
            <span className="font-medium">{row.count}</span>
          </div>
          <div className="h-2 rounded-full bg-muted">
            <div
              className="h-2 rounded-full bg-primary"
              style={{ width: `${Math.max(4, (row.count / max) * 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function CommerceAnalyticsClient() {
  const [data, setData] = React.useState<CommerceAnalytics | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const loadAnalytics = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/commerce/analytics");
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to load analytics");
      }

      setData(payload.data);
    } catch (loadError) {
      console.error("Commerce analytics load failed:", loadError);
      setError(loadError instanceof Error ? loadError.message : "Unable to load analytics");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const maxDailyRevenue = Math.max(...(data?.dailyRevenue.map((day) => day.amountMinor) ?? [0]), 1);
  const maxFunnel = Math.max(...(data?.funnel.map((item) => item.count) ?? [0]), 1);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Commerce analytics</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Revenue, funnel, product, webhook, and support metrics from aggregate commerce data.
          </p>
        </div>
        <Button variant="outline" onClick={loadAnalytics} disabled={loading}>
          <RefreshCw className={cn("size-4", loading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {loading && !data ? (
        <LoadingPanel />
      ) : error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 size-5 text-destructive" />
            <div>
              <p className="font-medium">Analytics unavailable</p>
              <p className="mt-1 text-sm text-muted-foreground">{error}</p>
              <Button variant="outline" className="mt-4" onClick={loadAnalytics}>
                Retry
              </Button>
            </div>
          </div>
        </div>
      ) : data ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <SummaryCard
              label={`${data.rangeDays}d revenue`}
              value={formatMoneyMinor(
                data.summary.grossRevenue.amountMinor,
                data.summary.grossRevenue.currency
              )}
              detail={`${data.summary.grossRevenue.paidOrders} paid orders in primary revenue bucket`}
              icon={TrendingUp}
            />
            <SummaryCard
              label="Orders"
              value={`${data.summary.paidOrders}/${data.summary.totalOrders}`}
              detail={`${data.summary.pendingOrders} pending, ${data.summary.failedOrders} failed/canceled/expired`}
              icon={ShoppingCart}
            />
            <SummaryCard
              label="Checkout conversion"
              value={percent(data.summary.checkoutConversionRate)}
              detail="Verified checkout events divided by checkout starts"
              icon={CreditCard}
            />
            <SummaryCard
              label="Access"
              value={`${data.summary.activeEntitlementUsers}`}
              detail={`${data.summary.activeSubscriptions} active/trialing subscriptions`}
              icon={Users}
            />
            <SummaryCard
              label="Support"
              value={`${data.summary.openSupportThreads}`}
              detail="Open purchase-linked support threads"
              icon={LifeBuoy}
            />
            <SummaryCard
              label="Webhook health"
              value={`${data.summary.failedWebhooks}`}
              detail={`${data.summary.processedWebhooks} processed provider events`}
              icon={Webhook}
              tone={data.summary.failedWebhooks > 0 ? "warning" : "default"}
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
            <section className="rounded-lg border bg-background p-4">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="font-semibold">Revenue trend</h2>
                  <p className="text-sm text-muted-foreground">
                    Daily paid order revenue in {data.primaryCurrency.toUpperCase()}.
                  </p>
                </div>
                <Badge variant="outline">{data.rangeDays} days</Badge>
              </div>
              <div className="flex h-56 items-end gap-1 border-b border-l px-2 pb-2">
                {data.dailyRevenue.map((day) => (
                  <div key={day.date} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                    <div
                      className="w-full rounded-t bg-primary"
                      title={`${formatDate(day.date)} · ${formatMoneyMinor(
                        day.amountMinor,
                        data.primaryCurrency
                      )}`}
                      style={{
                        height: `${Math.max(2, (day.amountMinor / maxDailyRevenue) * 190)}px`,
                        opacity: day.amountMinor > 0 ? 1 : 0.18,
                      }}
                    />
                  </div>
                ))}
              </div>
              <div className="mt-2 flex justify-between text-[11px] text-muted-foreground">
                <span>{data.dailyRevenue[0] ? formatDate(data.dailyRevenue[0].date) : ""}</span>
                <span>
                  {data.dailyRevenue.at(-1) ? formatDate(data.dailyRevenue.at(-1)!.date) : ""}
                </span>
              </div>
            </section>

            <section className="rounded-lg border bg-background p-4">
              <div className="mb-4">
                <h2 className="font-semibold">Conversion funnel</h2>
                <p className="text-sm text-muted-foreground">Privacy-safe event counts.</p>
              </div>
              <div className="space-y-4">
                {data.funnel.map((item) => (
                  <div key={item.key} className="space-y-1.5">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span>{item.label}</span>
                      <span className="font-medium">{item.count}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted">
                      <div
                        className="h-2 rounded-full bg-primary"
                        style={{ width: `${Math.max(4, (item.count / maxFunnel) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <section className="rounded-lg border bg-background">
            <div className="border-b p-4">
              <h2 className="font-semibold">Product performance</h2>
              <p className="text-sm text-muted-foreground">
                Sales and funnel activity grouped by product.
              </p>
            </div>
            {data.productSales.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                No product analytics yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[860px] text-sm">
                  <thead className="border-b bg-muted/40 text-left text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 font-medium">Product</th>
                      <th className="px-4 py-3 font-medium">Views</th>
                      <th className="px-4 py-3 font-medium">Checkout starts</th>
                      <th className="px-4 py-3 font-medium">Paid</th>
                      <th className="px-4 py-3 font-medium">Conversion</th>
                      <th className="px-4 py-3 font-medium">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.productSales.map((product) => (
                      <tr key={product.productId} className="border-b last:border-b-0">
                        <td className="px-4 py-3">
                          <div className="font-medium">{product.name}</div>
                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            <Badge variant="outline" className="capitalize">
                              {product.status}
                            </Badge>
                            <span className="text-xs text-muted-foreground">{product.slug}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">{product.views}</td>
                        <td className="px-4 py-3">{product.checkoutStarts}</td>
                        <td className="px-4 py-3">{product.paidOrders}</td>
                        <td className="px-4 py-3">{percent(product.conversionRate)}</td>
                        <td className="px-4 py-3 font-medium">
                          {formatMoneyMinor(product.revenueMinor, data.primaryCurrency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <section className="rounded-lg border bg-background p-4">
              <h2 className="font-semibold">Order status</h2>
              <div className="mt-4">
                <CountList rows={data.orderStatus} empty="No orders in range." />
              </div>
            </section>
            <section className="rounded-lg border bg-background p-4">
              <h2 className="font-semibold">Events</h2>
              <div className="mt-4">
                <CountList rows={data.eventCounts} empty="No analytics events yet." />
              </div>
            </section>
            <section className="rounded-lg border bg-background p-4">
              <h2 className="font-semibold">Webhooks</h2>
              <div className="mt-4">
                <CountList rows={data.webhookStatus} empty="No webhook events in range." />
              </div>
            </section>
            <section className="rounded-lg border bg-background p-4">
              <h2 className="font-semibold">Support</h2>
              <div className="mt-4">
                <CountList rows={data.supportStatus} empty="No support threads yet." />
              </div>
            </section>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <BarChart3 className="size-3.5" />
            Updated {formatDateTime(data.generatedAt)} from aggregate commerce data.
          </div>
        </>
      ) : null}
    </div>
  );
}
