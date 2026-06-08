import { NextResponse, type NextRequest } from "next/server"

import {
  commerceErrorResponse,
  getAuthenticatedCommerceUser,
} from "@/lib/commerce/api.server"
import {
  getCommerceOrderForCheckoutVerification,
  grantOrderProductEntitlements,
  markOrderPaidFromRazorpay,
} from "@/lib/commerce/database.server"
import { triggerPurchaseEmails } from "@/lib/commerce/emails.server"
import { trackCommerceEvent } from "@/lib/commerce/events.server"
import { verifyRazorpayPaymentSignature } from "@/lib/commerce/razorpay.server"
import { CommerceError } from "@/lib/commerce/types"

function requireString(value: unknown, code: string, message: string) {
  if (typeof value !== "string" || value.length === 0) {
    throw new CommerceError(code, message, 400)
  }

  return value
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedCommerceUser()
    const body = (await request.json()) as Record<string, unknown>
    const orderId = requireString(body.orderId, "invalid_order_id", "A valid order id is required.")
    const razorpayOrderId = requireString(
      body.razorpayOrderId,
      "invalid_razorpay_order_id",
      "A valid Razorpay order id is required."
    )
    const razorpayPaymentId = requireString(
      body.razorpayPaymentId,
      "invalid_razorpay_payment_id",
      "A valid Razorpay payment id is required."
    )
    const razorpaySignature = requireString(
      body.razorpaySignature,
      "invalid_razorpay_signature",
      "A valid Razorpay signature is required."
    )

    verifyRazorpayPaymentSignature({
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    })

    const order = await getCommerceOrderForCheckoutVerification({
      orderId,
      userId: user.id,
      paymentProvider: "razorpay",
      providerOrderId: razorpayOrderId,
    })

    if (!order) {
      throw new CommerceError(
        "commerce_order_not_found",
        "Commerce order was not found for this payment.",
        404
      )
    }

    if (order.status !== "paid") {
      await markOrderPaidFromRazorpay({
        orderId: order.id,
        providerOrderId: razorpayOrderId,
        providerPaymentId: razorpayPaymentId,
        amountSubtotal: order.amount_subtotal,
        amountTotal: order.amount_total,
        currency: order.currency,
      })
    }

    if (order.product_id && order.price_id) {
      await grantOrderProductEntitlements({
        userId: order.user_id,
        productId: order.product_id,
        priceId: order.price_id,
        orderId: order.id,
        value: {
          provider: "razorpay",
          razorpayOrderId,
          razorpayPaymentId,
        },
      })
      trackCommerceEvent({
        eventType: "entitlement_granted",
        userId: order.user_id,
        productId: order.product_id,
        priceId: order.price_id,
        orderId: order.id,
        paymentProvider: "razorpay",
        source: "checkout_verify",
        metadata: {
          feature: "workspace_pro",
        },
      })
    }

    trackCommerceEvent({
      eventType: "checkout_verified",
      userId: order.user_id,
      productId: order.product_id,
      priceId: order.price_id,
      orderId: order.id,
      paymentProvider: "razorpay",
      source: "checkout_verify",
      metadata: {
        currency: order.currency,
        amountTotal: order.amount_total,
      },
    })
    triggerPurchaseEmails(order.id)

    return NextResponse.json({ verified: true, orderId: order.id })
  } catch (error) {
    return commerceErrorResponse(error)
  }
}
