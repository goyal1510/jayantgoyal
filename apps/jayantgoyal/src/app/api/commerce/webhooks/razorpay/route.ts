import { NextResponse, type NextRequest } from "next/server"

import { commerceErrorResponse } from "@/lib/commerce/api.server"
import {
  getCommerceOrderByProviderOrderId,
  grantOrderProductEntitlements,
  markCommerceWebhookFailed,
  markCommerceWebhookProcessed,
  markOrderFailedFromRazorpay,
  markOrderPaidFromRazorpay,
  recordCommerceWebhookProcessing,
} from "@/lib/commerce/database.server"
import { triggerPurchaseEmails } from "@/lib/commerce/emails.server"
import { trackCommerceEvent } from "@/lib/commerce/events.server"
import { verifyRazorpayWebhookSignature } from "@/lib/commerce/razorpay.server"
import { CommerceError } from "@/lib/commerce/types"

type RazorpayEntity = {
  id?: string
  order_id?: string
  status?: string
  amount?: number
  amount_paid?: number
  currency?: string
}

type RazorpayWebhookPayload = {
  event?: string
  payload?: {
    payment?: { entity?: RazorpayEntity }
    order?: { entity?: RazorpayEntity }
  }
}

function webhookObjectId(payload: RazorpayWebhookPayload) {
  return (
    payload.payload?.payment?.entity?.id ??
    payload.payload?.order?.entity?.id ??
    null
  )
}

async function grantPaidOrderFromProviderOrder({
  providerOrderId,
  providerPaymentId,
  amount,
  currency,
}: {
  providerOrderId: string
  providerPaymentId: string
  amount: number
  currency: string
}) {
  const order = await getCommerceOrderByProviderOrderId({
    paymentProvider: "razorpay",
    providerOrderId,
  })

  if (!order || !order.product_id || !order.price_id) return null

  if (order.status !== "paid") {
    await markOrderPaidFromRazorpay({
      orderId: order.id,
      providerOrderId,
      providerPaymentId,
      amountSubtotal: amount,
      amountTotal: amount,
      currency,
    })
  }

  await grantOrderProductEntitlements({
    userId: order.user_id,
    productId: order.product_id,
    priceId: order.price_id,
    orderId: order.id,
    value: {
      provider: "razorpay",
      razorpayOrderId: providerOrderId,
      razorpayPaymentId: providerPaymentId,
    },
  })

  return order.id
}

async function processRazorpayEvent(payload: RazorpayWebhookPayload) {
  const event = payload.event
  const payment = payload.payload?.payment?.entity
  const order = payload.payload?.order?.entity

  switch (event) {
    case "payment.captured":
    case "order.paid": {
      const providerOrderId = payment?.order_id ?? order?.id
      const providerPaymentId = payment?.id ?? order?.id
      const amount = payment?.amount ?? order?.amount_paid ?? order?.amount
      const currency = payment?.currency ?? order?.currency

      if (!providerOrderId || !providerPaymentId || typeof amount !== "number" || !currency) {
        throw new CommerceError(
          "razorpay_webhook_payload_invalid",
          "Razorpay paid event is missing payment details.",
          400
        )
      }

      return await grantPaidOrderFromProviderOrder({
        providerOrderId,
        providerPaymentId,
        amount,
        currency: currency.toLowerCase(),
      })
      break
    }
    case "payment.failed": {
      if (payment?.order_id) {
        await markOrderFailedFromRazorpay({
          providerOrderId: payment.order_id,
          providerPaymentId: payment.id ?? null,
        })
      }
      break
    }
    default:
      break
  }

  return null
}

export async function POST(request: NextRequest) {
  let webhookEventId: string | null = null

  try {
    const body = await request.text()
    const signature = request.headers.get("x-razorpay-signature")
    const eventId = request.headers.get("x-razorpay-event-id")

    if (!signature) {
      throw new CommerceError(
        "missing_razorpay_signature",
        "Missing Razorpay signature.",
        400
      )
    }

    if (!eventId) {
      throw new CommerceError(
        "missing_razorpay_event_id",
        "Missing Razorpay event id.",
        400
      )
    }

    verifyRazorpayWebhookSignature({ body, signature })

    const payload = JSON.parse(body) as RazorpayWebhookPayload
    const processing = await recordCommerceWebhookProcessing({
      stripeEventId: eventId,
      provider: "razorpay",
      providerEventId: eventId,
      eventType: payload.event ?? "unknown",
      apiVersion: null,
      objectId: webhookObjectId(payload),
      livemode: false,
      payloadSummary: {
        objectId: webhookObjectId(payload),
        event: payload.event,
      },
    })
    webhookEventId = processing.id
    trackCommerceEvent({
      eventType: "webhook_received",
      paymentProvider: "razorpay",
      source: "razorpay_webhook",
      metadata: {
        event: payload.event ?? "unknown",
        objectId: webhookObjectId(payload),
      },
    })

    if (processing.alreadyProcessed) {
      trackCommerceEvent({
        eventType: "webhook_duplicate",
        paymentProvider: "razorpay",
        source: "razorpay_webhook",
        metadata: {
          event: payload.event ?? "unknown",
        },
      })
      return NextResponse.json({ received: true, duplicate: true })
    }

    const paidOrderId = await processRazorpayEvent(payload)
    await markCommerceWebhookProcessed(webhookEventId)
    trackCommerceEvent({
      eventType: "webhook_processed",
      paymentProvider: "razorpay",
      source: "razorpay_webhook",
      metadata: {
        event: payload.event ?? "unknown",
      },
    })
    if (paidOrderId) triggerPurchaseEmails(paidOrderId)

    return NextResponse.json({ received: true })
  } catch (error) {
    if (webhookEventId) {
      await markCommerceWebhookFailed(
        webhookEventId,
        error instanceof Error ? error.message : "Unknown Razorpay webhook failure"
      )
    }
    trackCommerceEvent({
      eventType: "webhook_failed",
      paymentProvider: "razorpay",
      source: "razorpay_webhook",
      metadata: {
        hasWebhookRecord: Boolean(webhookEventId),
        code: error instanceof CommerceError ? error.code : "unknown",
      },
    })

    return commerceErrorResponse(error)
  }
}
