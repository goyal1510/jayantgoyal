import { NextResponse } from "next/server"

import {
  commerceErrorResponse,
  getAuthenticatedCommerceUser,
} from "@/lib/commerce/api.server"
import {
  getAvailableDeliveryForPaidPurchase,
  markCommerceDeliveryAccessed,
} from "@/lib/commerce/database.server"
import { CommerceError } from "@/lib/commerce/types"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"

function validHttpUrl(value: string) {
  try {
    const parsed = new URL(value)
    return parsed.protocol === "https:" || parsed.protocol === "http:"
  } catch {
    return false
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orderId: string; deliveryId: string }> }
) {
  try {
    const user = await getAuthenticatedCommerceUser()
    const { orderId, deliveryId } = await params
    const delivery = await getAvailableDeliveryForPaidPurchase({
      orderId,
      deliveryId,
      userId: user.id,
    })

    if (!delivery) {
      throw new CommerceError("delivery_not_found", "Delivery was not found.", 404)
    }

    if (delivery.status === "revoked") {
      throw new CommerceError("delivery_revoked", "This delivery is no longer available.", 410)
    }

    if (delivery.status === "pending") {
      throw new CommerceError("delivery_pending", "This delivery is not ready yet.", 409)
    }

    if (delivery.expires_at && new Date(delivery.expires_at).getTime() <= Date.now()) {
      throw new CommerceError("delivery_expired", "This delivery link has expired.", 410)
    }

    let redirectUrl: string | null = null
    if (delivery.external_url) {
      if (!validHttpUrl(delivery.external_url)) {
        throw new CommerceError("delivery_url_invalid", "Delivery URL is invalid.", 500)
      }
      redirectUrl = delivery.external_url
    } else if (delivery.storage_bucket && delivery.storage_path) {
      const { data, error } = await createSupabaseAdminClient()
        .storage
        .from(delivery.storage_bucket)
        .createSignedUrl(delivery.storage_path, 60 * 10)

      if (error || !data?.signedUrl) {
        throw new CommerceError(
          "delivery_signed_url_failed",
          "Unable to create delivery download link.",
          500
        )
      }
      redirectUrl = data.signedUrl
    }

    if (!redirectUrl) {
      throw new CommerceError(
        "delivery_not_downloadable",
        "This delivery does not have a downloadable link yet.",
        409
      )
    }

    await markCommerceDeliveryAccessed(delivery.id, delivery.download_count + 1)

    return NextResponse.redirect(redirectUrl)
  } catch (error) {
    return commerceErrorResponse(error)
  }
}
