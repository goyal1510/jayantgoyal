-- Retryable commerce email event records for receipts, access, and support notices.

CREATE TABLE IF NOT EXISTS jg_app.commerce_email_events (
  id uuid DEFAULT jg_app.uuid_v7() NOT NULL,
  event_key text NOT NULL,
  email_type text NOT NULL,
  user_id uuid,
  order_id uuid,
  conversation_id uuid,
  status text DEFAULT 'pending'::text NOT NULL,
  attempt_count integer DEFAULT 0 NOT NULL,
  resend_message_id text,
  last_error text,
  next_retry_at timestamp with time zone,
  sent_at timestamp with time zone,
  metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT commerce_email_events_email_type_check CHECK (
    email_type = ANY (
      ARRAY[
        'purchase_receipt',
        'product_access',
        'support_opened',
        'support_reply'
      ]::text[]
    )
  ),
  CONSTRAINT commerce_email_events_status_check CHECK (
    status = ANY (ARRAY['pending', 'sending', 'sent', 'failed', 'skipped']::text[])
  ),
  CONSTRAINT commerce_email_events_attempt_count_check CHECK (attempt_count >= 0)
);
ALTER TABLE ONLY jg_app.commerce_email_events
  ADD CONSTRAINT commerce_email_events_pkey PRIMARY KEY (id);
ALTER TABLE ONLY jg_app.commerce_email_events
  ADD CONSTRAINT commerce_email_events_event_key_key UNIQUE (event_key);
ALTER TABLE ONLY jg_app.commerce_email_events
  ADD CONSTRAINT commerce_email_events_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE ONLY jg_app.commerce_email_events
  ADD CONSTRAINT commerce_email_events_order_id_fkey
  FOREIGN KEY (order_id) REFERENCES jg_app.commerce_orders(id) ON DELETE SET NULL;
ALTER TABLE ONLY jg_app.commerce_email_events
  ADD CONSTRAINT commerce_email_events_conversation_id_fkey
  FOREIGN KEY (conversation_id) REFERENCES jg_app.messenger_conversations(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_commerce_email_events_status_retry
  ON jg_app.commerce_email_events (status, next_retry_at, created_at);
CREATE INDEX IF NOT EXISTS idx_commerce_email_events_order_type
  ON jg_app.commerce_email_events (order_id, email_type);
CREATE INDEX IF NOT EXISTS idx_commerce_email_events_conversation
  ON jg_app.commerce_email_events (conversation_id, created_at DESC);
CREATE OR REPLACE TRIGGER update_commerce_email_events_updated_at
  BEFORE UPDATE ON jg_app.commerce_email_events
  FOR EACH ROW
  EXECUTE FUNCTION jg_app.update_updated_at();
ALTER TABLE jg_app.commerce_email_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can view commerce email events" ON jg_app.commerce_email_events;
CREATE POLICY "Admins can view commerce email events"
  ON jg_app.commerce_email_events
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM jg_account.profiles profiles
      WHERE profiles.user_id = auth.uid()
        AND profiles.role = ANY (
          ARRAY['admin'::jg_account.user_role, 'super_admin'::jg_account.user_role]
        )
    )
  );
REVOKE ALL ON TABLE jg_app.commerce_email_events FROM anon;
REVOKE ALL ON TABLE jg_app.commerce_email_events FROM authenticated;
GRANT SELECT ON TABLE jg_app.commerce_email_events TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE jg_app.commerce_email_events TO service_role;
