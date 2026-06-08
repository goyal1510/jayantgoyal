-- Commerce foundation for paid products, Stripe checkout/webhooks,
-- subscription mirroring, entitlements, and digital delivery.
-- This migration is additive only.

CREATE TABLE IF NOT EXISTS jg_app.commerce_products (
  id uuid DEFAULT jg_app.uuid_v7() NOT NULL,
  slug text NOT NULL,
  name text NOT NULL,
  short_description text,
  description text,
  product_type text DEFAULT 'digital'::text NOT NULL,
  status text DEFAULT 'draft'::text NOT NULL,
  stripe_product_id text,
  image_url text,
  is_featured boolean DEFAULT false NOT NULL,
  sort_order integer DEFAULT 0 NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
  created_by uuid,
  published_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT commerce_products_product_type_check CHECK (
    product_type = ANY (ARRAY['digital', 'subscription', 'service', 'bundle']::text[])
  ),
  CONSTRAINT commerce_products_status_check CHECK (
    status = ANY (ARRAY['draft', 'published', 'archived']::text[])
  ),
  CONSTRAINT commerce_products_slug_check CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

CREATE TABLE IF NOT EXISTS jg_app.commerce_prices (
  id uuid DEFAULT jg_app.uuid_v7() NOT NULL,
  product_id uuid NOT NULL,
  stripe_price_id text,
  lookup_key text,
  nickname text,
  price_type text DEFAULT 'one_time'::text NOT NULL,
  currency text DEFAULT 'usd'::text NOT NULL,
  unit_amount integer NOT NULL,
  billing_interval text,
  trial_period_days integer,
  is_active boolean DEFAULT true NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT commerce_prices_price_type_check CHECK (
    price_type = ANY (ARRAY['one_time', 'recurring']::text[])
  ),
  CONSTRAINT commerce_prices_currency_check CHECK (
    char_length(currency) = 3 AND currency = lower(currency)
  ),
  CONSTRAINT commerce_prices_unit_amount_check CHECK (unit_amount >= 0),
  CONSTRAINT commerce_prices_trial_days_check CHECK (
    trial_period_days IS NULL OR trial_period_days >= 0
  ),
  CONSTRAINT commerce_prices_billing_interval_check CHECK (
    billing_interval IS NULL
    OR billing_interval = ANY (ARRAY['day', 'week', 'month', 'year']::text[])
  ),
  CONSTRAINT commerce_prices_recurring_interval_check CHECK (
    (price_type = 'recurring' AND billing_interval IS NOT NULL)
    OR (price_type = 'one_time' AND billing_interval IS NULL)
  )
);

CREATE TABLE IF NOT EXISTS jg_app.commerce_customers (
  id uuid DEFAULT jg_app.uuid_v7() NOT NULL,
  user_id uuid NOT NULL,
  stripe_customer_id text NOT NULL,
  email text,
  metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS jg_app.commerce_orders (
  id uuid DEFAULT jg_app.uuid_v7() NOT NULL,
  user_id uuid NOT NULL,
  customer_id uuid,
  product_id uuid,
  price_id uuid,
  stripe_checkout_session_id text,
  stripe_payment_intent_id text,
  status text DEFAULT 'pending'::text NOT NULL,
  currency text DEFAULT 'usd'::text NOT NULL,
  amount_subtotal integer DEFAULT 0 NOT NULL,
  amount_total integer DEFAULT 0 NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
  completed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT commerce_orders_status_check CHECK (
    status = ANY (ARRAY['pending', 'paid', 'failed', 'refunded', 'canceled', 'expired']::text[])
  ),
  CONSTRAINT commerce_orders_currency_check CHECK (
    char_length(currency) = 3 AND currency = lower(currency)
  ),
  CONSTRAINT commerce_orders_amounts_check CHECK (
    amount_subtotal >= 0 AND amount_total >= 0
  )
);

CREATE TABLE IF NOT EXISTS jg_app.commerce_subscriptions (
  id uuid DEFAULT jg_app.uuid_v7() NOT NULL,
  user_id uuid NOT NULL,
  customer_id uuid,
  product_id uuid,
  price_id uuid,
  stripe_subscription_id text NOT NULL,
  stripe_customer_id text,
  status text NOT NULL,
  current_period_start timestamp with time zone,
  current_period_end timestamp with time zone,
  cancel_at_period_end boolean DEFAULT false NOT NULL,
  canceled_at timestamp with time zone,
  metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT commerce_subscriptions_status_check CHECK (
    status = ANY (
      ARRAY[
        'incomplete',
        'incomplete_expired',
        'trialing',
        'active',
        'past_due',
        'canceled',
        'unpaid',
        'paused'
      ]::text[]
    )
  )
);

CREATE TABLE IF NOT EXISTS jg_app.commerce_entitlements (
  id uuid DEFAULT jg_app.uuid_v7() NOT NULL,
  user_id uuid NOT NULL,
  product_id uuid,
  price_id uuid,
  order_id uuid,
  subscription_id uuid,
  source_type text NOT NULL,
  feature_key text NOT NULL,
  status text DEFAULT 'active'::text NOT NULL,
  value jsonb DEFAULT '{}'::jsonb NOT NULL,
  starts_at timestamp with time zone DEFAULT now() NOT NULL,
  expires_at timestamp with time zone,
  created_by uuid,
  audit_reason text,
  metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT commerce_entitlements_source_type_check CHECK (
    source_type = ANY (ARRAY['order', 'subscription', 'manual']::text[])
  ),
  CONSTRAINT commerce_entitlements_status_check CHECK (
    status = ANY (ARRAY['active', 'revoked', 'expired']::text[])
  ),
  CONSTRAINT commerce_entitlements_source_check CHECK (
    (source_type = 'order' AND order_id IS NOT NULL)
    OR (source_type = 'subscription' AND subscription_id IS NOT NULL)
    OR source_type = 'manual'
  )
);

CREATE TABLE IF NOT EXISTS jg_app.commerce_webhook_events (
  id uuid DEFAULT jg_app.uuid_v7() NOT NULL,
  stripe_event_id text NOT NULL,
  event_type text NOT NULL,
  api_version text,
  object_id text,
  livemode boolean DEFAULT false NOT NULL,
  status text DEFAULT 'received'::text NOT NULL,
  attempt_count integer DEFAULT 0 NOT NULL,
  payload_summary jsonb DEFAULT '{}'::jsonb NOT NULL,
  last_error text,
  processed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT commerce_webhook_events_status_check CHECK (
    status = ANY (ARRAY['received', 'processing', 'processed', 'failed']::text[])
  ),
  CONSTRAINT commerce_webhook_events_attempt_count_check CHECK (attempt_count >= 0)
);

CREATE TABLE IF NOT EXISTS jg_app.commerce_deliveries (
  id uuid DEFAULT jg_app.uuid_v7() NOT NULL,
  user_id uuid NOT NULL,
  order_id uuid,
  product_id uuid NOT NULL,
  delivery_type text DEFAULT 'download'::text NOT NULL,
  storage_bucket text,
  storage_path text,
  external_url text,
  status text DEFAULT 'pending'::text NOT NULL,
  download_count integer DEFAULT 0 NOT NULL,
  expires_at timestamp with time zone,
  metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT commerce_deliveries_delivery_type_check CHECK (
    delivery_type = ANY (ARRAY['download', 'link', 'manual', 'service']::text[])
  ),
  CONSTRAINT commerce_deliveries_status_check CHECK (
    status = ANY (ARRAY['pending', 'available', 'fulfilled', 'revoked']::text[])
  ),
  CONSTRAINT commerce_deliveries_download_count_check CHECK (download_count >= 0)
);

CREATE TABLE IF NOT EXISTS jg_app.commerce_feature_usage (
  id uuid DEFAULT jg_app.uuid_v7() NOT NULL,
  user_id uuid NOT NULL,
  feature_key text NOT NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  usage_count integer DEFAULT 0 NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT commerce_feature_usage_period_check CHECK (period_end >= period_start),
  CONSTRAINT commerce_feature_usage_count_check CHECK (usage_count >= 0)
);

ALTER TABLE ONLY jg_app.commerce_products
  ADD CONSTRAINT commerce_products_pkey PRIMARY KEY (id);

ALTER TABLE ONLY jg_app.commerce_products
  ADD CONSTRAINT commerce_products_slug_key UNIQUE (slug);

ALTER TABLE ONLY jg_app.commerce_products
  ADD CONSTRAINT commerce_products_stripe_product_id_key UNIQUE (stripe_product_id);

ALTER TABLE ONLY jg_app.commerce_prices
  ADD CONSTRAINT commerce_prices_pkey PRIMARY KEY (id);

ALTER TABLE ONLY jg_app.commerce_prices
  ADD CONSTRAINT commerce_prices_stripe_price_id_key UNIQUE (stripe_price_id);

ALTER TABLE ONLY jg_app.commerce_prices
  ADD CONSTRAINT commerce_prices_lookup_key_key UNIQUE (lookup_key);

ALTER TABLE ONLY jg_app.commerce_customers
  ADD CONSTRAINT commerce_customers_pkey PRIMARY KEY (id);

ALTER TABLE ONLY jg_app.commerce_customers
  ADD CONSTRAINT commerce_customers_user_id_key UNIQUE (user_id);

ALTER TABLE ONLY jg_app.commerce_customers
  ADD CONSTRAINT commerce_customers_stripe_customer_id_key UNIQUE (stripe_customer_id);

ALTER TABLE ONLY jg_app.commerce_orders
  ADD CONSTRAINT commerce_orders_pkey PRIMARY KEY (id);

ALTER TABLE ONLY jg_app.commerce_orders
  ADD CONSTRAINT commerce_orders_checkout_session_key UNIQUE (stripe_checkout_session_id);

ALTER TABLE ONLY jg_app.commerce_subscriptions
  ADD CONSTRAINT commerce_subscriptions_pkey PRIMARY KEY (id);

ALTER TABLE ONLY jg_app.commerce_subscriptions
  ADD CONSTRAINT commerce_subscriptions_stripe_subscription_id_key UNIQUE (stripe_subscription_id);

ALTER TABLE ONLY jg_app.commerce_entitlements
  ADD CONSTRAINT commerce_entitlements_pkey PRIMARY KEY (id);

ALTER TABLE ONLY jg_app.commerce_webhook_events
  ADD CONSTRAINT commerce_webhook_events_pkey PRIMARY KEY (id);

ALTER TABLE ONLY jg_app.commerce_webhook_events
  ADD CONSTRAINT commerce_webhook_events_stripe_event_id_key UNIQUE (stripe_event_id);

ALTER TABLE ONLY jg_app.commerce_deliveries
  ADD CONSTRAINT commerce_deliveries_pkey PRIMARY KEY (id);

ALTER TABLE ONLY jg_app.commerce_feature_usage
  ADD CONSTRAINT commerce_feature_usage_pkey PRIMARY KEY (id);

ALTER TABLE ONLY jg_app.commerce_feature_usage
  ADD CONSTRAINT commerce_feature_usage_user_feature_period_key
  UNIQUE (user_id, feature_key, period_start, period_end);

ALTER TABLE ONLY jg_app.commerce_products
  ADD CONSTRAINT commerce_products_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE ONLY jg_app.commerce_prices
  ADD CONSTRAINT commerce_prices_product_id_fkey
  FOREIGN KEY (product_id) REFERENCES jg_app.commerce_products(id) ON DELETE CASCADE;

ALTER TABLE ONLY jg_app.commerce_customers
  ADD CONSTRAINT commerce_customers_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY jg_app.commerce_orders
  ADD CONSTRAINT commerce_orders_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY jg_app.commerce_orders
  ADD CONSTRAINT commerce_orders_customer_id_fkey
  FOREIGN KEY (customer_id) REFERENCES jg_app.commerce_customers(id) ON DELETE SET NULL;

ALTER TABLE ONLY jg_app.commerce_orders
  ADD CONSTRAINT commerce_orders_product_id_fkey
  FOREIGN KEY (product_id) REFERENCES jg_app.commerce_products(id) ON DELETE SET NULL;

ALTER TABLE ONLY jg_app.commerce_orders
  ADD CONSTRAINT commerce_orders_price_id_fkey
  FOREIGN KEY (price_id) REFERENCES jg_app.commerce_prices(id) ON DELETE SET NULL;

ALTER TABLE ONLY jg_app.commerce_subscriptions
  ADD CONSTRAINT commerce_subscriptions_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY jg_app.commerce_subscriptions
  ADD CONSTRAINT commerce_subscriptions_customer_id_fkey
  FOREIGN KEY (customer_id) REFERENCES jg_app.commerce_customers(id) ON DELETE SET NULL;

ALTER TABLE ONLY jg_app.commerce_subscriptions
  ADD CONSTRAINT commerce_subscriptions_product_id_fkey
  FOREIGN KEY (product_id) REFERENCES jg_app.commerce_products(id) ON DELETE SET NULL;

ALTER TABLE ONLY jg_app.commerce_subscriptions
  ADD CONSTRAINT commerce_subscriptions_price_id_fkey
  FOREIGN KEY (price_id) REFERENCES jg_app.commerce_prices(id) ON DELETE SET NULL;

ALTER TABLE ONLY jg_app.commerce_entitlements
  ADD CONSTRAINT commerce_entitlements_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY jg_app.commerce_entitlements
  ADD CONSTRAINT commerce_entitlements_product_id_fkey
  FOREIGN KEY (product_id) REFERENCES jg_app.commerce_products(id) ON DELETE SET NULL;

ALTER TABLE ONLY jg_app.commerce_entitlements
  ADD CONSTRAINT commerce_entitlements_price_id_fkey
  FOREIGN KEY (price_id) REFERENCES jg_app.commerce_prices(id) ON DELETE SET NULL;

ALTER TABLE ONLY jg_app.commerce_entitlements
  ADD CONSTRAINT commerce_entitlements_order_id_fkey
  FOREIGN KEY (order_id) REFERENCES jg_app.commerce_orders(id) ON DELETE CASCADE;

ALTER TABLE ONLY jg_app.commerce_entitlements
  ADD CONSTRAINT commerce_entitlements_subscription_id_fkey
  FOREIGN KEY (subscription_id) REFERENCES jg_app.commerce_subscriptions(id) ON DELETE CASCADE;

ALTER TABLE ONLY jg_app.commerce_entitlements
  ADD CONSTRAINT commerce_entitlements_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE ONLY jg_app.commerce_deliveries
  ADD CONSTRAINT commerce_deliveries_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY jg_app.commerce_deliveries
  ADD CONSTRAINT commerce_deliveries_order_id_fkey
  FOREIGN KEY (order_id) REFERENCES jg_app.commerce_orders(id) ON DELETE SET NULL;

ALTER TABLE ONLY jg_app.commerce_deliveries
  ADD CONSTRAINT commerce_deliveries_product_id_fkey
  FOREIGN KEY (product_id) REFERENCES jg_app.commerce_products(id) ON DELETE CASCADE;

ALTER TABLE ONLY jg_app.commerce_feature_usage
  ADD CONSTRAINT commerce_feature_usage_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_commerce_products_status_sort
  ON jg_app.commerce_products (status, sort_order, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_commerce_products_featured
  ON jg_app.commerce_products (sort_order, created_at DESC)
  WHERE status = 'published' AND is_featured;

CREATE INDEX IF NOT EXISTS idx_commerce_prices_product_active
  ON jg_app.commerce_prices (product_id, is_active);

CREATE INDEX IF NOT EXISTS idx_commerce_customers_user_id
  ON jg_app.commerce_customers (user_id);

CREATE INDEX IF NOT EXISTS idx_commerce_orders_user_created
  ON jg_app.commerce_orders (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_commerce_orders_status
  ON jg_app.commerce_orders (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_commerce_subscriptions_user_status
  ON jg_app.commerce_subscriptions (user_id, status);

CREATE INDEX IF NOT EXISTS idx_commerce_entitlements_user_feature
  ON jg_app.commerce_entitlements (user_id, feature_key, status);

CREATE INDEX IF NOT EXISTS idx_commerce_entitlements_active
  ON jg_app.commerce_entitlements (user_id, feature_key, expires_at)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_commerce_webhook_events_status
  ON jg_app.commerce_webhook_events (status, created_at);

CREATE INDEX IF NOT EXISTS idx_commerce_deliveries_user_status
  ON jg_app.commerce_deliveries (user_id, status);

CREATE INDEX IF NOT EXISTS idx_commerce_feature_usage_user_feature
  ON jg_app.commerce_feature_usage (user_id, feature_key, period_start DESC);

CREATE OR REPLACE TRIGGER update_commerce_products_updated_at
  BEFORE UPDATE ON jg_app.commerce_products
  FOR EACH ROW EXECUTE FUNCTION jg_app.update_updated_at();

CREATE OR REPLACE TRIGGER update_commerce_prices_updated_at
  BEFORE UPDATE ON jg_app.commerce_prices
  FOR EACH ROW EXECUTE FUNCTION jg_app.update_updated_at();

CREATE OR REPLACE TRIGGER update_commerce_customers_updated_at
  BEFORE UPDATE ON jg_app.commerce_customers
  FOR EACH ROW EXECUTE FUNCTION jg_app.update_updated_at();

CREATE OR REPLACE TRIGGER update_commerce_orders_updated_at
  BEFORE UPDATE ON jg_app.commerce_orders
  FOR EACH ROW EXECUTE FUNCTION jg_app.update_updated_at();

CREATE OR REPLACE TRIGGER update_commerce_subscriptions_updated_at
  BEFORE UPDATE ON jg_app.commerce_subscriptions
  FOR EACH ROW EXECUTE FUNCTION jg_app.update_updated_at();

CREATE OR REPLACE TRIGGER update_commerce_entitlements_updated_at
  BEFORE UPDATE ON jg_app.commerce_entitlements
  FOR EACH ROW EXECUTE FUNCTION jg_app.update_updated_at();

CREATE OR REPLACE TRIGGER update_commerce_webhook_events_updated_at
  BEFORE UPDATE ON jg_app.commerce_webhook_events
  FOR EACH ROW EXECUTE FUNCTION jg_app.update_updated_at();

CREATE OR REPLACE TRIGGER update_commerce_deliveries_updated_at
  BEFORE UPDATE ON jg_app.commerce_deliveries
  FOR EACH ROW EXECUTE FUNCTION jg_app.update_updated_at();

CREATE OR REPLACE TRIGGER update_commerce_feature_usage_updated_at
  BEFORE UPDATE ON jg_app.commerce_feature_usage
  FOR EACH ROW EXECUTE FUNCTION jg_app.update_updated_at();

ALTER TABLE jg_app.commerce_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE jg_app.commerce_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE jg_app.commerce_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE jg_app.commerce_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE jg_app.commerce_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE jg_app.commerce_entitlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE jg_app.commerce_webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE jg_app.commerce_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE jg_app.commerce_feature_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published commerce products"
  ON jg_app.commerce_products
  FOR SELECT TO anon, authenticated
  USING (status = 'published');

CREATE POLICY "Admins can manage commerce products"
  ON jg_app.commerce_products
  FOR ALL TO authenticated
  USING (jg_account.is_admin())
  WITH CHECK (jg_account.is_admin());

CREATE POLICY "Anyone can view active commerce prices"
  ON jg_app.commerce_prices
  FOR SELECT TO anon, authenticated
  USING (
    is_active
    AND EXISTS (
      SELECT 1
      FROM jg_app.commerce_products p
      WHERE p.id = commerce_prices.product_id
        AND p.status = 'published'
    )
  );

CREATE POLICY "Admins can manage commerce prices"
  ON jg_app.commerce_prices
  FOR ALL TO authenticated
  USING (jg_account.is_admin())
  WITH CHECK (jg_account.is_admin());

CREATE POLICY "Users can view own commerce customers"
  ON jg_app.commerce_customers
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR jg_account.is_admin());

CREATE POLICY "Admins can manage commerce customers"
  ON jg_app.commerce_customers
  FOR ALL TO authenticated
  USING (jg_account.is_admin())
  WITH CHECK (jg_account.is_admin());

CREATE POLICY "Users can view own commerce orders"
  ON jg_app.commerce_orders
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR jg_account.is_admin());

CREATE POLICY "Admins can manage commerce orders"
  ON jg_app.commerce_orders
  FOR ALL TO authenticated
  USING (jg_account.is_admin())
  WITH CHECK (jg_account.is_admin());

CREATE POLICY "Users can view own commerce subscriptions"
  ON jg_app.commerce_subscriptions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR jg_account.is_admin());

CREATE POLICY "Admins can manage commerce subscriptions"
  ON jg_app.commerce_subscriptions
  FOR ALL TO authenticated
  USING (jg_account.is_admin())
  WITH CHECK (jg_account.is_admin());

CREATE POLICY "Users can view own commerce entitlements"
  ON jg_app.commerce_entitlements
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR jg_account.is_admin());

CREATE POLICY "Admins can manage commerce entitlements"
  ON jg_app.commerce_entitlements
  FOR ALL TO authenticated
  USING (jg_account.is_admin())
  WITH CHECK (jg_account.is_admin());

CREATE POLICY "Admins can view commerce webhook events"
  ON jg_app.commerce_webhook_events
  FOR SELECT TO authenticated
  USING (jg_account.is_admin());

CREATE POLICY "Admins can manage commerce webhook events"
  ON jg_app.commerce_webhook_events
  FOR ALL TO authenticated
  USING (jg_account.is_admin())
  WITH CHECK (jg_account.is_admin());

CREATE POLICY "Users can view own commerce deliveries"
  ON jg_app.commerce_deliveries
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR jg_account.is_admin());

