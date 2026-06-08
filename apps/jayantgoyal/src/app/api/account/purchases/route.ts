import { NextResponse } from "next/server"

import {
  commerceErrorResponse,
  getAuthenticatedCommerceUser,
} from "@/lib/commerce/api.server"
import { listPaidPurchasesWithDetailsForUser } from "@/lib/commerce/database.server"

export async function GET() {
  try {
    const user = await getAuthenticatedCommerceUser()
    const purchases = await listPaidPurchasesWithDetailsForUser(user.id)

    return NextResponse.json({ purchases })
  } catch (error) {
    return commerceErrorResponse(error)
  }
}
