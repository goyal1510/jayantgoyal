import { NextResponse } from "next/server";
import {
  authorizeCommerceAdmin,
  commerceMutationError,
  type CommerceAdminClient,
  normalizeCommerceProductPayload,
} from "../../helpers";

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

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authorizeCommerceAdmin();
    if ("error" in auth) return auth.error;

    const { id } = await params;
    const payload = normalizeCommerceProductPayload(await request.json(), auth.user.id);
    const { created_by: createdBy, ...productUpdate } = payload.product;
    void createdBy;

    const { error: productError } = await auth.client
      .from("commerce_products")
      .update(productUpdate)
      .eq("id", id);

    if (productError) {
      return NextResponse.json(
        { error: commerceMutationError(productError) },
        { status: 400 }
      );
    }

    for (const price of payload.prices) {
      const { id: priceId, ...pricePayload } = price;
      if (priceId) {
        const { error } = await auth.client
          .from("commerce_prices")
          .update(pricePayload)
          .eq("id", priceId)
          .eq("product_id", id);

        if (error) {
          return NextResponse.json(
            { error: commerceMutationError(error) },
            { status: 400 }
          );
        }
      } else {
        const { error } = await auth.client
          .from("commerce_prices")
          .insert({ ...pricePayload, product_id: id });

        if (error) {
          return NextResponse.json(
            { error: commerceMutationError(error) },
            { status: 400 }
          );
        }
      }
    }

    return NextResponse.json({
      data: await loadProductWithPrices(auth.client, id),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
