-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL CHECK (char_length(email) <= 255),
  name TEXT NOT NULL CHECK (char_length(name) <= 100),
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create groups table
CREATE TABLE IF NOT EXISTS groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL CHECK (char_length(name) <= 100),
  description TEXT CHECK (char_length(description) <= 1000),
  visibility TEXT CHECK (visibility IN ('public', 'private')) DEFAULT 'private',
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create group_members table
CREATE TABLE IF NOT EXISTS group_members (
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('owner', 'admin', 'member')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  PRIMARY KEY (group_id, user_id)
);

-- Create channels table
CREATE TABLE IF NOT EXISTS channels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(name) <= 100),
  description TEXT CHECK (char_length(description) <= 1000),
  type TEXT CHECK (type IN ('text', 'voice')) DEFAULT 'text',
  visibility TEXT CHECK (visibility IN ('public', 'private')) DEFAULT 'private',
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create channel_members table
CREATE TABLE IF NOT EXISTS channel_members (
  channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('owner', 'admin', 'member')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  PRIMARY KEY (channel_id, user_id)
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
  content TEXT NOT NULL CHECK (char_length(content) <= 4000),
  type TEXT CHECK (type IN ('text', 'code')) DEFAULT 'text',
  metadata JSONB DEFAULT '{}',
  replying_to_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  thread_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  -- Ensure a message can't be its own thread or reply
  CONSTRAINT message_not_self_thread CHECK (thread_id != id),
  CONSTRAINT message_not_self_reply CHECK (replying_to_id != id)
);

-- Create reactions table
CREATE TABLE IF NOT EXISTS reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL CHECK (char_length(emoji) <= 20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(message_id, user_id, emoji)
);

-- Create function to ensure user profile exists
CREATE OR REPLACE FUNCTION ensure_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'name', NEW.email))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ language plpgsql security definer;

-- Create trigger to create user profile on auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION ensure_user_profile();

-- Create function to add channel creator as owner
CREATE OR REPLACE FUNCTION add_channel_creator_as_owner()
RETURNS TRIGGER AS $$
BEGIN
  -- Only add owner if created_by is set
  IF NEW.created_by IS NOT NULL THEN
    INSERT INTO channel_members (channel_id, user_id, role)
    VALUES (NEW.id, NEW.created_by, 'owner')
    ON CONFLICT (channel_id, user_id) DO UPDATE SET role = 'owner';
  ELSE
    RAISE EXCEPTION 'created_by must be set when creating a channel';
  END IF;
  RETURN NEW;
END;
$$ language plpgsql security definer;

-- Create trigger to add channel creator as owner
CREATE TRIGGER add_channel_creator_as_owner
  AFTER INSERT ON channels
  FOR EACH ROW
  EXECUTE FUNCTION add_channel_creator_as_owner();

-- Create function to check channel member limit
CREATE OR REPLACE FUNCTION check_channel_member_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF (
    SELECT COUNT(*) 
    FROM channel_members 
    WHERE channel_id = NEW.channel_id
  ) >= 1000 THEN
    RAISE EXCEPTION 'Channel member limit reached (1000 members)';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to enforce channel member limit
CREATE TRIGGER enforce_channel_member_limit
  BEFORE INSERT ON channel_members
  FOR EACH ROW
  EXECUTE FUNCTION check_channel_member_limit();

-- Create function to check message reaction limit
CREATE OR REPLACE FUNCTION check_message_reaction_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF (
    SELECT COUNT(*) 
    FROM reactions 
    WHERE message_id = NEW.message_id
  ) >= 100 THEN
    RAISE EXCEPTION 'Message reaction limit reached (100 reactions)';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to enforce message reaction limit
CREATE TRIGGER enforce_message_reaction_limit
  BEFORE INSERT ON reactions
  FOR EACH ROW
  EXECUTE FUNCTION check_message_reaction_limit();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS users_email_idx ON users(email);
