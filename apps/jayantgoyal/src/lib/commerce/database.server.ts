import { createSupabaseAdminClient } from "@/lib/supabase/admin"

import {
  CommerceError,
  type CommerceCustomer,
  type CommerceDelivery,
  type CommerceEntitlement,
  type CommerceOrder,
  type CommercePaymentProvider,
  type CommercePrice,
  type CommerceProduct,
  type CommerceProductWithPrices,
  type CommercePurchase,
  type CommerceSubscription,
  type CommerceSubscriptionWithDetails,
} from "@/lib/commerce/types"

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function getCommerceClient() {
  return createSupabaseAdminClient().schema("jg_app")
}

function handleCommerceError(message: string, error: { message?: string } | null) {
  if (!error) return

  throw new CommerceError("commerce_database_error", `${message}: ${error.message}`, 500)
}

export async function listPublishedCommerceProducts(): Promise<CommerceProductWithPrices[]> {
  const supabase = getCommerceClient()
  const { data: products, error: productError } = await supabase
    .from("commerce_products")
    .select("*")
    .eq("status", "published")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false })

  handleCommerceError("Unable to load commerce products", productError)

  if (!products?.length) return []

  const productIds = products.map((product) => product.id)
  const { data: prices, error: priceError } = await supabase
    .from("commerce_prices")
    .select("*")
    .in("product_id", productIds)
    .eq("is_active", true)
    .order("unit_amount", { ascending: true })

  handleCommerceError("Unable to load commerce prices", priceError)

  const pricesByProductId = new Map<string, CommercePrice[]>()
  for (const price of (prices ?? []) as CommercePrice[]) {
    const current = pricesByProductId.get(price.product_id) ?? []
    current.push(price)
    pricesByProductId.set(price.product_id, current)
  }

  return (products as CommerceProduct[]).map((product) => ({
    ...product,
    prices: pricesByProductId.get(product.id) ?? [],
  }))
}

export async function getPublishedCommerceProductBySlug(
  slug: string
): Promise<CommerceProductWithPrices | null> {
  const supabase = getCommerceClient()
  const { data: product, error: productError } = await supabase
    .from("commerce_products")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle()

  handleCommerceError("Unable to load commerce product", productError)

  if (!product) return null

  const { data: prices, error: priceError } = await supabase
    .from("commerce_prices")
    .select("*")
    .eq("product_id", product.id)
    .eq("is_active", true)
    .order("unit_amount", { ascending: true })

  handleCommerceError("Unable to load commerce prices", priceError)

  return {
    ...(product as CommerceProduct),
    prices: (prices ?? []) as CommercePrice[],
  }
}

export async function getActiveCommercePriceForCheckout(
  priceId: string
): Promise<{ price: CommercePrice; product: CommerceProduct }> {
  const supabase = getCommerceClient()
  const priceQuery = supabase
    .from("commerce_prices")
    .select("*")
    .eq("is_active", true)
    .limit(1)

  const { data: prices, error: priceError } = UUID_PATTERN.test(priceId)
    ? await priceQuery.eq("id", priceId)
    : await priceQuery.or(
        `stripe_price_id.eq.${priceId},provider_price_id.eq.${priceId},lookup_key.eq.${priceId}`
      )

  handleCommerceError("Unable to load commerce price", priceError)

  const price = prices?.[0] as CommercePrice | undefined
  if (!price) {
    throw new CommerceError("commerce_price_not_found", "Commerce price was not found.", 404)
  }

  const { data: product, error: productError } = await supabase
    .from("commerce_products")
    .select("*")
    .eq("id", price.product_id)
    .eq("status", "published")
    .maybeSingle()

  handleCommerceError("Unable to load commerce product", productError)

  if (!product) {
    throw new CommerceError(
      "commerce_product_not_available",
      "Commerce product is not available for checkout.",
      404
    )
  }

  return {
    price,
    product: product as CommerceProduct,
  }
}

export async function getCommerceCustomerByUserId(
  userId: string
): Promise<CommerceCustomer | null> {
  const { data, error } = await getCommerceClient()
    .from("commerce_customers")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle()

  handleCommerceError("Unable to load commerce customer", error)

  return (data as CommerceCustomer | null) ?? null
}