CREATE POLICY "Admins can manage commerce deliveries"
  ON jg_app.commerce_deliveries
  FOR ALL TO authenticated
  USING (jg_account.is_admin())
  WITH CHECK (jg_account.is_admin());

CREATE POLICY "Users can view own commerce feature usage"
  ON jg_app.commerce_feature_usage
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR jg_account.is_admin());

CREATE POLICY "Admins can manage commerce feature usage"
  ON jg_app.commerce_feature_usage
  FOR ALL TO authenticated
  USING (jg_account.is_admin())
  WITH CHECK (jg_account.is_admin());

GRANT SELECT ON TABLE jg_app.commerce_products TO anon;
GRANT SELECT ON TABLE jg_app.commerce_prices TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE jg_app.commerce_products TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE jg_app.commerce_prices TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE jg_app.commerce_customers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE jg_app.commerce_orders TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE jg_app.commerce_subscriptions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE jg_app.commerce_entitlements TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE jg_app.commerce_webhook_events TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE jg_app.commerce_deliveries TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE jg_app.commerce_feature_usage TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE jg_app.commerce_products TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE jg_app.commerce_prices TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE jg_app.commerce_customers TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE jg_app.commerce_orders TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE jg_app.commerce_subscriptions TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE jg_app.commerce_entitlements TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE jg_app.commerce_webhook_events TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE jg_app.commerce_deliveries TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE jg_app.commerce_feature_usage TO service_role;
