import Stripe from "stripe"

import { CommerceError, type CommerceStripeMode } from "@/lib/commerce/types"

let stripeClient: Stripe | null = null

export function getCommerceStripeMode(): CommerceStripeMode {
  const mode = process.env.COMMERCE_STRIPE_MODE ?? "test"

  if (mode !== "test" && mode !== "live") {
    throw new CommerceError(
      "invalid_commerce_mode",
      "COMMERCE_STRIPE_MODE must be test or live.",
      500
    )
  }

  return mode
}

function getStripeSecretKey() {
  const secretKey = process.env.STRIPE_SECRET_KEY

  if (!secretKey) {
    throw new CommerceError(
      "missing_stripe_secret_key",
      "Stripe secret key is not configured.",
      500
    )
  }

  const mode = getCommerceStripeMode()
  if (mode === "test" && secretKey.startsWith("sk_live_")) {
    throw new CommerceError(
      "stripe_mode_key_mismatch",
      "Live Stripe secret key cannot be used while commerce mode is test.",
      500
    )
  }

  if (mode === "live" && secretKey.startsWith("sk_test_")) {
    throw new CommerceError(
      "stripe_mode_key_mismatch",
      "Test Stripe secret key cannot be used while commerce mode is live.",
      500
    )
  }

  return secretKey
}

export function getStripeClient() {
  if (stripeClient) return stripeClient

  stripeClient = new Stripe(getStripeSecretKey(), {
    appInfo: {
      name: "Jayant Tools",
      version: "1.0.0",
    },
    typescript: true,
  })

  return stripeClient
}

export function getStripeWebhookSecret() {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!webhookSecret) {
    throw new CommerceError(
      "missing_stripe_webhook_secret",
      "Stripe webhook secret is not configured.",
      500
    )
  }

  return webhookSecret
}

export function assertStripeEventMode(livemode: boolean) {
  const mode = getCommerceStripeMode()

  if (mode === "test" && livemode) {
    throw new CommerceError(
      "stripe_webhook_mode_mismatch",
      "Live Stripe webhook event cannot be processed while commerce mode is test.",
      400
    )
  }

  if (mode === "live" && !livemode) {
    throw new CommerceError(
      "stripe_webhook_mode_mismatch",
      "Test Stripe webhook event cannot be processed while commerce mode is live.",
      400
    )
  }
}
