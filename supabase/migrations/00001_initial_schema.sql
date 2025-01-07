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

-- Create channels table
CREATE TABLE IF NOT EXISTS channels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
  thread_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
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
CREATE INDEX IF NOT EXISTS messages_channel_id_idx ON messages(channel_id);
CREATE INDEX IF NOT EXISTS messages_sender_id_idx ON messages(sender_id);
CREATE INDEX IF NOT EXISTS messages_thread_id_idx ON messages(thread_id);
CREATE INDEX IF NOT EXISTS messages_created_at_idx ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS reactions_message_id_idx ON reactions(message_id);
CREATE INDEX IF NOT EXISTS reactions_user_id_idx ON reactions(user_id);

-- Create search indexes
CREATE INDEX IF NOT EXISTS messages_search_idx ON messages USING gin(to_tsvector('english'::regconfig, content));
CREATE INDEX IF NOT EXISTS users_name_trgm_idx ON users USING gin(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS channels_name_trgm_idx ON channels USING gin(name gin_trgm_ops);

-- Enable realtime
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

-- Channels policies
CREATE POLICY "Users can view accessible channels" ON channels
  FOR SELECT USING (
    visibility = 'public' OR
    EXISTS (
      SELECT 1 FROM channel_members 
      WHERE channel_members.channel_id = id 
      AND channel_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create channels" ON channels
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

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
      WHERE channels.id = channel_id
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
  FOR ALL USING (sender_id = auth.uid());

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