export async function createPendingCommerceOrder({
  userId,
  customerId,
  productId,
  priceId,
  currency,
  amountSubtotal,
  amountTotal,
  paymentProvider = "razorpay",
}: {
  userId: string
  customerId: string | null
  productId: string
  priceId: string
  currency: string
  amountSubtotal: number
  amountTotal: number
  paymentProvider?: CommercePaymentProvider
}): Promise<CommerceOrder> {
  const { data, error } = await getCommerceClient()
    .from("commerce_orders")
    .insert({
      user_id: userId,
      customer_id: customerId,
      product_id: productId,
      price_id: priceId,
      payment_provider: paymentProvider,
      status: "pending",
      currency,
      amount_subtotal: amountSubtotal,
      amount_total: amountTotal,
    })
    .select("*")
    .single()

  handleCommerceError("Unable to create pending commerce order", error)

  return data as CommerceOrder
}

export async function updateCommerceOrderProviderOrder({
  orderId,
  paymentProvider,
  providerOrderId,
}: {
  orderId: string
  paymentProvider: CommercePaymentProvider
  providerOrderId: string
}): Promise<CommerceOrder> {
  const { data, error } = await getCommerceClient()
    .from("commerce_orders")
    .update({
      payment_provider: paymentProvider,
      provider_order_id: providerOrderId,
    })
    .eq("id", orderId)
    .select("*")
    .single()

  handleCommerceError("Unable to update commerce order provider order", error)

  return data as CommerceOrder
}

export async function updateCommerceOrderCheckoutSession({
  orderId,
  stripeCheckoutSessionId,
}: {
  orderId: string
  stripeCheckoutSessionId: string
}): Promise<CommerceOrder> {
  const { data, error } = await getCommerceClient()
    .from("commerce_orders")
    .update({ stripe_checkout_session_id: stripeCheckoutSessionId })
    .eq("id", orderId)
    .select("*")
    .single()

  handleCommerceError("Unable to update commerce order checkout session", error)

  return data as CommerceOrder
}

export async function listPaidPurchasesForUser(userId: string): Promise<CommerceOrder[]> {
  const { data, error } = await getCommerceClient()
    .from("commerce_orders")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "paid")
    .order("completed_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })

  handleCommerceError("Unable to load commerce purchases", error)

  return (data ?? []) as CommerceOrder[]
}

async function loadProductsById(productIds: string[]) {
  const uniqueIds = [...new Set(productIds.filter(Boolean))]
  if (!uniqueIds.length) return new Map<string, CommerceProduct>()

  const { data, error } = await getCommerceClient()
    .from("commerce_products")
    .select("*")
    .in("id", uniqueIds)

  handleCommerceError("Unable to load commerce products by id", error)

  return new Map((data ?? []).map((product) => [product.id, product as CommerceProduct]))
}

async function loadPricesById(priceIds: string[]) {
  const uniqueIds = [...new Set(priceIds.filter(Boolean))]
  if (!uniqueIds.length) return new Map<string, CommercePrice>()

  const { data, error } = await getCommerceClient()
    .from("commerce_prices")
    .select("*")
    .in("id", uniqueIds)

  handleCommerceError("Unable to load commerce prices by id", error)

  return new Map((data ?? []).map((price) => [price.id, price as CommercePrice]))
}

async function loadDeliveriesByOrderIds(orderIds: string[]) {
  const uniqueIds = [...new Set(orderIds.filter(Boolean))]
  if (!uniqueIds.length) return new Map<string, CommerceDelivery[]>()

  const { data, error } = await getCommerceClient()
    .from("commerce_deliveries")
    .select("*")
    .in("order_id", uniqueIds)
    .order("created_at", { ascending: true })

  handleCommerceError("Unable to load commerce deliveries", error)

  const deliveriesByOrderId = new Map<string, CommerceDelivery[]>()
  for (const delivery of (data ?? []) as CommerceDelivery[]) {
    if (!delivery.order_id) continue
    deliveriesByOrderId.set(delivery.order_id, [
      ...(deliveriesByOrderId.get(delivery.order_id) ?? []),
      delivery,
    ])
  }

  return deliveriesByOrderId
}

export async function listPaidPurchasesWithDetailsForUser(
  userId: string
): Promise<CommercePurchase[]> {
  const orders = await listPaidPurchasesForUser(userId)
  const [productsById, pricesById, deliveriesByOrderId] = await Promise.all([
    loadProductsById(orders.map((order) => order.product_id).filter(Boolean) as string[]),
    loadPricesById(orders.map((order) => order.price_id).filter(Boolean) as string[]),
    loadDeliveriesByOrderIds(orders.map((order) => order.id)),
  ])

  return orders.map((order) => ({
    ...order,
    product: order.product_id ? productsById.get(order.product_id) ?? null : null,
    price: order.price_id ? pricesById.get(order.price_id) ?? null : null,
    deliveries: deliveriesByOrderId.get(order.id) ?? [],
  }))
}

