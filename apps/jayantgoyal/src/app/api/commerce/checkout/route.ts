import { NextResponse, type NextRequest } from "next/server"

import {
  commerceErrorResponse,
  getCommercePaymentProvider,
  getAuthenticatedCommerceUser,
  getCommerceSiteUrl,
  normalizeCommercePath,
} from "@/lib/commerce/api.server"
import {
  createPendingCommerceOrder,
  getActiveCommercePriceForCheckout,
  getCommerceCustomerByUserId,
  updateCommerceOrderCheckoutSession,
  updateCommerceOrderProviderOrder,
  upsertCommerceCustomer,
} from "@/lib/commerce/database.server"
import { trackCommerceEvent } from "@/lib/commerce/events.server"
import { createRazorpayOrder, getRazorpayKeyId } from "@/lib/commerce/razorpay.server"
import { CommerceError } from "@/lib/commerce/types"
import { getStripeClient } from "@/lib/commerce/stripe.server"

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedCommerceUser()
    const body = (await request.json()) as {
      priceId?: unknown
      successPath?: unknown
      cancelPath?: unknown
    }

    if (typeof body.priceId !== "string" || body.priceId.length === 0) {
      throw new CommerceError("invalid_checkout_price", "A valid priceId is required.", 400)
    }

    const { price, product } = await getActiveCommercePriceForCheckout(body.priceId)
    const paymentProvider = getCommercePaymentProvider()

    if (paymentProvider === "razorpay") {
      if (price.price_type !== "one_time") {
        throw new CommerceError(
          "razorpay_recurring_not_ready",
          "Razorpay subscriptions are not configured for this product yet.",
          409
        )
      }

      const order = await createPendingCommerceOrder({
        userId: user.id,
        customerId: null,
        productId: product.id,
        priceId: price.id,
        currency: price.currency,
        amountSubtotal: price.unit_amount,
        amountTotal: price.unit_amount,
        paymentProvider: "razorpay",
      })
      const razorpayOrder = await createRazorpayOrder({
        orderId: order.id,
        userId: user.id,
        productName: product.name,
        amount: price.unit_amount,
        currency: price.currency,
      })

      await updateCommerceOrderProviderOrder({
        orderId: order.id,
        paymentProvider: "razorpay",
        providerOrderId: razorpayOrder.id,
      })
      trackCommerceEvent({
        eventType: "checkout_started",
        userId: user.id,
        productId: product.id,
        priceId: price.id,
        orderId: order.id,
        paymentProvider: "razorpay",
        source: "checkout_api",
        metadata: {
          currency: price.currency,
          amountTotal: price.unit_amount,
          priceType: price.price_type,
        },
      })

      return NextResponse.json({
        provider: "razorpay",
        orderId: order.id,
        razorpayOrderId: razorpayOrder.id,
        keyId: getRazorpayKeyId(),
        amount:
          typeof razorpayOrder.amount === "string"
            ? Number.parseInt(razorpayOrder.amount, 10)
            : razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: "Jayant Goyal",
        description: product.name,
        prefill: {
          email: user.email ?? undefined,
        },
      })
    }

    if (!price.stripe_price_id) {
      throw new CommerceError(
        "missing_stripe_price",
        "This product is not connected to a Stripe price yet.",
        409
      )
    }

    const stripe = getStripeClient()
    const existingCustomer = await getCommerceCustomerByUserId(user.id)
    const stripeCustomerId =
      existingCustomer?.stripe_customer_id ??
      (
        await stripe.customers.create({
          email: user.email ?? undefined,
          metadata: {
            app_user_id: user.id,
          },
        })
      ).id
    const customer = await upsertCommerceCustomer({
      userId: user.id,
      stripeCustomerId,
      email: user.email ?? null,
    })
    const order = await createPendingCommerceOrder({
      userId: user.id,
      customerId: customer.id,
      productId: product.id,
      priceId: price.id,
      currency: price.currency,
      amountSubtotal: price.unit_amount,
      amountTotal: price.unit_amount,
    })
    const siteUrl = getCommerceSiteUrl()
    const successPath = normalizeCommercePath(
      body.successPath,
      "/account/billing?checkout=success"
    )
    const cancelPath = normalizeCommercePath(body.cancelPath, "/pricing?checkout=cancel")
    const successUrl = new URL(successPath, siteUrl)
    successUrl.searchParams.set("session_id", "{CHECKOUT_SESSION_ID}")
    const cancelUrl = new URL(cancelPath, siteUrl)
    const session = await stripe.checkout.sessions.create({
      mode: price.price_type === "recurring" ? "subscription" : "payment",
      customer: stripeCustomerId,
      line_items: [{ price: price.stripe_price_id, quantity: 1 }],
      success_url: successUrl.toString(),
      cancel_url: cancelUrl.toString(),
      client_reference_id: order.id,
      metadata: {
        app_order_id: order.id,
        app_user_id: user.id,
        app_product_id: product.id,
        app_price_id: price.id,
      },
      subscription_data:
        price.price_type === "recurring"
          ? {
              metadata: {
                app_order_id: order.id,
                app_user_id: user.id,
                app_product_id: product.id,
                app_price_id: price.id,
              },
            }
          : undefined,
    })

    if (!session.url) {
      throw new CommerceError(
        "checkout_session_missing_url",
        "Stripe did not return a checkout URL.",
        502
      )
    }

    await updateCommerceOrderCheckoutSession({
      orderId: order.id,
      stripeCheckoutSessionId: session.id,
    })
    trackCommerceEvent({
      eventType: "checkout_started",
      userId: user.id,
      productId: product.id,
      priceId: price.id,
      orderId: order.id,
      paymentProvider: "stripe",
      source: "checkout_api",
      metadata: {
        currency: price.currency,
        amountTotal: price.unit_amount,
        priceType: price.price_type,
      },
    })

    return NextResponse.json({ url: session.url, orderId: order.id })
  } catch (error) {
    return commerceErrorResponse(error)
  }
}
