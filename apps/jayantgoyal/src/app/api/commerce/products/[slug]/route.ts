import { NextResponse, type NextRequest } from "next/server"

import { commerceErrorResponse } from "@/lib/commerce/api.server"
import { getPublishedCommerceProductBySlug } from "@/lib/commerce/database.server"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const product = await getPublishedCommerceProductBySlug(slug)

    if (!product) {
      return NextResponse.json(
        { error: "Product not found", code: "commerce_product_not_found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ product })
  } catch (error) {
    return commerceErrorResponse(error)
  }
}
