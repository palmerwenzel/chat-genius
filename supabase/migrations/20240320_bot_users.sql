-- Create system bot users
INSERT INTO auth.users (
  id,
  email,
  raw_user_meta_data,
  role,
  instance_id
)
VALUES 
  -- Bot 1
  (
    '00000000-0000-0000-0000-000000000b01',
    'bot1@chat-genius.local',
    jsonb_build_object(
      'name', 'Bot 1',
      'is_system_bot', true,
      'bot_type', 'conversation'
    ),
    'authenticated',
    '00000000-0000-0000-0000-000000000000'
  ),
  -- Bot 2
  (
    '00000000-0000-0000-0000-000000000b02',
    'bot2@chat-genius.local',
    jsonb_build_object(
      'name', 'Bot 2',
      'is_system_bot', true,
      'bot_type', 'conversation'
    ),
    'authenticated',
    '00000000-0000-0000-0000-000000000000'
  )
ON CONFLICT (id) DO UPDATE SET
  raw_user_meta_data = EXCLUDED.raw_user_meta_data;

-- Update RLS policies to allow bot operations
CREATE POLICY "Allow system bots to send messages"
  ON messages
  FOR INSERT
  WITH CHECK (
    sender_id IN (
      '00000000-0000-0000-0000-000000000b01',
      '00000000-0000-0000-0000-000000000b02'
    )
    OR
    EXISTS (
      SELECT 1 FROM channel_members
      WHERE channel_members.channel_id = channel_id
      AND channel_members.user_id = auth.uid()
    )
  ); 