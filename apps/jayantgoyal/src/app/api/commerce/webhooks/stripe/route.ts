import { NextResponse, type NextRequest } from "next/server"
import Stripe from "stripe"

import { commerceErrorResponse } from "@/lib/commerce/api.server"
import {
  grantOrderProductEntitlements,
  markCommerceWebhookFailed,
  markCommerceWebhookProcessed,
  markOrderExpiredFromCheckout,
  markOrderPaidFromCheckout,
  recordCommerceWebhookProcessing,
} from "@/lib/commerce/database.server"
import { CommerceError } from "@/lib/commerce/types"
import {
  assertStripeEventMode,
  getStripeClient,
  getStripeWebhookSecret,
} from "@/lib/commerce/stripe.server"

function stripeObjectId(event: Stripe.Event) {
  const object = event.data.object as { id?: string }

  return object.id ?? null
}

async function processCheckoutCompleted(session: Stripe.Checkout.Session) {
  const orderId = session.metadata?.app_order_id
  const userId = session.metadata?.app_user_id
  const productId = session.metadata?.app_product_id
  const priceId = session.metadata?.app_price_id

  if (!orderId || !userId || !productId || !priceId) {
    throw new CommerceError(
      "checkout_metadata_missing",
      "Checkout session is missing app metadata.",
      400
    )
  }

  await markOrderPaidFromCheckout({
    orderId,
    stripeCheckoutSessionId: session.id,
    stripePaymentIntentId:
      typeof session.payment_intent === "string" ? session.payment_intent : null,
    amountSubtotal: session.amount_subtotal ?? 0,
    amountTotal: session.amount_total ?? 0,
    currency: session.currency ?? "usd",
  })

  await grantOrderProductEntitlements({
    userId,
    productId,
    priceId,
    orderId,
    value: {
      checkoutSessionId: session.id,
      mode: session.mode,
    },
  })
}

async function processCheckoutExpired(session: Stripe.Checkout.Session) {
  const orderId = session.metadata?.app_order_id

  if (!orderId) return

  await markOrderExpiredFromCheckout({
    orderId,
    stripeCheckoutSessionId: session.id,
  })
}

async function processStripeEvent(event: Stripe.Event) {
  switch (event.type) {
    case "checkout.session.completed":
      await processCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
      break
    case "checkout.session.expired":
      await processCheckoutExpired(event.data.object as Stripe.Checkout.Session)
      break
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
    case "invoice.payment_succeeded":
    case "invoice.payment_failed":
      // The first API slice records these event types idempotently. Subscription
      // mirror updates are handled in the next task packet once catalog seeding
      // and subscription UI states exist.
      break
    default:
      break
  }
}

export async function POST(request: NextRequest) {
  let webhookEventId: string | null = null

  try {
    const body = await request.text()
    const signature = request.headers.get("stripe-signature")

    if (!signature) {
      throw new CommerceError(
        "missing_stripe_signature",
        "Missing Stripe signature.",
        400
      )
    }

    const event = getStripeClient().webhooks.constructEvent(
      body,
      signature,
      getStripeWebhookSecret()
    )
    assertStripeEventMode(event.livemode)

    const processing = await recordCommerceWebhookProcessing({
      stripeEventId: event.id,
      eventType: event.type,
      apiVersion: event.api_version ?? null,
      objectId: stripeObjectId(event),
      livemode: event.livemode,
      payloadSummary: {
        objectId: stripeObjectId(event),
        objectType: event.data.object.object,
      },
    })
    webhookEventId = processing.id

    if (processing.alreadyProcessed) {
      return NextResponse.json({ received: true, duplicate: true })
    }

    await processStripeEvent(event)
    await markCommerceWebhookProcessed(webhookEventId)

    return NextResponse.json({ received: true })
  } catch (error) {
    if (webhookEventId) {
      await markCommerceWebhookFailed(
        webhookEventId,
        error instanceof Error ? error.message : "Unknown webhook failure"
      )
    }

    return commerceErrorResponse(error)
  }
}
