-- Support threads for commerce purchases.
-- This extends the existing participant-scoped messenger model; normal users
-- still see only conversations where they are participants, while admin APIs
-- must explicitly filter to conversation_type = 'support'.

ALTER TABLE jg_app.messenger_conversations
  DROP CONSTRAINT IF EXISTS messenger_conversations_type_check;
ALTER TABLE jg_app.messenger_conversations
  ADD CONSTRAINT messenger_conversations_type_check CHECK (
    conversation_type = ANY (ARRAY['direct', 'group', 'self', 'support']::text[])
  );
ALTER TABLE jg_app.messenger_conversation_participants
  DROP CONSTRAINT IF EXISTS messenger_conversation_participants_role_check;
ALTER TABLE jg_app.messenger_conversation_participants
  ADD CONSTRAINT messenger_conversation_participants_role_check CHECK (
    role = ANY (ARRAY['owner', 'member', 'support_agent']::text[])
  );
CREATE INDEX IF NOT EXISTS idx_msg_conversations_support_order
  ON jg_app.messenger_conversations ((metadata->>'order_id'))
  WHERE conversation_type = 'support' AND is_archived = false;
CREATE UNIQUE INDEX IF NOT EXISTS messenger_support_one_active_thread_per_order
  ON jg_app.messenger_conversations ((metadata->>'order_id'))
  WHERE conversation_type = 'support'
    AND is_archived = false
    AND metadata ? 'order_id';
CREATE INDEX IF NOT EXISTS idx_msg_conversations_support_status
  ON jg_app.messenger_conversations ((metadata->>'support_status'), last_message_at DESC)
  WHERE conversation_type = 'support' AND is_archived = false;
