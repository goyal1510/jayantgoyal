import Link from "next/link";
import type { Metadata } from "next";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  MailWarning,
  PackageCheck,
  Receipt,
  ShieldCheck,
  Webhook,
} from "lucide-react";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card";
import { cn } from "@repo/ui/lib/utils";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import {
  formatDateTime,
  formatMoneyMinor,
  shortId,
} from "@/lib/commerce-format";
import type {
  CommerceDelivery,
  CommerceOrder,
  CommercePaymentProvider,
  CommerceProduct,
} from "@/lib/types";

export const metadata: Metadata = {
  title: "Payment Reconciliation",
  description:
    "Admin review queue for payment, webhook, entitlement, and delivery mismatches.",
};

type EntitlementRow = {
  id: string;
  user_id: string;
  product_id: string | null;
  price_id: string | null;
  order_id: string | null;
  source_type: "order" | "subscription" | "manual";
  feature_key: string;
  status: "active" | "revoked" | "expired";
  starts_at: string;
  expires_at: string | null;
  created_at: string;
};

type WebhookRow = {
  id: string;
  provider: CommercePaymentProvider;
  provider_event_id: string | null;
  event_type: string;
  object_id: string | null;
  status: "received" | "processing" | "processed" | "failed";
  attempt_count: number;
  last_error: string | null;
  processed_at: string | null;
  created_at: string;
  updated_at: string;
};

type EmailEventRow = {
  id: string;
  email_type:
    | "purchase_receipt"
    | "product_access"
    | "support_opened"
    | "support_reply";
  order_id: string | null;
  status: "pending" | "sending" | "sent" | "failed" | "skipped";
  attempt_count: number;
  last_error: string | null;
  next_retry_at: string | null;
  sent_at: string | null;
  created_at: string;
  updated_at: string;
};

type ReconciliationData = {
  orders: CommerceOrder[];
  productsById: Map<string, CommerceProduct>;
  entitlementsByOrderId: Map<string, EntitlementRow[]>;
  deliveriesByOrderId: Map<string, CommerceDelivery[]>;
  webhooks: WebhookRow[];
  emailEvents: EmailEventRow[];
  error: string | null;
};

type ReviewSeverity = "critical" | "warning" | "info";

type ReviewItem = {
  id: string;
  severity: ReviewSeverity;
  area: "Order" | "Entitlement" | "Webhook" | "Delivery" | "Email";
  title: string;
  detail: string;
  provider: string;
  amountOrEvent: string;
  createdAt: string;
  href: string | null;
};

const PENDING_ORDER_STALE_MS = 30 * 60 * 1000;
const WEBHOOK_STUCK_MS = 15 * 60 * 1000;
const EMAIL_STUCK_MS = 15 * 60 * 1000;

const severityConfig: Record<
  ReviewSeverity,
  { label: string; className: string; icon: typeof AlertTriangle }
> = {
  critical: {
    label: "Critical",
    className:
      "border-red-200 bg-red-50 text-red-700 dark:border-red-900/70 dark:bg-red-950/30 dark:text-red-300",
    icon: AlertTriangle,
  },
  warning: {
    label: "Warning",
    className:
      "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/70 dark:bg-amber-950/30 dark:text-amber-300",
    icon: Clock3,
  },
  info: {
    label: "Info",
    className:
      "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/70 dark:bg-blue-950/30 dark:text-blue-300",
    icon: ShieldCheck,
  },
};

async function getReconciliationData(): Promise<ReconciliationData> {
  const app = createSupabaseAdminClient().schema("jg_app");

  const [ordersResult, webhooksResult, emailEventsResult] = await Promise.all([
    app
      .from("commerce_orders")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200),
    app
      .from("commerce_webhook_events")
      .select(
        "id,provider,provider_event_id,event_type,object_id,status,attempt_count,last_error,processed_at,created_at,updated_at",
      )
      .order("created_at", { ascending: false })
      .limit(200),
    app
      .from("commerce_email_events")
      .select(
        "id,email_type,order_id,status,attempt_count,last_error,next_retry_at,sent_at,created_at,updated_at",
      )
      .order("created_at", { ascending: false })
      .limit(200),
  ]);

  if (ordersResult.error || webhooksResult.error || emailEventsResult.error) {
    return emptyReconciliationData(
      "Unable to load payment reconciliation records.",
    );
  }

  const orders = (ordersResult.data ?? []) as CommerceOrder[];
  const orderIds = orders.map((order) => order.id);
  const productIds = [
    ...new Set(orders.map((order) => order.product_id).filter(Boolean)),
  ] as string[];

  const [entitlementsResult, deliveriesResult, productsResult] =
    await Promise.all([
      orderIds.length
        ? app
            .from("commerce_entitlements")
            .select(
              "id,user_id,product_id,price_id,order_id,source_type,feature_key,status,starts_at,expires_at,created_at",
            )
            .in("order_id", orderIds)
        : Promise.resolve({ data: [], error: null }),
      orderIds.length
        ? app.from("commerce_deliveries").select("*").in("order_id", orderIds)
        : Promise.resolve({ data: [], error: null }),
      productIds.length
        ? app.from("commerce_products").select("*").in("id", productIds)
        : Promise.resolve({ data: [], error: null }),
    ]);

  if (
    entitlementsResult.error ||
    deliveriesResult.error ||
    productsResult.error
  ) {
    return emptyReconciliationData(
      "Unable to load payment reconciliation records.",
    );
  }

  const entitlements = (entitlementsResult.data ?? []) as EntitlementRow[];
  const deliveries = (deliveriesResult.data ?? []) as CommerceDelivery[];
  const products = (productsResult.data ?? []) as CommerceProduct[];

  return {
    orders,
    productsById: new Map(products.map((product) => [product.id, product])),
    entitlementsByOrderId: groupByOrderId(entitlements),
    deliveriesByOrderId: groupByOrderId(deliveries),
    webhooks: (webhooksResult.data ?? []) as WebhookRow[],
    emailEvents: (emailEventsResult.data ?? []) as EmailEventRow[],
    error: null,
  };
}

