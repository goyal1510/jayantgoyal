import type {
  CommerceBillingInterval,
  CommercePaymentProvider,
  CommercePriceType,
  CommerceProduct,
  CommerceProductWithPrices,
} from "@/lib/types";

export interface CommercePricePayload {
  id?: string | null;
  payment_provider: CommercePaymentProvider;
  provider_price_id: string | null;
  stripe_price_id: string | null;
  lookup_key: string | null;
  nickname: string | null;
  price_type: CommercePriceType;
  currency: string;
  unit_amount: number;
  billing_interval: CommerceBillingInterval | null;
  trial_period_days: number | null;
  is_active: boolean;
}

export interface CommerceProductPayload {
  product: Pick<
    CommerceProduct,
    | "slug"
    | "name"
    | "short_description"
    | "description"
    | "product_type"
    | "status"
    | "payment_provider"
    | "stripe_product_id"
    | "image_url"
    | "is_featured"
    | "sort_order"
    | "metadata"
  >;
  prices: CommercePricePayload[];
}

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

export async function createCommerceProduct(
  payload: CommerceProductPayload
): Promise<ApiResponse<CommerceProductWithPrices>> {
  const response = await fetch("/api/commerce/products", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return response.json();
}

export async function updateCommerceProduct(
  id: string,
  payload: CommerceProductPayload
): Promise<ApiResponse<CommerceProductWithPrices>> {
  const response = await fetch(`/api/commerce/products/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return response.json();
}
