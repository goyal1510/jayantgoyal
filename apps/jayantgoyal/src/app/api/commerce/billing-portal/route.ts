import { NextResponse } from "next/server"

import {
  commerceErrorResponse,
  getAuthenticatedCommerceUser,
  getCommercePaymentProvider,
  getCommerceSiteUrl,
} from "@/lib/commerce/api.server"
import { getCommerceCustomerByUserId } from "@/lib/commerce/database.server"
import { CommerceError } from "@/lib/commerce/types"
import { getStripeClient } from "@/lib/commerce/stripe.server"

export async function POST() {
  try {
    const user = await getAuthenticatedCommerceUser()
    const paymentProvider = getCommercePaymentProvider()

    if (paymentProvider === "razorpay") {
      throw new CommerceError(
        "billing_portal_not_supported",
        "Razorpay billing portal is not configured yet.",
        409
      )
    }

    const customer = await getCommerceCustomerByUserId(user.id)

    if (!customer) {
      throw new CommerceError(
        "commerce_customer_not_found",
        "No billing customer exists for this account yet.",
        404
      )
    }

    const session = await getStripeClient().billingPortal.sessions.create({
      customer: customer.stripe_customer_id,
      return_url: `${getCommerceSiteUrl()}/account/billing`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    return commerceErrorResponse(error)
  }
}
