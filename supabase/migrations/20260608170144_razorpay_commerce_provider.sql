-- Add provider-agnostic payment fields for Razorpay while keeping the earlier
-- Stripe columns intact as optional fallback state.

ALTER TABLE jg_app.commerce_products
  ADD COLUMN IF NOT EXISTS payment_provider text;

ALTER TABLE jg_app.commerce_prices
  ADD COLUMN IF NOT EXISTS payment_provider text NOT NULL DEFAULT 'razorpay',
  ADD COLUMN IF NOT EXISTS provider_price_id text;

ALTER TABLE jg_app.commerce_orders
  ADD COLUMN IF NOT EXISTS payment_provider text NOT NULL DEFAULT 'razorpay',
  ADD COLUMN IF NOT EXISTS provider_order_id text,
  ADD COLUMN IF NOT EXISTS provider_payment_id text;

ALTER TABLE jg_app.commerce_webhook_events
  ADD COLUMN IF NOT EXISTS provider text NOT NULL DEFAULT 'stripe',
  ADD COLUMN IF NOT EXISTS provider_event_id text;

UPDATE jg_app.commerce_webhook_events
SET provider_event_id = stripe_event_id
WHERE provider_event_id IS NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'commerce_products_payment_provider_check'
      AND conrelid = 'jg_app.commerce_products'::regclass
  ) THEN
    ALTER TABLE jg_app.commerce_products
      ADD CONSTRAINT commerce_products_payment_provider_check
      CHECK (payment_provider IS NULL OR payment_provider IN ('razorpay', 'stripe'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'commerce_prices_payment_provider_check'
      AND conrelid = 'jg_app.commerce_prices'::regclass
  ) THEN
    ALTER TABLE jg_app.commerce_prices
      ADD CONSTRAINT commerce_prices_payment_provider_check
      CHECK (payment_provider IN ('razorpay', 'stripe'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'commerce_orders_payment_provider_check'
      AND conrelid = 'jg_app.commerce_orders'::regclass
  ) THEN
    ALTER TABLE jg_app.commerce_orders
      ADD CONSTRAINT commerce_orders_payment_provider_check
      CHECK (payment_provider IN ('razorpay', 'stripe'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'commerce_webhook_events_provider_check'
      AND conrelid = 'jg_app.commerce_webhook_events'::regclass
  ) THEN
    ALTER TABLE jg_app.commerce_webhook_events
      ADD CONSTRAINT commerce_webhook_events_provider_check
      CHECK (provider IN ('razorpay', 'stripe'));
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_commerce_prices_provider_price
  ON jg_app.commerce_prices (payment_provider, provider_price_id)
  WHERE provider_price_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_commerce_orders_provider_order
  ON jg_app.commerce_orders (payment_provider, provider_order_id)
  WHERE provider_order_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_commerce_orders_provider_payment
  ON jg_app.commerce_orders (payment_provider, provider_payment_id)
  WHERE provider_payment_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_commerce_webhook_events_provider_event
  ON jg_app.commerce_webhook_events (provider, provider_event_id)
  WHERE provider_event_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_commerce_orders_provider_status
  ON jg_app.commerce_orders (payment_provider, status, created_at DESC);
