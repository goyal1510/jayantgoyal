import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import type {
  CommerceBillingInterval,
  CommerceDeliveryStatus,
  CommerceDeliveryType,
  CommerceOrderStatus,
  CommercePaymentProvider,
  CommercePriceType,
  CommerceProductStatus,
  CommerceProductType,
} from "@/lib/types";

export type CommerceAdminClient = ReturnType<
  ReturnType<typeof createSupabaseAdminClient>["schema"]
>;

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const PRODUCT_TYPES: CommerceProductType[] = ["digital", "subscription", "service", "bundle"];
const PRODUCT_STATUSES: CommerceProductStatus[] = ["draft", "published", "archived"];
const PAYMENT_PROVIDERS: CommercePaymentProvider[] = ["razorpay", "stripe"];
const PRICE_TYPES: CommercePriceType[] = ["one_time", "recurring"];
const BILLING_INTERVALS: CommerceBillingInterval[] = ["day", "week", "month", "year"];
const DELIVERY_TYPES: CommerceDeliveryType[] = ["download", "link", "manual", "service"];
const DELIVERY_STATUSES: CommerceDeliveryStatus[] = ["pending", "available", "fulfilled", "revoked"];
const MANUAL_ORDER_STATUSES: CommerceOrderStatus[] = [
  "pending",
  "paid",
  "failed",
  "refunded",
  "canceled",
  "expired",
];

export async function authorizeCommerceAdmin() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const { data: profile } = await supabase
    .schema("jg_account")
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (!profile || !["admin", "super_admin"].includes(profile.role)) {
    return {
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return {
    user,
    client: createSupabaseAdminClient().schema("jg_app") as CommerceAdminClient,
  };
}

function nullableText(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function nullableIsoDate(value: unknown) {
  const text = nullableText(value);
  if (!text) return null;
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) {
    throw new Error("Date value is invalid.");
  }
  return date.toISOString();
}

function validHttpUrl(value: string) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

function requiredText(value: unknown, field: string) {
  const trimmed = nullableText(value);
  if (!trimmed) throw new Error(`${field} is required.`);
  return trimmed;
}

function enumValue<T extends string>(value: unknown, allowed: T[], fallback: T) {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

function strictEnumValue<T extends string>(value: unknown, allowed: T[], field: string) {
  if (allowed.includes(value as T)) return value as T;
  throw new Error(`${field} is invalid.`);
}

function integerValue(value: unknown, fallback: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.trunc(parsed);
}

function safeMetadataText(value: unknown, maxLength: number) {
  if (typeof value !== "string") return null;
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized ? normalized.slice(0, maxLength) : null;
}

function normalizeProductMetadata(value: unknown) {
  const metadata = value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};

  return {
    delivery_plan: safeMetadataText(metadata.delivery_plan, 600),
    launch_note: safeMetadataText(metadata.launch_note, 600),
  };
}

export function normalizeCommerceProductPayload(body: unknown, userId: string) {
  const payload = body as {
    product?: Record<string, unknown>;
    prices?: Array<Record<string, unknown>>;
  };

  const productInput = payload.product ?? {};
  const slug = requiredText(productInput.slug, "Slug").toLowerCase();
  if (!SLUG_PATTERN.test(slug)) {
    throw new Error("Slug must use lowercase letters, numbers, and hyphens.");
  }

  const status = enumValue(
    productInput.status,
    PRODUCT_STATUSES,
    "draft" satisfies CommerceProductStatus
  );
  const paymentProvider = enumValue(
    productInput.payment_provider,
    PAYMENT_PROVIDERS,
    "razorpay" satisfies CommercePaymentProvider
  );

  const product = {
    slug,
    name: requiredText(productInput.name, "Name"),
    short_description: nullableText(productInput.short_description),
    description: nullableText(productInput.description),
    product_type: enumValue(
      productInput.product_type,
      PRODUCT_TYPES,
      "digital" satisfies CommerceProductType
    ),
    status,
    payment_provider: paymentProvider,
    stripe_product_id: nullableText(productInput.stripe_product_id),
    image_url: nullableText(productInput.image_url),
    is_featured: Boolean(productInput.is_featured),
    sort_order: integerValue(productInput.sort_order, 0),
    metadata: normalizeProductMetadata(productInput.metadata),
    created_by: userId,
    published_at: status === "published" ? new Date().toISOString() : null,
  };

  const prices = (payload.prices ?? []).map((priceInput) => {
    const priceType = enumValue(
      priceInput.price_type,
      PRICE_TYPES,
      "one_time" satisfies CommercePriceType
    );
    const currency = requiredText(priceInput.currency, "Currency").toLowerCase();
    if (currency.length !== 3) {
      throw new Error("Currency must be a three-letter ISO code.");
    }

    const unitAmount = integerValue(priceInput.unit_amount, -1);
    if (unitAmount < 0) {
      throw new Error("Price amount must be zero or greater.");
    }

    const billingInterval =
      priceType === "recurring"
        ? enumValue(
            priceInput.billing_interval,
            BILLING_INTERVALS,
            "month" satisfies CommerceBillingInterval
          )
        : null;

    return {
      id: nullableText(priceInput.id),
      payment_provider: enumValue(priceInput.payment_provider, PAYMENT_PROVIDERS, paymentProvider),
      provider_price_id: nullableText(priceInput.provider_price_id),
      stripe_price_id: nullableText(priceInput.stripe_price_id),
      lookup_key: nullableText(priceInput.lookup_key),
      nickname: nullableText(priceInput.nickname),
      price_type: priceType,
      currency,
      unit_amount: unitAmount,
      billing_interval: billingInterval,
      trial_period_days:
        priceInput.trial_period_days === null || priceInput.trial_period_days === ""
          ? null
          : Math.max(integerValue(priceInput.trial_period_days, 0), 0),
      is_active: Boolean(priceInput.is_active),
      metadata: {},
    };
  });

  if (prices.length === 0) {
    throw new Error("Add at least one price.");
  }

  return { product, prices };
}

export function normalizeCommerceDeliveryPayload(body: unknown) {
  const payload = body as Record<string, unknown>;
  const deliveryType = strictEnumValue(
    payload.delivery_type,
    DELIVERY_TYPES,
    "Delivery type"
  );
  const status = strictEnumValue(
    payload.status,
    DELIVERY_STATUSES,
    "Delivery status"
  );
  const externalUrl = nullableText(payload.external_url);
  if (externalUrl && !validHttpUrl(externalUrl)) {
    throw new Error("External URL must start with http:// or https://.");
  }

  return {
    delivery_type: deliveryType,
    storage_bucket: nullableText(payload.storage_bucket),
    storage_path: nullableText(payload.storage_path),
    external_url: externalUrl,
    status,
    expires_at: nullableIsoDate(payload.expires_at),
    metadata: {
      label: nullableText(payload.label),
      admin_note: nullableText(payload.admin_note),
    },
  };
}

export function normalizeCommerceOrderStatusPayload(body: unknown) {
  const payload = body as Record<string, unknown>;
  const status = strictEnumValue(
    payload.status,
    MANUAL_ORDER_STATUSES,
    "Order status"
  );
  const reason = nullableText(payload.reason);
  if (!reason) {
    throw new Error("Reason is required.");
  }

  return { status, reason: reason.slice(0, 500) };
}

function sanitizeEventMetadata(metadata: Record<string, unknown>) {
  const safe: Record<string, string | number | boolean | null> = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (!/^[a-zA-Z0-9_:-]{1,64}$/.test(key)) continue;
    if (value === null || typeof value === "boolean" || typeof value === "number") {
      safe[key] = value;
    } else if (typeof value === "string") {
      safe[key] = value.slice(0, 160);
    }
  }
  return safe;
}

