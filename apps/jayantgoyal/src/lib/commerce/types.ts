export type CommerceStripeMode = "test" | "live"
export type CommercePaymentProvider = "razorpay" | "stripe"

export type CommerceProductType = "digital" | "subscription" | "service" | "bundle"
export type CommerceProductStatus = "draft" | "published" | "archived"
export type CommercePriceType = "one_time" | "recurring"
export type CommerceBillingInterval = "day" | "week" | "month" | "year"
export type CommerceEntitlementStatus = "active" | "revoked" | "expired"

export type CommerceJson = Record<string, unknown>

export interface CommerceProduct {
  id: string
  slug: string
  name: string
  short_description: string | null
  description: string | null
  product_type: CommerceProductType
  status: CommerceProductStatus
  payment_provider: CommercePaymentProvider | null
  stripe_product_id: string | null
  image_url: string | null
  is_featured: boolean
  sort_order: number
  metadata: CommerceJson
  published_at: string | null
  created_at: string
  updated_at: string
}

export interface CommercePrice {
  id: string
  product_id: string
  payment_provider: CommercePaymentProvider
  provider_price_id: string | null
  stripe_price_id: string | null
  lookup_key: string | null
  nickname: string | null
  price_type: CommercePriceType
  currency: string
  unit_amount: number
  billing_interval: CommerceBillingInterval | null
  trial_period_days: number | null
  is_active: boolean
  metadata: CommerceJson
  created_at: string
  updated_at: string
}

export interface CommerceProductWithPrices extends CommerceProduct {
  prices: CommercePrice[]
}

export interface CommerceCustomer {
  id: string
  user_id: string
  stripe_customer_id: string
  email: string | null
  metadata: CommerceJson
  created_at: string
  updated_at: string
}

export interface CommerceOrder {
  id: string
  user_id: string
  customer_id: string | null
  product_id: string | null
  price_id: string | null
  payment_provider: CommercePaymentProvider
  provider_order_id: string | null
  provider_payment_id: string | null
  stripe_checkout_session_id: string | null
  stripe_payment_intent_id: string | null
  status: "pending" | "paid" | "failed" | "refunded" | "canceled" | "expired"
  currency: string
  amount_subtotal: number
  amount_total: number
  metadata: CommerceJson
  completed_at: string | null
  created_at: string
  updated_at: string
}

export interface CommerceSubscription {
  id: string
  user_id: string
  customer_id: string | null
  product_id: string | null
  price_id: string | null
  stripe_subscription_id: string
  stripe_customer_id: string | null
  status:
    | "incomplete"
    | "incomplete_expired"
    | "trialing"
    | "active"
    | "past_due"
    | "canceled"
    | "unpaid"
    | "paused"
  current_period_start: string | null
  current_period_end: string | null
  cancel_at_period_end: boolean
  canceled_at: string | null
  metadata: CommerceJson
  created_at: string
  updated_at: string
}

export interface CommerceEntitlement {
  id: string
  user_id: string
  product_id: string | null
  price_id: string | null
  order_id: string | null
  subscription_id: string | null
  source_type: "order" | "subscription" | "manual"
  feature_key: string
  status: CommerceEntitlementStatus
  value: CommerceJson
  starts_at: string
  expires_at: string | null
  metadata: CommerceJson
  created_at: string
  updated_at: string
}

export interface CommerceDelivery {
  id: string
  user_id: string
  order_id: string | null
  product_id: string
  delivery_type: "download" | "link" | "manual" | "service"
  storage_bucket: string | null
  storage_path: string | null
  external_url: string | null
  status: "pending" | "available" | "fulfilled" | "revoked"
  download_count: number
  expires_at: string | null
  metadata: CommerceJson
  created_at: string
  updated_at: string
}

export interface CommercePurchase extends CommerceOrder {
  product: CommerceProduct | null
  price: CommercePrice | null
  deliveries: CommerceDelivery[]
}

export interface CommerceSubscriptionWithDetails extends CommerceSubscription {
  product: CommerceProduct | null
  price: CommercePrice | null
}

export class CommerceError extends Error {
  code: string
  status: number

  constructor(code: string, message: string, status = 500) {
    super(message)
    this.name = "CommerceError"
    this.code = code
    this.status = status
  }
}