CREATE INDEX IF NOT EXISTS channels_created_by_idx ON channels(created_by);
CREATE INDEX IF NOT EXISTS channels_group_id_idx ON channels(group_id);
CREATE INDEX IF NOT EXISTS groups_created_by_idx ON groups(created_by);
CREATE INDEX IF NOT EXISTS messages_channel_id_idx ON messages(channel_id);
CREATE INDEX IF NOT EXISTS messages_sender_id_idx ON messages(sender_id);
CREATE INDEX IF NOT EXISTS messages_replying_to_id_idx ON messages(replying_to_id);
CREATE INDEX IF NOT EXISTS messages_thread_id_idx ON messages(thread_id);
CREATE INDEX IF NOT EXISTS messages_created_at_idx ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS reactions_message_id_idx ON reactions(message_id);
CREATE INDEX IF NOT EXISTS reactions_user_id_idx ON reactions(user_id);

-- Create search indexes
CREATE INDEX IF NOT EXISTS messages_search_idx ON messages USING gin(to_tsvector('english'::regconfig, content));
CREATE INDEX IF NOT EXISTS users_name_trgm_idx ON users USING gin(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS channels_name_trgm_idx ON channels USING gin(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS groups_name_trgm_idx ON groups USING gin(name gin_trgm_ops);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE groups;
ALTER PUBLICATION supabase_realtime ADD TABLE group_members;
ALTER PUBLICATION supabase_realtime ADD TABLE channels;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE channel_members;
ALTER PUBLICATION supabase_realtime ADD TABLE reactions;

-- Create profiles for any existing auth users
INSERT INTO public.users (id, email, name)
SELECT 
  id,
  email,
  COALESCE(raw_user_meta_data->>'name', email) as name
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- RLS Policies (commented out for now)
/*
-- Users policies
CREATE POLICY "Users can insert their own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view all profiles" ON users
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Groups policies
CREATE POLICY "Users can view accessible groups" ON groups
  FOR SELECT USING (
    visibility = 'public' OR
    EXISTS (
      SELECT 1 FROM group_members 
      WHERE group_members.group_id = id 
      AND group_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create groups" ON groups
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Group owners and admins can update groups" ON groups
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM group_members 
      WHERE group_members.group_id = id 
      AND group_members.user_id = auth.uid()
      AND group_members.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Group owners can delete groups" ON groups
  FOR DELETE USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM group_members 
      WHERE group_members.group_id = id 
      AND group_members.user_id = auth.uid()
      AND group_members.role = 'owner'
    )
  );

-- Group members policies
CREATE POLICY "Users can view group members of accessible groups" ON group_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM groups
      WHERE groups.id = group_id
      AND (
        groups.visibility = 'public'
        OR EXISTS (
          SELECT 1 FROM group_members gm
          WHERE gm.group_id = groups.id
          AND gm.user_id = auth.uid()
        )
      )
    )
  );

-- Channels policies
CREATE POLICY "Users can view accessible channels" ON channels
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = channels.group_id
      AND group_members.user_id = auth.uid()
      AND (
        channels.visibility = 'public'
        OR EXISTS (
          SELECT 1 FROM channel_members 
          WHERE channel_members.channel_id = channels.id 
          AND channel_members.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Group members can create channels" ON channels
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = NEW.group_id
      AND group_members.user_id = auth.uid()
      AND group_members.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Channel owners and admins can update channels" ON channels
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM channel_members 
      WHERE channel_members.channel_id = id 
      AND channel_members.user_id = auth.uid()
      AND channel_members.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Channel owners can delete channels" ON channels
  FOR DELETE USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM channel_members 
      WHERE channel_members.channel_id = id 
      AND channel_members.user_id = auth.uid()
      AND channel_members.role = 'owner'
    )
  );

-- Messages policies
CREATE POLICY "Users can view messages in their channels" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM channels
      JOIN group_members ON channels.group_id = group_members.group_id
      WHERE channels.id = channel_id
      AND group_members.user_id = auth.uid()
      AND (
        channels.visibility = 'public'
        OR EXISTS (
          SELECT 1 FROM channel_members
          WHERE channel_members.channel_id = channels.id
          AND channel_members.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can create messages in their channels" ON messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM channel_members
      WHERE channel_members.channel_id = channel_id
      AND channel_members.user_id = auth.uid()
    )
    AND auth.uid() = sender_id
  );

CREATE POLICY "Users can manage their own messages" ON messages
  FOR UPDATE USING (sender_id = auth.uid());

CREATE POLICY "Users can delete messages they own or if they are channel admin" ON messages
  FOR DELETE USING (
    sender_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM channel_members 
      WHERE channel_members.channel_id = messages.channel_id 
      AND channel_members.user_id = auth.uid()
      AND channel_members.role IN ('owner', 'admin')
    )
  );

-- Reactions policies
CREATE POLICY "Users can view reactions in their channels" ON reactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM messages 
      JOIN channels ON messages.channel_id = channels.id
      WHERE messages.id = message_id 
      AND (
        channels.visibility = 'public'
        OR EXISTS (
          SELECT 1 FROM channel_members
          WHERE channel_members.channel_id = channels.id
          AND channel_members.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can manage their own reactions" ON reactions
  FOR ALL USING (user_id = auth.uid());
*/

-- Create function to enforce thread base message rules
CREATE OR REPLACE FUNCTION check_thread_base_message()
RETURNS TRIGGER AS $$
BEGIN
  -- If this message is a thread base (has messages pointing to it as thread_id)
  -- then it cannot itself be in a thread
  IF EXISTS (
    SELECT 1 FROM messages 
    WHERE thread_id = NEW.id
  ) AND NEW.thread_id IS NOT NULL THEN
    RAISE EXCEPTION 'Thread base messages cannot be in a thread themselves';
  END IF;

  -- If this message is being added to a thread, ensure the thread base exists
  -- and is not itself in a thread
  IF NEW.thread_id IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM messages 
      WHERE id = NEW.thread_id 
      AND thread_id IS NOT NULL
    ) THEN
      RAISE EXCEPTION 'Cannot add message to a thread whose base message is in another thread';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to enforce thread base message rules
CREATE TRIGGER enforce_thread_base_message_rules
  BEFORE INSERT OR UPDATE ON messages
  FOR EACH ROW
  EXECUTE FUNCTION check_thread_base_message();

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  (
    'attachments',
    'attachments',
    true,
    100 * 1024 * 1024, -- 100MB for attachments
    ARRAY[
      'image/*',
      'video/*',
      'audio/*',
      'application/pdf',
      'text/*',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ]::text[]
  ),
  (
    'avatars',
    'avatars',
    true,
    5 * 1024 * 1024, -- 5MB for avatars
    ARRAY['image/*']::text[]
  )
ON CONFLICT (id) DO 
  UPDATE SET 
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create file_metadata table
CREATE TABLE file_metadata (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  file_path TEXT NOT NULL,
  bucket TEXT NOT NULL,
  size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  original_name TEXT NOT NULL,
  channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS
ALTER TABLE file_metadata ENABLE ROW LEVEL SECURITY;

-- File metadata policies
CREATE POLICY "Users can view files in their channels"
  ON file_metadata
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM channel_members 
      WHERE channel_members.channel_id = file_metadata.channel_id 
      AND channel_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can upload files to their channels"
  ON file_metadata
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM channel_members 
      WHERE channel_members.channel_id = file_metadata.channel_id 
      AND channel_members.user_id = auth.uid()
    )
    AND auth.uid() = uploaded_by
  );

