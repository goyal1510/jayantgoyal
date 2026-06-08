import crypto from "node:crypto"

import Razorpay from "razorpay"

import { CommerceError } from "@/lib/commerce/types"

type RazorpayOrderResponse = {
  id: string
  amount: number | string
  currency: string
  receipt?: string
  status?: string
}

let razorpayClient: Razorpay | null = null

function requireEnv(name: string) {
  const value = process.env[name]

  if (!value) {
    throw new CommerceError(
      `missing_${name.toLowerCase()}`,
      `${name} is not configured.`,
      500
    )
  }

  return value
}

export function getRazorpayKeyId() {
  return process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || requireEnv("RAZORPAY_KEY_ID")
}

function getRazorpayKeySecret() {
  return requireEnv("RAZORPAY_KEY_SECRET")
}

export function getRazorpayWebhookSecret() {
  return requireEnv("RAZORPAY_WEBHOOK_SECRET")
}

export function getRazorpayClient() {
  if (razorpayClient) return razorpayClient

  razorpayClient = new Razorpay({
    key_id: requireEnv("RAZORPAY_KEY_ID"),
    key_secret: getRazorpayKeySecret(),
  })

  return razorpayClient
}

function timingSafeEqualHex(left: string, right: string) {
  const leftBuffer = Buffer.from(left, "hex")
  const rightBuffer = Buffer.from(right, "hex")

  return (
    leftBuffer.length === rightBuffer.length &&
    crypto.timingSafeEqual(leftBuffer, rightBuffer)
  )
}

export function verifyRazorpayPaymentSignature({
  razorpayOrderId,
  razorpayPaymentId,
  razorpaySignature,
}: {
  razorpayOrderId: string
  razorpayPaymentId: string
  razorpaySignature: string
}) {
  const expectedSignature = crypto
    .createHmac("sha256", getRazorpayKeySecret())
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest("hex")

  if (!timingSafeEqualHex(expectedSignature, razorpaySignature)) {
    throw new CommerceError(
      "invalid_razorpay_signature",
      "Razorpay payment signature verification failed.",
      400
    )
  }
}

export function verifyRazorpayWebhookSignature({
  body,
  signature,
}: {
  body: string
  signature: string
}) {
  const expectedSignature = crypto
    .createHmac("sha256", getRazorpayWebhookSecret())
    .update(body)
    .digest("hex")

  if (!timingSafeEqualHex(expectedSignature, signature)) {
    throw new CommerceError(
      "invalid_razorpay_webhook_signature",
      "Razorpay webhook signature verification failed.",
      400
    )
  }
}

export async function createRazorpayOrder({
  orderId,
  userId,
  productName,
  amount,
  currency,
}: {
  orderId: string
  userId: string
  productName: string
  amount: number
  currency: string
}) {
  return (await getRazorpayClient().orders.create({
    amount,
    currency: currency.toUpperCase(),
    receipt: orderId.slice(0, 40),
    notes: {
      app_order_id: orderId,
      app_user_id: userId,
      product_name: productName.slice(0, 256),
    },
  })) as RazorpayOrderResponse
}
