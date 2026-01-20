-- Create custom schema for messenger
CREATE SCHEMA IF NOT EXISTS messenger;

-- Grant usage on schema to authenticated users
GRANT USAGE ON SCHEMA messenger TO authenticated;
GRANT USAGE ON SCHEMA messenger TO anon;

-- Create messages table for cross-device messaging
CREATE TABLE IF NOT EXISTS messenger.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  message_type TEXT NOT NULL CHECK (message_type IN ('text', 'code')),
  language TEXT, -- For code messages (e.g., 'javascript', 'python', etc.)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Grant permissions on table
GRANT SELECT, INSERT, UPDATE, DELETE ON messenger.messages TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON messenger.messages TO anon;

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messenger.messages(user_id);

-- Create index on created_at for chronological ordering
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messenger.messages(created_at DESC);

-- Enable Row Level Security
ALTER TABLE messenger.messages ENABLE ROW LEVEL SECURITY;

-- Create policy: Users can only see their own messages
CREATE POLICY "Users can view their own messages"
  ON messenger.messages
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy: Users can insert their own messages
CREATE POLICY "Users can insert their own messages"
  ON messenger.messages
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create policy: Users can update their own messages
CREATE POLICY "Users can update their own messages"
  ON messenger.messages
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create policy: Users can delete their own messages
CREATE POLICY "Users can delete their own messages"
  ON messenger.messages
  FOR DELETE
  USING (auth.uid() = user_id);

-- Enable Realtime for messages table
ALTER PUBLICATION supabase_realtime ADD TABLE messenger.messages;

-- Create function to update updated_at timestamp in messenger schema
CREATE OR REPLACE FUNCTION messenger.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission on function
GRANT EXECUTE ON FUNCTION messenger.update_updated_at_column() TO authenticated;
GRANT EXECUTE ON FUNCTION messenger.update_updated_at_column() TO anon;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_messages_updated_at
  BEFORE UPDATE ON messenger.messages
  FOR EACH ROW
  EXECUTE FUNCTION messenger.update_updated_at_column();