function emptyReconciliationData(error: string): ReconciliationData {
  return {
    orders: [],
    productsById: new Map(),
    entitlementsByOrderId: new Map(),
    deliveriesByOrderId: new Map(),
    webhooks: [],
    emailEvents: [],
    error,
  };
}

function groupByOrderId<T extends { order_id: string | null }>(rows: T[]) {
  return rows.reduce<Map<string, T[]>>((acc, row) => {
    if (!row.order_id) return acc;
    const existing = acc.get(row.order_id) ?? [];
    existing.push(row);
    acc.set(row.order_id, existing);
    return acc;
  }, new Map());
}

function toTime(value: string | null) {
  if (!value) return 0;
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : 0;
}

function isActiveEntitlement(entitlement: EntitlementRow, nowMs: number) {
  if (entitlement.status !== "active") return false;
  if (toTime(entitlement.starts_at) > nowMs) return false;
  if (entitlement.expires_at && toTime(entitlement.expires_at) <= nowMs)
    return false;
  return true;
}

function buildReviewItems(data: ReconciliationData) {
  const nowMs = Date.now();
  const paidOrders = data.orders.filter((order) => order.status === "paid");
  const reviewItems: ReviewItem[] = [];

  for (const order of data.orders) {
    const orderEntitlements = data.entitlementsByOrderId.get(order.id) ?? [];
    const activeEntitlements = orderEntitlements.filter((entitlement) =>
      isActiveEntitlement(entitlement, nowMs),
    );
    const deliveries = data.deliveriesByOrderId.get(order.id) ?? [];
    const product = order.product_id
      ? data.productsById.get(order.product_id)
      : null;
    const href = `/commerce/orders/${order.id}`;

    if (order.status === "paid" && activeEntitlements.length === 0) {
      reviewItems.push({
        id: `${order.id}-entitlement`,
        severity: "critical",
        area: "Entitlement",
        title: "Paid order has no active entitlement",
        detail:
          "The buyer paid, but current access cannot be confirmed from entitlement rows.",
        provider: order.payment_provider,
        amountOrEvent: formatMoneyMinor(order.amount_total, order.currency),
        createdAt: order.created_at,
        href,
      });
    }

    if (
      order.status === "paid" &&
      (!order.provider_payment_id || !order.completed_at)
    ) {
      reviewItems.push({
        id: `${order.id}-provider-payment`,
        severity: "critical",
        area: "Order",
        title: "Paid order is missing provider completion data",
        detail:
          "The order is marked paid but lacks a provider payment id or completion timestamp.",
        provider: order.payment_provider,
        amountOrEvent: formatMoneyMinor(order.amount_total, order.currency),
        createdAt: order.created_at,
        href,
      });
    }

    if (
      order.status === "pending" &&
      order.provider_order_id &&
      nowMs - toTime(order.created_at) > PENDING_ORDER_STALE_MS
    ) {
      reviewItems.push({
        id: `${order.id}-stale-pending`,
        severity: "warning",
        area: "Order",
        title: "Provider order stayed pending too long",
        detail:
          "The checkout has a provider order id but has not settled after 30 minutes.",
        provider: order.payment_provider,
        amountOrEvent: formatMoneyMinor(order.amount_total, order.currency),
        createdAt: order.created_at,
        href,
      });
    }

    if (
      order.status === "paid" &&
      (product?.product_type === "digital" ||
        product?.product_type === "bundle") &&
      !deliveries.some(
        (delivery) =>
          delivery.status === "available" || delivery.status === "fulfilled",
      )
    ) {
      reviewItems.push({
        id: `${order.id}-delivery`,
        severity: "warning",
        area: "Delivery",
        title: "Paid digital order has no available delivery",
        detail:
          "Digital and bundle products should have an available or fulfilled delivery row.",
        provider: order.payment_provider,
        amountOrEvent: product.name,
        createdAt: order.created_at,
        href,
      });
    }
  }

  for (const webhook of data.webhooks) {
    if (webhook.status === "failed") {
      reviewItems.push({
        id: `${webhook.id}-failed`,
        severity: "critical",
        area: "Webhook",
        title: "Webhook processing failed",
        detail: webhook.last_error
          ? "Provider event failed and needs replay or manual review."
          : "Provider event failed without a stored error.",
        provider: webhook.provider,
        amountOrEvent: webhook.event_type,
        createdAt: webhook.created_at,
        href: "/commerce/analytics",
      });
    }

    if (
      (webhook.status === "received" || webhook.status === "processing") &&
      nowMs - toTime(webhook.updated_at) > WEBHOOK_STUCK_MS
    ) {
      reviewItems.push({
        id: `${webhook.id}-stuck`,
        severity: "warning",
        area: "Webhook",
        title: "Webhook appears stuck",
        detail:
          "The provider event has not reached processed or failed state after 15 minutes.",
        provider: webhook.provider,
        amountOrEvent: webhook.event_type,
        createdAt: webhook.created_at,
        href: "/commerce/analytics",
      });
    }
  }

  for (const emailEvent of data.emailEvents) {
    const retryDue =
      emailEvent.status === "pending" &&
      emailEvent.next_retry_at !== null &&
      toTime(emailEvent.next_retry_at) <= nowMs;
    const stuckSending =
      emailEvent.status === "sending" &&
      nowMs - toTime(emailEvent.updated_at) > EMAIL_STUCK_MS;

    if (emailEvent.status === "failed" || retryDue || stuckSending) {
      reviewItems.push({
        id: `${emailEvent.id}-email`,
        severity: emailEvent.status === "failed" ? "warning" : "info",
        area: "Email",
        title:
          emailEvent.status === "failed"
            ? "Commerce email failed"
            : "Commerce email needs retry check",
        detail: "Receipt, access, or support email delivery needs attention.",
        provider: "resend",
        amountOrEvent: emailEvent.email_type.replaceAll("_", " "),
        createdAt: emailEvent.created_at,
        href: emailEvent.order_id
          ? `/commerce/orders/${emailEvent.order_id}`
          : "/commerce/support",
      });
    }
  }

  return {
    paidOrders,
    reviewItems: reviewItems.sort((a, b) => {
      const severityDiff = severityRank(a.severity) - severityRank(b.severity);
      return severityDiff || toTime(b.createdAt) - toTime(a.createdAt);
    }),
  };
}

