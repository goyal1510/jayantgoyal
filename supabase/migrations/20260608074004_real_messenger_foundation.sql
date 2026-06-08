-- Real Messenger foundation.
-- Existing messenger_messages rows are preserved by backfilling them into a
-- per-user self conversation. The current UI can keep using the legacy columns
-- while the conversation UI/API is built on top of this schema.

CREATE TABLE IF NOT EXISTS jg_app.messenger_conversations (
  id uuid DEFAULT jg_app.uuid_v7() NOT NULL,
  conversation_type text DEFAULT 'direct'::text NOT NULL,
  title text,
  created_by uuid NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
  is_archived boolean DEFAULT false NOT NULL,
  last_message_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT messenger_conversations_type_check CHECK (
    conversation_type = ANY (ARRAY['direct', 'group', 'self']::text[])
  )
);

CREATE TABLE IF NOT EXISTS jg_app.messenger_conversation_participants (
  id uuid DEFAULT jg_app.uuid_v7() NOT NULL,
  conversation_id uuid NOT NULL,
  user_id uuid NOT NULL,
  role text DEFAULT 'member'::text NOT NULL,
  display_name text,
  last_read_at timestamp with time zone,
  muted_until timestamp with time zone,
  joined_at timestamp with time zone DEFAULT now() NOT NULL,
  left_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT messenger_conversation_participants_role_check CHECK (
    role = ANY (ARRAY['owner', 'member']::text[])
  )
);

ALTER TABLE jg_app.messenger_messages
  ADD COLUMN IF NOT EXISTS conversation_id uuid,
  ADD COLUMN IF NOT EXISTS sender_id uuid,
  ADD COLUMN IF NOT EXISTS reply_to_message_id uuid,
  ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
  ADD COLUMN IF NOT EXISTS edited_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone;

ALTER TABLE ONLY jg_app.messenger_conversations
  ADD CONSTRAINT messenger_conversations_pkey PRIMARY KEY (id);

ALTER TABLE ONLY jg_app.messenger_conversation_participants
  ADD CONSTRAINT messenger_conversation_participants_pkey PRIMARY KEY (id);

ALTER TABLE ONLY jg_app.messenger_conversation_participants
  ADD CONSTRAINT messenger_conversation_participants_conversation_user_key UNIQUE (conversation_id, user_id);

CREATE UNIQUE INDEX IF NOT EXISTS messenger_conversations_one_self_per_user
  ON jg_app.messenger_conversations (created_by)
  WHERE conversation_type = 'self' AND is_archived = false;

ALTER TABLE ONLY jg_app.messenger_conversations
  ADD CONSTRAINT messenger_conversations_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY jg_app.messenger_conversation_participants
  ADD CONSTRAINT messenger_conversation_participants_conversation_id_fkey
  FOREIGN KEY (conversation_id) REFERENCES jg_app.messenger_conversations(id) ON DELETE CASCADE;

ALTER TABLE ONLY jg_app.messenger_conversation_participants
  ADD CONSTRAINT messenger_conversation_participants_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY jg_app.messenger_messages
  ADD CONSTRAINT messenger_messages_conversation_id_fkey
  FOREIGN KEY (conversation_id) REFERENCES jg_app.messenger_conversations(id) ON DELETE CASCADE;

