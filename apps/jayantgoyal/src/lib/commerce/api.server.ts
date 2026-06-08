import { NextResponse } from "next/server"

import { CommerceError, type CommercePaymentProvider } from "@/lib/commerce/types"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export async function getAuthenticatedCommerceUser() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    throw new CommerceError("unauthorized", "Unauthorized", 401)
  }

  return user
}

export function commerceErrorResponse(error: unknown) {
  if (error instanceof CommerceError) {
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: error.status }
    )
  }

  console.error("Unhandled commerce API error:", error)

  return NextResponse.json(
    { error: "Internal server error", code: "internal_server_error" },
    { status: 500 }
  )
}

export function getCommerceSiteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "")
}

export function normalizeCommercePath(path: unknown, fallback: string) {
  if (typeof path !== "string" || !path.startsWith("/") || path.startsWith("//")) {
    return fallback
  }

  return path
}

export function getCommercePaymentProvider(): CommercePaymentProvider {
  const provider = process.env.COMMERCE_PAYMENT_PROVIDER ?? "razorpay"

  if (provider !== "razorpay" && provider !== "stripe") {
    throw new CommerceError(
      "invalid_payment_provider",
      "COMMERCE_PAYMENT_PROVIDER must be razorpay or stripe.",
      500
    )
  }

  return provider
}
