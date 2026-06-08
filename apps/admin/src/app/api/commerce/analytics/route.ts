import { NextResponse } from "next/server";
import { authorizeCommerceAdmin } from "../helpers";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

const RANGE_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;
const ACTIVE_SUBSCRIPTION_STATUSES = new Set(["active", "trialing"]);
const CHURNED_SUBSCRIPTION_STATUSES = new Set(["canceled", "unpaid", "paused"]);

type OrderRow = {
  id: string;
  user_id: string;
  product_id: string | null;
  price_id: string | null;
  payment_provider: "razorpay" | "stripe";
  status: "pending" | "paid" | "failed" | "refunded" | "canceled" | "expired";
  currency: string;
  amount_total: number;
  completed_at: string | null;
  created_at: string;
};

type ProductRow = {
  id: string;
  slug: string;
  name: string;
  status: string;
  product_type: string;
};

type SubscriptionRow = {
  id: string;
  user_id: string;
  product_id: string | null;
  status: string;
  created_at: string;
};

type EventRow = {
  id: string;
  event_type: string;
  product_id: string | null;
  order_id: string | null;
  payment_provider: "razorpay" | "stripe" | null;
  created_at: string;
};

type WebhookRow = {
  id: string;
  provider: "razorpay" | "stripe";
  event_type: string;
  status: "received" | "processing" | "processed" | "failed" | "ignored";
  created_at: string;
  processed_at: string | null;
};

type SupportConversationRow = {
  id: string;
  metadata: Record<string, unknown>;
  created_at: string;
};

type EntitlementRow = {
  id: string;
  user_id: string;
  status: "active" | "revoked" | "expired";
  starts_at: string;
  expires_at: string | null;
};

function startOfUtcDay(value: Date) {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
}

function dateKey(value: string | Date) {
  return startOfUtcDay(value instanceof Date ? value : new Date(value)).toISOString().slice(0, 10);
}

function addMinor(map: Map<string, number>, currency: string, amount: number) {
  map.set(currency, (map.get(currency) ?? 0) + amount);
}

function increment(map: Map<string, number>, key: string, amount = 1) {
  map.set(key, (map.get(key) ?? 0) + amount);
}

function toCountArray(map: Map<string, number>) {
  return [...map.entries()]
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count || a.key.localeCompare(b.key));
}

function ratio(numerator: number, denominator: number) {
  if (denominator <= 0) return 0;
  return Math.round((numerator / denominator) * 1000) / 10;
}

function supportStatus(metadata: Record<string, unknown>) {
  const value = metadata.support_status;
  return value === "pending" || value === "resolved" ? value : "open";
}

