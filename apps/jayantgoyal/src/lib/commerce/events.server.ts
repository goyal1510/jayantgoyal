import "server-only"

import { createSupabaseAdminClient } from "@/lib/supabase/admin"
import type { CommercePaymentProvider } from "@/lib/commerce/types"

export type CommerceEventType =
  | "product_view"
  | "checkout_started"
  | "checkout_verified"
  | "checkout_failed"
  | "webhook_received"
  | "webhook_processed"
  | "webhook_duplicate"
  | "webhook_failed"
  | "entitlement_granted"

interface CommerceEventInput {
  eventType: CommerceEventType
  userId?: string | null
  productId?: string | null
  priceId?: string | null
  orderId?: string | null
  subscriptionId?: string | null
  paymentProvider?: CommercePaymentProvider | null
  source?: string
  metadata?: Record<string, unknown>
}

function sanitizeMetadata(metadata: Record<string, unknown> | undefined) {
  if (!metadata) return {}

  const safe: Record<string, string | number | boolean | null> = {}

  for (const [key, value] of Object.entries(metadata)) {
    if (!/^[a-zA-Z0-9_:-]{1,64}$/.test(key)) continue

    if (
      value === null ||
      typeof value === "boolean" ||
      typeof value === "number"
    ) {
      safe[key] = value
      continue
    }

    if (typeof value === "string") {
      safe[key] = value.slice(0, 160)
    }
  }

  return safe
}

export async function recordCommerceEvent({
  eventType,
  userId = null,
  productId = null,
  priceId = null,
  orderId = null,
  subscriptionId = null,
  paymentProvider = null,
  source = "server",
  metadata,
}: CommerceEventInput) {
  const { error } = await createSupabaseAdminClient()
    .schema("jg_app")
    .from("commerce_events")
    .insert({
      event_type: eventType,
      user_id: userId,
      product_id: productId,
      price_id: priceId,
      order_id: orderId,
      subscription_id: subscriptionId,
      payment_provider: paymentProvider,
      source,
      metadata: sanitizeMetadata(metadata),
    })

  if (error) {
    throw new Error(error.message)
  }
}

export function trackCommerceEvent(input: CommerceEventInput) {
  void recordCommerceEvent(input).catch(() => {
    console.warn("Commerce analytics event failed")
  })
}
