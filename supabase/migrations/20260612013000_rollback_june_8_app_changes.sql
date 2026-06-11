-- Roll back additive app/product schema introduced on June 8-9, 2026.
-- This intentionally returns the live schema toward the pre-June-8 app shape
-- without touching existing portfolio, files, calculator history, games, or
-- legacy messenger tables beyond columns/policies added for the new features.

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime DROP TABLE jg_app.messenger_conversation_participants;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime DROP TABLE jg_app.messenger_conversations;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime DROP TABLE jg_app.messenger_messages;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

DROP TABLE IF EXISTS jg_app.commerce_email_events CASCADE;
DROP TABLE IF EXISTS jg_app.commerce_events CASCADE;
DROP TABLE IF EXISTS jg_app.tool_saved_items CASCADE;
DROP TABLE IF EXISTS jg_app.file_manager_share_links CASCADE;
DROP TABLE IF EXISTS jg_app.custom_calculator_templates CASCADE;

DROP TABLE IF EXISTS jg_app.commerce_feature_usage CASCADE;
DROP TABLE IF EXISTS jg_app.commerce_deliveries CASCADE;
DROP TABLE IF EXISTS jg_app.commerce_entitlements CASCADE;
DROP TABLE IF EXISTS jg_app.commerce_subscriptions CASCADE;
DROP TABLE IF EXISTS jg_app.commerce_orders CASCADE;
DROP TABLE IF EXISTS jg_app.commerce_customers CASCADE;
DROP TABLE IF EXISTS jg_app.commerce_prices CASCADE;
DROP TABLE IF EXISTS jg_app.commerce_products CASCADE;
DROP TABLE IF EXISTS jg_app.commerce_webhook_events CASCADE;

DROP POLICY IF EXISTS "Conversation participants can view messages"
  ON jg_app.messenger_messages;
DROP POLICY IF EXISTS "Conversation participants can insert messages"
  ON jg_app.messenger_messages;

ALTER TABLE jg_app.messenger_messages
  DROP CONSTRAINT IF EXISTS messenger_messages_conversation_id_fkey,
  DROP CONSTRAINT IF EXISTS messenger_messages_sender_id_fkey,
  DROP CONSTRAINT IF EXISTS messenger_messages_reply_to_message_id_fkey;

DROP INDEX IF EXISTS jg_app.idx_msg_messages_conversation_created;
DROP INDEX IF EXISTS jg_app.idx_msg_messages_sender;

ALTER TABLE jg_app.messenger_messages
  DROP COLUMN IF EXISTS conversation_id,
  DROP COLUMN IF EXISTS sender_id,
  DROP COLUMN IF EXISTS reply_to_message_id,
  DROP COLUMN IF EXISTS metadata,
  DROP COLUMN IF EXISTS edited_at,
  DROP COLUMN IF EXISTS deleted_at;

DROP TABLE IF EXISTS jg_app.messenger_conversation_participants CASCADE;
DROP TABLE IF EXISTS jg_app.messenger_conversations CASCADE;

DROP INDEX IF EXISTS jg_app.idx_fm_files_user_starred;

ALTER TABLE jg_app.file_manager_files
  DROP COLUMN IF EXISTS is_starred;