CREATE POLICY "Users can delete their own files"
  ON file_metadata
  FOR DELETE
  USING (uploaded_by = auth.uid());

-- Storage bucket policies
CREATE POLICY "Users can read files from their channels"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id IN ('attachments', 'avatars')
    AND (
      CASE 
        WHEN bucket_id = 'attachments' THEN
          EXISTS (
            SELECT 1 FROM file_metadata
            JOIN channel_members ON file_metadata.channel_id = channel_members.channel_id
            WHERE file_metadata.file_path = name
            AND channel_members.user_id = auth.uid()
          )
        WHEN bucket_id = 'avatars' THEN
          -- Anyone can view avatars
          true
        ELSE
          false
      END
    )
  );

CREATE POLICY "Users can upload files"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id IN ('attachments', 'avatars')
    AND (
      CASE
        WHEN bucket_id = 'attachments' THEN
          -- Allow authenticated users to upload to attachments bucket
          auth.role() = 'authenticated'
        WHEN bucket_id = 'avatars' THEN
          -- Users can only upload their own avatar
          (regexp_split_to_array(name, '/'))[1] = auth.uid()::text
        ELSE
          false
      END
    )
  );

CREATE POLICY "Users can delete their own files"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id IN ('attachments', 'avatars')
    AND (
      CASE
        WHEN bucket_id = 'attachments' THEN
          EXISTS (
            SELECT 1 FROM file_metadata
            WHERE file_metadata.file_path = name
            AND file_metadata.uploaded_by = auth.uid()
          )
        WHEN bucket_id = 'avatars' THEN
          -- Users can only delete their own avatar
          (regexp_split_to_array(name, '/'))[1] = auth.uid()::text
        ELSE
          false
      END
    )
  );

