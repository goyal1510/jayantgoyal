import { NextResponse } from "next/server";
import {
  authorizeCommerceAdmin,
  commerceMutationError,
  type CommerceAdminClient,
  normalizeCommerceProductPayload,
} from "../helpers";

async function loadProductWithPrices(client: CommerceAdminClient, productId: string) {
  const { data: product, error: productError } = await client
    .from("commerce_products")
    .select("*")
    .eq("id", productId)
    .single();

  if (productError) throw new Error(productError.message);

  const { data: prices, error: priceError } = await client
    .from("commerce_prices")
    .select("*")
    .eq("product_id", productId)
    .order("created_at", { ascending: true });

  if (priceError) throw new Error(priceError.message);

  return { ...product, prices: prices ?? [] };
}

export async function POST(request: Request) {
  try {
    const auth = await authorizeCommerceAdmin();
    if ("error" in auth) return auth.error;

    const payload = normalizeCommerceProductPayload(await request.json(), auth.user.id);

    const { data: product, error: productError } = await auth.client
      .from("commerce_products")
      .insert(payload.product)
      .select("*")
      .single();

    if (productError) {
      return NextResponse.json(
        { error: commerceMutationError(productError) },
        { status: 400 }
      );
    }

    const { error: priceError } = await auth.client.from("commerce_prices").insert(
      payload.prices.map((price) => {
        const { id: priceId, ...pricePayload } = price;
        void priceId;
        return {
          ...pricePayload,
          product_id: product.id,
        };
      })
    );

    if (priceError) {
      return NextResponse.json(
        { error: commerceMutationError(priceError) },
        { status: 400 }
      );
    }

    return NextResponse.json({
      data: await loadProductWithPrices(auth.client, product.id),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