export async function recordCommerceAdminEvent({
  client,
  eventType,
  adminUserId,
  order,
  metadata = {},
}: {
  client: CommerceAdminClient;
  eventType: string;
  adminUserId: string;
  order: {
    id: string;
    user_id: string;
    product_id: string | null;
    price_id: string | null;
    payment_provider: CommercePaymentProvider | null;
  };
  metadata?: Record<string, unknown>;
}) {
  const { error } = await client.from("commerce_events").insert({
    event_type: eventType,
    user_id: order.user_id,
    product_id: order.product_id,
    price_id: order.price_id,
    order_id: order.id,
    payment_provider: order.payment_provider,
    source: "admin",
    metadata: sanitizeEventMetadata({
      ...metadata,
      admin_user_id: adminUserId,
    }),
  });

  if (error) throw new Error(error.message);
}

export function commerceAdminErrorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "Internal server error";
  const isValidationError =
    message.endsWith(" is invalid.") ||
    message.endsWith(" is required.") ||
    message.includes("must start with") ||
    message.includes("Date value is invalid");

  return NextResponse.json(
    { error: isValidationError ? message : "Internal server error" },
    { status: isValidationError ? 400 : 500 }
  );
}

export function commerceMutationError(error: { message?: string; code?: string }) {
  const message = error.message ?? "Unable to save commerce data.";
  if (message.includes("commerce_products_slug_key")) {
    return "A product with this slug already exists.";
  }
  if (message.includes("commerce_prices_lookup_key_key")) {
    return "A price with this lookup key already exists.";
  }
  if (message.includes("idx_commerce_prices_provider_price")) {
    return "A price with this provider price id already exists.";
  }
  if (message.includes("commerce_prices_stripe_price_id_key")) {
    return "A price with this Stripe price id already exists.";
  }
  return message;
}