-- Create function to add group creator as owner
CREATE OR REPLACE FUNCTION add_group_creator_as_owner()
RETURNS TRIGGER AS $$
BEGIN
  -- Only add owner if created_by is set
  IF NEW.created_by IS NOT NULL THEN
    INSERT INTO group_members (group_id, user_id, role)
    VALUES (NEW.id, NEW.created_by, 'owner')
    ON CONFLICT (group_id, user_id) DO UPDATE SET role = 'owner';
  ELSE
    RAISE EXCEPTION 'created_by must be set when creating a group';
  END IF;
  RETURN NEW;
END;
$$ language plpgsql security definer;

-- Create trigger to add group creator as owner
CREATE TRIGGER add_group_creator_as_owner
  AFTER INSERT ON groups
  FOR EACH ROW
  EXECUTE FUNCTION add_group_creator_as_owner();

-- Create function to check group member limit
CREATE OR REPLACE FUNCTION check_group_member_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF (
    SELECT COUNT(*) 
    FROM group_members 
    WHERE group_id = NEW.group_id
  ) >= 10000 THEN
    RAISE EXCEPTION 'Group member limit reached (10000 members)';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to enforce group member limit
CREATE TRIGGER enforce_group_member_limit
  BEFORE INSERT ON group_members
  FOR EACH ROW
  EXECUTE FUNCTION check_group_member_limit();

-- Create presence table
CREATE TABLE IF NOT EXISTS presence (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('online', 'idle', 'dnd', 'offline')) DEFAULT 'online',
  custom_status TEXT CHECK (char_length(custom_status) <= 100),
  last_active TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS on presence
ALTER TABLE presence ENABLE ROW LEVEL SECURITY;

-- Presence policies
CREATE POLICY "Users can view all presence statuses" ON presence
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own presence" ON presence
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own presence" ON presence
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Add presence to realtime
ALTER PUBLICATION supabase_realtime ADD TABLE presence;

-- Create function to ensure presence record exists
CREATE OR REPLACE FUNCTION ensure_user_presence()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.presence (user_id, status)
  VALUES (NEW.id, 'online')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ language plpgsql security definer;

-- Create trigger to create presence record on user creation
DROP TRIGGER IF EXISTS on_auth_user_presence ON auth.users;
CREATE TRIGGER on_auth_user_presence
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION ensure_user_presence();

-- Create presence records for existing users
INSERT INTO public.presence (user_id, status)
SELECT id, 'offline' FROM auth.users
ON CONFLICT (user_id) DO NOTHING;