-- Privacy-safe commerce analytics events.
-- Events are aggregate-oriented and intentionally separate from raw webhook
-- payloads, message contents, file names, tool inputs, and payment details.

CREATE TABLE IF NOT EXISTS jg_app.commerce_events (
  id uuid DEFAULT jg_app.uuid_v7() NOT NULL,
  event_type text NOT NULL,
  user_id uuid,
  product_id uuid,
  price_id uuid,
  order_id uuid,
  subscription_id uuid,
  payment_provider text,
  source text DEFAULT 'server'::text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT commerce_events_event_type_check CHECK (
    event_type ~ '^[a-z0-9_]{3,80}$'
  ),
  CONSTRAINT commerce_events_payment_provider_check CHECK (
    payment_provider IS NULL
    OR payment_provider = ANY (ARRAY['razorpay', 'stripe']::text[])
  ),
  CONSTRAINT commerce_events_source_check CHECK (
    source ~ '^[a-z0-9_:-]{3,80}$'
  )
);
ALTER TABLE ONLY jg_app.commerce_events
  ADD CONSTRAINT commerce_events_pkey PRIMARY KEY (id);
ALTER TABLE ONLY jg_app.commerce_events
  ADD CONSTRAINT commerce_events_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE ONLY jg_app.commerce_events
  ADD CONSTRAINT commerce_events_product_id_fkey
  FOREIGN KEY (product_id) REFERENCES jg_app.commerce_products(id) ON DELETE SET NULL;
ALTER TABLE ONLY jg_app.commerce_events
  ADD CONSTRAINT commerce_events_price_id_fkey
  FOREIGN KEY (price_id) REFERENCES jg_app.commerce_prices(id) ON DELETE SET NULL;
ALTER TABLE ONLY jg_app.commerce_events
  ADD CONSTRAINT commerce_events_order_id_fkey
  FOREIGN KEY (order_id) REFERENCES jg_app.commerce_orders(id) ON DELETE SET NULL;
ALTER TABLE ONLY jg_app.commerce_events
  ADD CONSTRAINT commerce_events_subscription_id_fkey
  FOREIGN KEY (subscription_id) REFERENCES jg_app.commerce_subscriptions(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_commerce_events_created
  ON jg_app.commerce_events (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_commerce_events_type_created
  ON jg_app.commerce_events (event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_commerce_events_product_created
  ON jg_app.commerce_events (product_id, created_at DESC)
  WHERE product_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_commerce_events_order_created
  ON jg_app.commerce_events (order_id, created_at DESC)
  WHERE order_id IS NOT NULL;
ALTER TABLE jg_app.commerce_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view commerce events"
  ON jg_app.commerce_events
  FOR SELECT TO authenticated
  USING (jg_account.is_admin());
REVOKE ALL ON TABLE jg_app.commerce_events FROM anon;
GRANT SELECT ON TABLE jg_app.commerce_events TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE jg_app.commerce_events TO service_role;