export async function getPaidPurchaseWithDetailsForUser({
  orderId,
  userId,
}: {
  orderId: string
  userId: string
}): Promise<CommercePurchase | null> {
  const { data: order, error } = await getCommerceClient()
    .from("commerce_orders")
    .select("*")
    .eq("id", orderId)
    .eq("user_id", userId)
    .eq("status", "paid")
    .maybeSingle()

  handleCommerceError("Unable to load commerce purchase", error)

  if (!order) return null

  const [productsById, pricesById, deliveriesByOrderId] = await Promise.all([
    loadProductsById(order.product_id ? [order.product_id] : []),
    loadPricesById(order.price_id ? [order.price_id] : []),
    loadDeliveriesByOrderIds([order.id]),
  ])

  return {
    ...(order as CommerceOrder),
    product: order.product_id ? productsById.get(order.product_id) ?? null : null,
    price: order.price_id ? pricesById.get(order.price_id) ?? null : null,
    deliveries: deliveriesByOrderId.get(order.id) ?? [],
  }
}

export async function getPaidPurchaseWithDetailsByOrderId(
  orderId: string
): Promise<CommercePurchase | null> {
  const { data: order, error } = await getCommerceClient()
    .from("commerce_orders")
    .select("*")
    .eq("id", orderId)
    .eq("status", "paid")
    .maybeSingle()

  handleCommerceError("Unable to load paid commerce order", error)

  if (!order) return null

  const [productsById, pricesById, deliveriesByOrderId] = await Promise.all([
    loadProductsById(order.product_id ? [order.product_id] : []),
    loadPricesById(order.price_id ? [order.price_id] : []),
    loadDeliveriesByOrderIds([order.id]),
  ])

  return {
    ...(order as CommerceOrder),
    product: order.product_id ? productsById.get(order.product_id) ?? null : null,
    price: order.price_id ? pricesById.get(order.price_id) ?? null : null,
    deliveries: deliveriesByOrderId.get(order.id) ?? [],
  }
}

export async function getAvailableDeliveryForPaidPurchase({
  orderId,
  deliveryId,
  userId,
}: {
  orderId: string
  deliveryId: string
  userId: string
}): Promise<CommerceDelivery | null> {
  const supabase = getCommerceClient()
  const { data: order, error: orderError } = await supabase
    .from("commerce_orders")
    .select("id")
    .eq("id", orderId)
    .eq("user_id", userId)
    .eq("status", "paid")
    .maybeSingle()

  handleCommerceError("Unable to load paid purchase for delivery", orderError)
  if (!order) return null

  const { data: delivery, error: deliveryError } = await supabase
    .from("commerce_deliveries")
    .select("*")
    .eq("id", deliveryId)
    .eq("order_id", orderId)
    .eq("user_id", userId)
    .maybeSingle()

  handleCommerceError("Unable to load purchase delivery", deliveryError)

  return (delivery as CommerceDelivery | null) ?? null
}

export async function markCommerceDeliveryAccessed(deliveryId: string, nextCount: number) {
  const { error } = await getCommerceClient()
    .from("commerce_deliveries")
    .update({
      status: "fulfilled",
      download_count: nextCount,
    })
    .eq("id", deliveryId)

  handleCommerceError("Unable to mark commerce delivery accessed", error)
}