ALTER TABLE ONLY jg_app.messenger_messages
  ADD CONSTRAINT messenger_messages_sender_id_fkey
  FOREIGN KEY (sender_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY jg_app.messenger_messages
  ADD CONSTRAINT messenger_messages_reply_to_message_id_fkey
  FOREIGN KEY (reply_to_message_id) REFERENCES jg_app.messenger_messages(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_msg_conversations_created_by
  ON jg_app.messenger_conversations USING btree (created_by);

CREATE INDEX IF NOT EXISTS idx_msg_conversations_last_message
  ON jg_app.messenger_conversations USING btree (last_message_at DESC);

CREATE INDEX IF NOT EXISTS idx_msg_participants_user
  ON jg_app.messenger_conversation_participants USING btree (user_id);

CREATE INDEX IF NOT EXISTS idx_msg_participants_conversation
  ON jg_app.messenger_conversation_participants USING btree (conversation_id);

CREATE INDEX IF NOT EXISTS idx_msg_messages_conversation_created
  ON jg_app.messenger_messages USING btree (conversation_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_msg_messages_sender
  ON jg_app.messenger_messages USING btree (sender_id);

CREATE OR REPLACE TRIGGER update_messenger_conversations_updated_at
  BEFORE UPDATE ON jg_app.messenger_conversations
  FOR EACH ROW EXECUTE FUNCTION jg_app.update_updated_at();

CREATE OR REPLACE TRIGGER update_messenger_conversation_participants_updated_at
  BEFORE UPDATE ON jg_app.messenger_conversation_participants
  FOR EACH ROW EXECUTE FUNCTION jg_app.update_updated_at();

INSERT INTO jg_app.messenger_conversations (
  conversation_type,
  title,
  created_by,
  last_message_at
)
SELECT
  'self',
  'Self chat',
  user_id,
  max(created_at)
FROM jg_app.messenger_messages
WHERE conversation_id IS NULL
GROUP BY user_id
ON CONFLICT DO NOTHING;

INSERT INTO jg_app.messenger_conversation_participants (
  conversation_id,
  user_id,
  role,
  last_read_at
)
SELECT
  c.id,
  c.created_by,
  'owner',
  c.last_message_at
FROM jg_app.messenger_conversations c
WHERE c.conversation_type = 'self'
ON CONFLICT (conversation_id, user_id) DO NOTHING;

UPDATE jg_app.messenger_messages m
SET
  conversation_id = c.id,
  sender_id = COALESCE(m.sender_id, m.user_id)
FROM jg_app.messenger_conversations c
WHERE m.conversation_id IS NULL
  AND c.conversation_type = 'self'
  AND c.created_by = m.user_id;

ALTER TABLE jg_app.messenger_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE jg_app.messenger_conversation_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create messenger conversations"
  ON jg_app.messenger_conversations
  FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Participants can view messenger conversations"
  ON jg_app.messenger_conversations
  FOR SELECT TO authenticated
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM jg_app.messenger_conversation_participants p
      WHERE p.conversation_id = messenger_conversations.id
        AND p.user_id = auth.uid()
        AND p.left_at IS NULL
    )
  );

CREATE POLICY "Owners can update messenger conversations"
  ON jg_app.messenger_conversations
  FOR UPDATE TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can view own participant rows"
  ON jg_app.messenger_conversation_participants
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can join conversations as themselves"
  ON jg_app.messenger_conversation_participants
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own participant rows"
  ON jg_app.messenger_conversation_participants
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Conversation participants can view messages"
  ON jg_app.messenger_messages
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR sender_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM jg_app.messenger_conversation_participants p
      WHERE p.conversation_id = messenger_messages.conversation_id
        AND p.user_id = auth.uid()
        AND p.left_at IS NULL
    )
  );

CREATE POLICY "Conversation participants can insert messages"
  ON jg_app.messenger_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    OR sender_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM jg_app.messenger_conversation_participants p
      WHERE p.conversation_id = messenger_messages.conversation_id
        AND p.user_id = auth.uid()
        AND p.left_at IS NULL
    )
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE jg_app.messenger_conversations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE jg_app.messenger_conversation_participants TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE jg_app.messenger_conversations TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE jg_app.messenger_conversation_participants TO service_role;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE jg_app.messenger_messages;
EXCEPTION
  WHEN duplicate_object OR undefined_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE jg_app.messenger_conversations;
EXCEPTION
  WHEN duplicate_object OR undefined_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE jg_app.messenger_conversation_participants;
EXCEPTION
  WHEN duplicate_object OR undefined_object THEN NULL;
END $$;
