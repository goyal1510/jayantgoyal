import { NextResponse } from "next/server"

import { commerceErrorResponse } from "@/lib/commerce/api.server"
import { listPublishedCommerceProducts } from "@/lib/commerce/database.server"

export async function GET() {
  try {
    const products = await listPublishedCommerceProducts()

    return NextResponse.json({ products })
  } catch (error) {
    return commerceErrorResponse(error)
  }
}