export async function listCommerceSubscriptionsForUser(
  userId: string
): Promise<CommerceSubscriptionWithDetails[]> {
  const { data, error } = await getCommerceClient()
    .from("commerce_subscriptions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  handleCommerceError("Unable to load commerce subscriptions", error)

  const subscriptions = (data ?? []) as CommerceSubscription[]
  const [productsById, pricesById] = await Promise.all([
    loadProductsById(
      subscriptions.map((subscription) => subscription.product_id).filter(Boolean) as string[]
    ),
    loadPricesById(
      subscriptions.map((subscription) => subscription.price_id).filter(Boolean) as string[]
    ),
  ])

  return subscriptions.map((subscription) => ({
    ...subscription,
    product: subscription.product_id ? productsById.get(subscription.product_id) ?? null : null,
    price: subscription.price_id ? pricesById.get(subscription.price_id) ?? null : null,
  }))
}

export async function upsertCommerceCustomer({
  userId,
  stripeCustomerId,
  email,
}: {
  userId: string
  stripeCustomerId: string
  email: string | null
}): Promise<CommerceCustomer> {
  const { data, error } = await getCommerceClient()
    .from("commerce_customers")
    .upsert(
      {
        user_id: userId,
        stripe_customer_id: stripeCustomerId,
        email,
      },
      { onConflict: "user_id" }
    )
    .select("*")
    .single()

  handleCommerceError("Unable to save commerce customer", error)

  return data as CommerceCustomer
}

export async function listActiveEntitlementsForUser(
  userId: string
): Promise<CommerceEntitlement[]> {
  const now = new Date().toISOString()
  const { data, error } = await getCommerceClient()
    .from("commerce_entitlements")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active")
    .lte("starts_at", now)
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .order("created_at", { ascending: false })

  handleCommerceError("Unable to load commerce entitlements", error)

  return (data ?? []) as CommerceEntitlement[]
}

export async function hasActiveEntitlement(userId: string, featureKey: string) {
  const now = new Date().toISOString()
  const { data, error } = await getCommerceClient()
    .from("commerce_entitlements")
    .select("id")
    .eq("user_id", userId)
    .eq("feature_key", featureKey)
    .eq("status", "active")
    .lte("starts_at", now)
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .limit(1)

  handleCommerceError("Unable to check commerce entitlement", error)

  return !!data?.length
}

export async function recordCommerceWebhookProcessing({
  stripeEventId,
  provider = "stripe",
  providerEventId = stripeEventId,
  eventType,
  apiVersion,
  objectId,
  livemode,
  payloadSummary,
}: {
  stripeEventId: string
  provider?: CommercePaymentProvider
  providerEventId?: string
  eventType: string
  apiVersion: string | null
  objectId: string | null
  livemode: boolean
  payloadSummary: Record<string, unknown>
}) {
  const supabase = getCommerceClient()
  const { data: existing, error: existingError } = await supabase
    .from("commerce_webhook_events")
    .select("id,status")
    .eq("stripe_event_id", stripeEventId)
    .maybeSingle()

  handleCommerceError("Unable to load commerce webhook event", existingError)

  if (existing?.status === "processed") {
    return { id: existing.id as string, alreadyProcessed: true }
  }

  const { data, error } = await supabase
    .from("commerce_webhook_events")
    .upsert(
      {
        stripe_event_id: stripeEventId,
        provider,
        provider_event_id: providerEventId,
        event_type: eventType,
        api_version: apiVersion,
        object_id: objectId,
        livemode,
        status: "processing",
        payload_summary: payloadSummary,
        attempt_count: existing ? undefined : 1,
        last_error: null,
      },
      { onConflict: "stripe_event_id" }
    )
    .select("id")
    .single()

  handleCommerceError("Unable to record commerce webhook event", error)

  if (!data) {
    throw new CommerceError(
      "commerce_webhook_record_missing",
      "Webhook event was not returned after recording.",
      500
    )
  }

  return { id: data.id as string, alreadyProcessed: false }
}

export async function markCommerceWebhookProcessed(webhookEventId: string) {
  const { error } = await getCommerceClient()
    .from("commerce_webhook_events")
    .update({
      status: "processed",
      processed_at: new Date().toISOString(),
      last_error: null,
    })
    .eq("id", webhookEventId)

  handleCommerceError("Unable to mark commerce webhook processed", error)
}

export async function markCommerceWebhookFailed(webhookEventId: string, message: string) {
  const { error } = await getCommerceClient()
    .from("commerce_webhook_events")
    .update({
      status: "failed",
      last_error: message.slice(0, 2000),
    })
    .eq("id", webhookEventId)

  handleCommerceError("Unable to mark commerce webhook failed", error)
}

export async function getCommerceOrderForCheckoutVerification({
  orderId,
  userId,
  paymentProvider,
  providerOrderId,
}: {
  orderId: string
  userId: string
  paymentProvider: CommercePaymentProvider
  providerOrderId: string
}): Promise<CommerceOrder | null> {
  const { data, error } = await getCommerceClient()
    .from("commerce_orders")
    .select("*")
    .eq("id", orderId)
    .eq("user_id", userId)
    .eq("payment_provider", paymentProvider)
    .eq("provider_order_id", providerOrderId)
    .maybeSingle()

  handleCommerceError("Unable to load commerce order for verification", error)

  return (data as CommerceOrder | null) ?? null
}

export async function getCommerceOrderByProviderOrderId({
  paymentProvider,
  providerOrderId,
}: {
  paymentProvider: CommercePaymentProvider
  providerOrderId: string
}): Promise<CommerceOrder | null> {
  const { data, error } = await getCommerceClient()
    .from("commerce_orders")
    .select("*")
    .eq("payment_provider", paymentProvider)
    .eq("provider_order_id", providerOrderId)
    .maybeSingle()

  handleCommerceError("Unable to load commerce order by provider order id", error)

  return (data as CommerceOrder | null) ?? null
}

export async function markOrderPaidFromCheckout({
  orderId,
  stripeCheckoutSessionId,
  stripePaymentIntentId,
  amountSubtotal,
  amountTotal,
  currency,
}: {
  orderId: string
  stripeCheckoutSessionId: string
  stripePaymentIntentId: string | null
  amountSubtotal: number
  amountTotal: number
  currency: string
}) {
  const { error } = await getCommerceClient()
    .from("commerce_orders")
    .update({
      stripe_checkout_session_id: stripeCheckoutSessionId,
      stripe_payment_intent_id: stripePaymentIntentId,
      status: "paid",
      amount_subtotal: amountSubtotal,
      amount_total: amountTotal,
      currency,
      completed_at: new Date().toISOString(),
    })
    .eq("id", orderId)

  handleCommerceError("Unable to mark commerce order paid", error)
}

export async function markOrderPaidFromRazorpay({
  orderId,
  providerOrderId,
  providerPaymentId,
  amountSubtotal,
  amountTotal,
  currency,
}: {
  orderId: string
  providerOrderId: string
  providerPaymentId: string
  amountSubtotal: number
  amountTotal: number
  currency: string
}) {
  const { error } = await getCommerceClient()
    .from("commerce_orders")
    .update({
      payment_provider: "razorpay",
      provider_order_id: providerOrderId,
      provider_payment_id: providerPaymentId,
      status: "paid",
      amount_subtotal: amountSubtotal,
      amount_total: amountTotal,
      currency,
      completed_at: new Date().toISOString(),
    })
    .eq("id", orderId)

  handleCommerceError("Unable to mark Razorpay commerce order paid", error)
}

export async function markOrderFailedFromRazorpay({
  providerOrderId,
  providerPaymentId,
}: {
  providerOrderId: string
  providerPaymentId: string | null
}) {
  const { error } = await getCommerceClient()
    .from("commerce_orders")
    .update({
      provider_payment_id: providerPaymentId,
      status: "failed",
    })
    .eq("payment_provider", "razorpay")
    .eq("provider_order_id", providerOrderId)
    .eq("status", "pending")

  handleCommerceError("Unable to mark Razorpay commerce order failed", error)
}

export async function markOrderExpiredFromCheckout({
  orderId,
  stripeCheckoutSessionId,
}: {
  orderId: string
  stripeCheckoutSessionId: string
}) {
  const { error } = await getCommerceClient()
    .from("commerce_orders")
    .update({
      stripe_checkout_session_id: stripeCheckoutSessionId,
      status: "expired",
    })
    .eq("id", orderId)
    .eq("status", "pending")

  handleCommerceError("Unable to mark commerce order expired", error)
}

export async function grantOrderEntitlement({
  userId,
  productId,
  priceId,
  orderId,
  featureKey,
  value = {},
}: {
  userId: string
  productId: string
  priceId: string
  orderId: string
  featureKey: string
  value?: Record<string, unknown>
}) {
  const supabase = getCommerceClient()
  const { data: existing, error: existingError } = await supabase
    .from("commerce_entitlements")
    .select("id")
    .eq("order_id", orderId)
    .eq("feature_key", featureKey)
    .limit(1)

  handleCommerceError("Unable to check existing order entitlement", existingError)

  if (existing?.length) return

  const { error } = await supabase
    .from("commerce_entitlements")
    .insert({
      user_id: userId,
      product_id: productId,
      price_id: priceId,
      order_id: orderId,
      source_type: "order",
      feature_key: featureKey,
      status: "active",
      value,
    })

  handleCommerceError("Unable to grant order entitlement", error)
}

export async function grantOrderProductEntitlements({
  userId,
  productId,
  priceId,
  orderId,
  value = {},
}: {
  userId: string
  productId: string
  priceId: string
  orderId: string
  value?: Record<string, unknown>
}) {
  await grantOrderEntitlement({
    userId,
    productId,
    priceId,
    orderId,
    featureKey: `product:${productId}`,
    value,
  })

  await grantOrderEntitlement({
    userId,
    productId,
    priceId,
    orderId,
    featureKey: "workspace_pro",
    value,
  })
}
