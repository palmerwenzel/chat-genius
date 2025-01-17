-- Create system and conversation bot users
INSERT INTO auth.users (
  id,
  email,
  raw_user_meta_data,
  role,
  instance_id
)
VALUES 
  -- System Bot
  (
    '00000000-0000-0000-0000-000000000000',  -- System Bot
    'system@chat-genius.local',
    jsonb_build_object(
      'name', 'System',
      'is_system_bot', true,
      'bot_type', 'system'
    ),
    'authenticated',
    '00000000-0000-0000-0000-000000000000'
  ),
  -- Conversation Bots 1-10
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
  ),
  (
    '00000000-0000-0000-0000-000000000b03',
    'bot3@chat-genius.local',
    jsonb_build_object(
      'name', 'Bot 3',
      'is_system_bot', true,
      'bot_type', 'conversation'
    ),
    'authenticated',
    '00000000-0000-0000-0000-000000000000'
  ),
  (
    '00000000-0000-0000-0000-000000000b04',
    'bot4@chat-genius.local',
    jsonb_build_object(
      'name', 'Bot 4',
      'is_system_bot', true,
      'bot_type', 'conversation'
    ),
    'authenticated',
    '00000000-0000-0000-0000-000000000000'
  ),
  (
    '00000000-0000-0000-0000-000000000b05',
    'bot5@chat-genius.local',
    jsonb_build_object(
      'name', 'Bot 5',
      'is_system_bot', true,
      'bot_type', 'conversation'
    ),
    'authenticated',
    '00000000-0000-0000-0000-000000000000'
  ),
  (
    '00000000-0000-0000-0000-000000000b06',
    'bot6@chat-genius.local',
    jsonb_build_object(
      'name', 'Bot 6',
      'is_system_bot', true,
      'bot_type', 'conversation'
    ),
    'authenticated',
    '00000000-0000-0000-0000-000000000000'
  ),
  (
    '00000000-0000-0000-0000-000000000b07',
    'bot7@chat-genius.local',
    jsonb_build_object(
      'name', 'Bot 7',
      'is_system_bot', true,
      'bot_type', 'conversation'
    ),
    'authenticated',
    '00000000-0000-0000-0000-000000000000'
  ),
  (
    '00000000-0000-0000-0000-000000000b08',
    'bot8@chat-genius.local',
    jsonb_build_object(
      'name', 'Bot 8',
      'is_system_bot', true,
      'bot_type', 'conversation'
    ),
    'authenticated',
    '00000000-0000-0000-0000-000000000000'
  ),
  (
    '00000000-0000-0000-0000-000000000b09',
    'bot9@chat-genius.local',
    jsonb_build_object(
      'name', 'Bot 9',
      'is_system_bot', true,
      'bot_type', 'conversation'
    ),
    'authenticated',
    '00000000-0000-0000-0000-000000000000'
  ),
  (
    '00000000-0000-0000-0000-000000000b10',
    'bot10@chat-genius.local',
    jsonb_build_object(
      'name', 'Bot 10',
      'is_system_bot', true,
      'bot_type', 'conversation'
    ),
    'authenticated',
    '00000000-0000-0000-0000-000000000000'
  )
ON CONFLICT (id) DO UPDATE SET
  raw_user_meta_data = EXCLUDED.raw_user_meta_data;

-- Create RLS policy for bot operations
CREATE POLICY "Allow system bots to send messages"
  ON messages
  FOR INSERT
  WITH CHECK (
    sender_id IN (
      '00000000-0000-0000-0000-000000000000',  -- System Bot
      '00000000-0000-0000-0000-000000000b01',
      '00000000-0000-0000-0000-000000000b02',
      '00000000-0000-0000-0000-000000000b03',
      '00000000-0000-0000-0000-000000000b04',
      '00000000-0000-0000-0000-000000000b05',
      '00000000-0000-0000-0000-000000000b06',
      '00000000-0000-0000-0000-000000000b07',
      '00000000-0000-0000-0000-000000000b08',
      '00000000-0000-0000-0000-000000000b09',
      '00000000-0000-0000-0000-000000000b10'
    )
    OR
    EXISTS (
      SELECT 1 FROM channel_members
      WHERE channel_members.channel_id = channel_id
      AND channel_members.user_id = auth.uid()
    )
  ); 