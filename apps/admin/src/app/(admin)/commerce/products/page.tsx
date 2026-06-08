import { createSupabaseAdminClient } from "@/lib/supabase/server";
import type { CommercePrice, CommerceProduct, CommerceProductWithPrices } from "@/lib/types";
import { CommerceProductsClient } from "./products-client";

async function getProducts(): Promise<CommerceProductWithPrices[]> {
  const supabase = createSupabaseAdminClient().schema("jg_app");

  const { data: products } = await supabase
    .from("commerce_products")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (!products?.length) return [];

  const productIds = products.map((product: CommerceProduct) => product.id);
  const { data: prices } = await supabase
    .from("commerce_prices")
    .select("*")
    .in("product_id", productIds)
    .order("created_at", { ascending: true });

  const pricesByProductId = new Map<string, CommercePrice[]>();
  for (const price of (prices ?? []) as CommercePrice[]) {
    pricesByProductId.set(price.product_id, [
      ...(pricesByProductId.get(price.product_id) ?? []),
      price,
    ]);
  }

  return (products as CommerceProduct[]).map((product) => ({
    ...product,
    prices: pricesByProductId.get(product.id) ?? [],
  }));
}

export default async function CommerceProductsPage() {
  const products = await getProducts();

  return <CommerceProductsClient initialData={products} />;
}
