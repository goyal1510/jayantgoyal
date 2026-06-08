import { NextResponse } from "next/server"

import {
  commerceErrorResponse,
  getAuthenticatedCommerceUser,
} from "@/lib/commerce/api.server"
import { getWorkspaceAccessForUser } from "@/lib/commerce/entitlements.server"

export async function GET() {
  try {
    const user = await getAuthenticatedCommerceUser()
    const access = await getWorkspaceAccessForUser(user.id)

    return NextResponse.json({
      plan: access.plan,
      isPro: access.isPro,
      limits: access.limits,
      entitlements: access.entitlements,
      featureKeys: access.featureKeys,
    })
  } catch (error) {
    return commerceErrorResponse(error)
  }
}