function severityRank(severity: ReviewSeverity) {
  if (severity === "critical") return 0;
  if (severity === "warning") return 1;
  return 2;
}

function MetricCard({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: typeof ShieldCheck;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
        <Icon className="size-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold">{value}</div>
        <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
  );
}

function SeverityBadge({ severity }: { severity: ReviewSeverity }) {
  const config = severityConfig[severity];
  const Icon = config.icon;

  return (
    <Badge
      variant="outline"
      className={cn("gap-1.5 capitalize", config.className)}
    >
      <Icon className="size-3.5" />
      {config.label}
    </Badge>
  );
}

export default async function PaymentReconciliationPage() {
  const data = await getReconciliationData();
  const { paidOrders, reviewItems } = buildReviewItems(data);
  const criticalCount = reviewItems.filter(
    (item) => item.severity === "critical",
  ).length;
  const warningCount = reviewItems.filter(
    (item) => item.severity === "warning",
  ).length;
  const webhookIssueCount = reviewItems.filter(
    (item) => item.area === "Webhook",
  ).length;
  const entitlementIssueCount = reviewItems.filter(
    (item) => item.area === "Entitlement",
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="max-w-3xl">
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-muted-foreground">
            Commerce Operations
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Payment Reconciliation
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Review mismatches between provider payments, order state,
            entitlements, deliveries, webhooks, and commerce email events.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="/commerce/analytics">
              <Webhook className="size-4" />
              Open analytics
            </Link>
          </Button>
          <Button asChild>
            <Link href="/commerce/orders">
              <Receipt className="size-4" />
              Review orders
            </Link>
          </Button>
        </div>
      </div>

      {data.error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/70 dark:bg-red-950/30 dark:text-red-300">
          {data.error}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={ShieldCheck}
          label="Review Queue"
          value={reviewItems.length.toString()}
          detail={`${criticalCount} critical, ${warningCount} warnings`}
        />
        <MetricCard
          icon={Receipt}
          label="Paid Orders Checked"
          value={paidOrders.length.toString()}
          detail={`Latest ${data.orders.length} orders scanned`}
        />
        <MetricCard
          icon={Webhook}
          label="Webhook Issues"
          value={webhookIssueCount.toString()}
          detail={`${data.webhooks.length} provider events sampled`}
        />
        <MetricCard
          icon={PackageCheck}
          label="Entitlement Gaps"
          value={entitlementIssueCount.toString()}
          detail="Paid orders without active access rows"
        />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-3">
          <div>
            <CardTitle>Review Queue</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Highest-risk payment reliability work first. Resolve critical rows
              before promoting new offers.
            </p>
          </div>
          <Badge variant={criticalCount > 0 ? "destructive" : "outline"}>
            {criticalCount > 0
              ? `${criticalCount} critical`
              : "No critical issues"}
          </Badge>
        </CardHeader>
        <CardContent>
          {reviewItems.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <CheckCircle2 className="mx-auto size-7 text-emerald-600" />
              <p className="mt-3 text-sm font-medium">
                No reconciliation issues in the latest sample.
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Continue checking this before and after every payment-provider
                change.
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-3 md:hidden">
                {reviewItems.map((item) => (
                  <div key={item.id} className="rounded-lg border p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <SeverityBadge severity={item.severity} />
                      <Badge variant="outline">{item.area}</Badge>
                    </div>
                    <p className="mt-3 text-sm font-medium">{item.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {item.detail}
                    </p>
                    <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <p className="font-medium uppercase text-muted-foreground">
                          Provider
                        </p>
                        <p className="mt-1 capitalize">{item.provider}</p>
                      </div>
                      <div>
                        <p className="font-medium uppercase text-muted-foreground">
                          Amount / Event
                        </p>
                        <p className="mt-1 truncate capitalize">
                          {item.amountOrEvent}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <p className="font-medium uppercase text-muted-foreground">
                          Created
                        </p>
                        <p className="mt-1">{formatDateTime(item.createdAt)}</p>
                      </div>
                    </div>
                    {item.href ? (
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="mt-4 w-full"
                      >
                        <Link href={item.href}>Open</Link>
                      </Button>
                    ) : null}
                  </div>
                ))}
              </div>

              <div className="hidden overflow-hidden rounded-lg border md:block">
                <table className="w-full text-left text-sm">
                  <thead className="border-b bg-muted/40 text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 font-medium">Severity</th>
                      <th className="px-4 py-3 font-medium">Problem</th>
                      <th className="px-4 py-3 font-medium">Provider</th>
                      <th className="px-4 py-3 font-medium">Amount / Event</th>
                      <th className="px-4 py-3 font-medium">Created</th>
                      <th className="px-4 py-3 text-right font-medium">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {reviewItems.map((item, index) => (
                      <tr
                        key={item.id}
                        className={
                          index !== reviewItems.length - 1 ? "border-b" : ""
                        }
                      >
                        <td className="px-4 py-4 align-top">
                          <SeverityBadge severity={item.severity} />
                        </td>
                        <td className="min-w-[280px] px-4 py-4 align-top">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-medium">{item.title}</p>
                            <Badge variant="outline">{item.area}</Badge>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {item.detail}
                          </p>
                        </td>
                        <td className="px-4 py-4 align-top">
                          <Badge variant="outline" className="capitalize">
                            {item.provider}
                          </Badge>
                        </td>
                        <td className="px-4 py-4 align-top">
                          <p className="max-w-[220px] truncate font-medium capitalize">
                            {item.amountOrEvent}
                          </p>
                          <p className="mt-1 font-mono text-xs text-muted-foreground">
                            {shortId(item.id)}
                          </p>
                        </td>
                        <td className="px-4 py-4 align-top text-muted-foreground">
                          {formatDateTime(item.createdAt)}
                        </td>
                        <td className="px-4 py-4 text-right align-top">
                          {item.href ? (
                            <Button asChild variant="outline" size="sm">
                              <Link href={item.href}>Open</Link>
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              Manual
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Receipt className="size-4" />
              Order Integrity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              Flags paid orders without provider payment ids, completion
              timestamps, or active entitlements.
            </p>
            <p>
              Flags provider-created pending orders that remain unsettled after
              30 minutes.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Webhook className="size-4" />
              Webhook Health
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              Surfaces failed webhook events and received or processing events
              stuck longer than 15 minutes.
            </p>
            <p>
              Use this after Razorpay changes, webhook secret rotation, or
              production deploys.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MailWarning className="size-4" />
              Buyer Follow-through
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              Highlights failed, overdue, or stuck commerce email events for
              receipts, access, and support.
            </p>
            <p>
              Digital and bundle orders are checked for available or fulfilled
              delivery records.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