export async function GET() {
  try {
    const auth = await authorizeCommerceAdmin();
    if ("error" in auth) return auth.error;

    const now = new Date();
    const rangeStart = new Date(now.getTime() - RANGE_DAYS * DAY_MS);
    const rangeStartIso = rangeStart.toISOString();
    const app = createSupabaseAdminClient().schema("jg_app");

    const [
      ordersResult,
      productsResult,
      subscriptionsResult,
      eventsResult,
      webhooksResult,
      supportResult,
      entitlementsResult,
    ] = await Promise.all([
      app
        .from("commerce_orders")
        .select("id,user_id,product_id,price_id,payment_provider,status,currency,amount_total,completed_at,created_at")
        .gte("created_at", rangeStartIso)
        .order("created_at", { ascending: false }),
      app
        .from("commerce_products")
        .select("id,slug,name,status,product_type")
        .order("sort_order", { ascending: true }),
      app
        .from("commerce_subscriptions")
        .select("id,user_id,product_id,status,created_at")
        .order("created_at", { ascending: false }),
      app
        .from("commerce_events")
        .select("id,event_type,product_id,order_id,payment_provider,created_at")
        .gte("created_at", rangeStartIso)
        .order("created_at", { ascending: false })
        .limit(5000),
      app
        .from("commerce_webhook_events")
        .select("id,provider,event_type,status,created_at,processed_at")
        .gte("created_at", rangeStartIso)
        .order("created_at", { ascending: false })
        .limit(1000),
      app
        .from("messenger_conversations")
        .select("id,metadata,created_at")
        .eq("conversation_type", "support")
        .eq("is_archived", false)
        .limit(1000),
      app
        .from("commerce_entitlements")
        .select("id,user_id,status,starts_at,expires_at")
        .eq("status", "active")
        .lte("starts_at", now.toISOString())
        .or(`expires_at.is.null,expires_at.gt.${now.toISOString()}`)
        .limit(5000),
    ]);

    const firstError = [
      ordersResult.error,
      productsResult.error,
      subscriptionsResult.error,
      eventsResult.error,
      webhooksResult.error,
      supportResult.error,
      entitlementsResult.error,
    ].find(Boolean);

    if (firstError) {
      return NextResponse.json({ error: firstError.message }, { status: 500 });
    }

    const orders = (ordersResult.data ?? []) as OrderRow[];
    const products = (productsResult.data ?? []) as ProductRow[];
    const subscriptions = (subscriptionsResult.data ?? []) as SubscriptionRow[];
    const events = (eventsResult.data ?? []) as EventRow[];
    const webhooks = (webhooksResult.data ?? []) as WebhookRow[];
    const supportThreads = (supportResult.data ?? []) as SupportConversationRow[];
    const entitlements = (entitlementsResult.data ?? []) as EntitlementRow[];

    const paidOrders = orders.filter((order) => order.status === "paid");
    const revenueByCurrencyMap = new Map<string, number>();
    const paidOrdersByCurrencyMap = new Map<string, number>();
    const orderStatusMap = new Map<string, number>();
    const eventTypeMap = new Map<string, number>();
    const webhookStatusMap = new Map<string, number>();
    const supportStatusMap = new Map<string, number>();

    for (const order of orders) {
      increment(orderStatusMap, order.status);
      if (order.status === "paid") {
        addMinor(revenueByCurrencyMap, order.currency, order.amount_total);
        increment(paidOrdersByCurrencyMap, order.currency);
      }
    }

    for (const event of events) increment(eventTypeMap, event.event_type);
    for (const webhook of webhooks) increment(webhookStatusMap, webhook.status);
    for (const thread of supportThreads) increment(supportStatusMap, supportStatus(thread.metadata));

    const revenueByCurrency = [...revenueByCurrencyMap.entries()]
      .map(([currency, amountMinor]) => ({
        currency,
        amountMinor,
        paidOrders: paidOrdersByCurrencyMap.get(currency) ?? 0,
      }))
      .sort((a, b) => b.amountMinor - a.amountMinor || a.currency.localeCompare(b.currency));
    const primaryCurrency = revenueByCurrency[0]?.currency ?? "inr";

    const dailyRevenueMap = new Map<string, { amountMinor: number; paidOrders: number }>();
    for (let index = RANGE_DAYS - 1; index >= 0; index -= 1) {
      const key = dateKey(new Date(now.getTime() - index * DAY_MS));
      dailyRevenueMap.set(key, { amountMinor: 0, paidOrders: 0 });
    }
    for (const order of paidOrders) {
      if (order.currency !== primaryCurrency) continue;
      const key = dateKey(order.completed_at ?? order.created_at);
      const current = dailyRevenueMap.get(key);
      if (!current) continue;
      current.amountMinor += order.amount_total;
      current.paidOrders += 1;
    }

    const productRows = products.map((product) => {
      const productOrders = orders.filter((order) => order.product_id === product.id);
      const productPaidOrders = productOrders.filter((order) => order.status === "paid");
      const productEvents = events.filter((event) => event.product_id === product.id);
      const checkoutStarts = productEvents.filter(
        (event) => event.event_type === "checkout_started"
      ).length;
      const productViews = productEvents.filter((event) => event.event_type === "product_view").length;
      const revenueMinor = productPaidOrders
        .filter((order) => order.currency === primaryCurrency)
        .reduce((total, order) => total + order.amount_total, 0);

      return {
        productId: product.id,
        name: product.name,
        slug: product.slug,
        status: product.status,
        productType: product.product_type,
        views: productViews,
        checkoutStarts,
        paidOrders: productPaidOrders.length,
        revenueMinor,
        conversionRate: ratio(productPaidOrders.length, checkoutStarts || productViews),
      };
    });

    const activeSubscriptions = subscriptions.filter((subscription) =>
      ACTIVE_SUBSCRIPTION_STATUSES.has(subscription.status)
    );
    const churnedSubscriptions = subscriptions.filter((subscription) =>
      CHURNED_SUBSCRIPTION_STATUSES.has(subscription.status)
    );
    const activeEntitlementUsers = new Set(entitlements.map((entitlement) => entitlement.user_id));
    const checkoutStarted = eventTypeMap.get("checkout_started") ?? 0;
    const checkoutVerified = eventTypeMap.get("checkout_verified") ?? 0;
    const productViews = eventTypeMap.get("product_view") ?? 0;
    const webhookProcessed = webhookStatusMap.get("processed") ?? 0;
    const webhookFailed = webhookStatusMap.get("failed") ?? 0;
    const openSupportThreads = supportStatusMap.get("open") ?? 0;

    return NextResponse.json({
      data: {
        generatedAt: now.toISOString(),
        rangeDays: RANGE_DAYS,
        primaryCurrency,
        summary: {
          totalOrders: orders.length,
          paidOrders: paidOrders.length,
          pendingOrders: orderStatusMap.get("pending") ?? 0,
          failedOrders:
            (orderStatusMap.get("failed") ?? 0) +
            (orderStatusMap.get("canceled") ?? 0) +
            (orderStatusMap.get("expired") ?? 0),
          grossRevenue: revenueByCurrency[0] ?? {
            currency: primaryCurrency,
            amountMinor: 0,
            paidOrders: 0,
          },
          checkoutConversionRate: ratio(checkoutVerified || paidOrders.length, checkoutStarted),
          activeSubscriptions: activeSubscriptions.length,
          churnedSubscriptions: churnedSubscriptions.length,
          activeEntitlementUsers: activeEntitlementUsers.size,
          openSupportThreads,
          failedWebhooks: webhookFailed,
          processedWebhooks: webhookProcessed,
        },
        funnel: [
          { key: "product_view", label: "Product views", count: productViews },
          { key: "checkout_started", label: "Checkout started", count: checkoutStarted },
          { key: "checkout_verified", label: "Checkout verified", count: checkoutVerified },
          { key: "paid_orders", label: "Paid orders", count: paidOrders.length },
          { key: "entitlement_granted", label: "Entitlements granted", count: eventTypeMap.get("entitlement_granted") ?? 0 },
        ],
        revenueByCurrency,
        dailyRevenue: [...dailyRevenueMap.entries()].map(([date, value]) => ({
          date,
          ...value,
        })),
        productSales: productRows.sort(
          (a, b) => b.revenueMinor - a.revenueMinor || b.paidOrders - a.paidOrders || a.name.localeCompare(b.name)
        ),
        orderStatus: toCountArray(orderStatusMap),
        eventCounts: toCountArray(eventTypeMap),
        webhookStatus: toCountArray(webhookStatusMap),
        supportStatus: toCountArray(supportStatusMap),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
