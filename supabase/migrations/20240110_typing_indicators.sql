-- Create channel_typing table
CREATE TABLE IF NOT EXISTS channel_typing (
  channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  is_typing BOOLEAN DEFAULT false,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  PRIMARY KEY (channel_id, user_id)
);

-- Enable RLS
ALTER TABLE channel_typing ENABLE ROW LEVEL SECURITY;

-- Channel typing policies
CREATE POLICY "Users can view typing status in their channels" ON channel_typing
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM channel_members 
      WHERE channel_members.channel_id = channel_typing.channel_id 
      AND channel_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own typing status" ON channel_typing
  FOR ALL USING (auth.uid() = user_id);

-- Add to realtime
ALTER PUBLICATION supabase_realtime ADD TABLE channel_typing;

-- Create function to clean up old typing indicators
CREATE OR REPLACE FUNCTION cleanup_typing_indicators()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete typing indicators older than 10 seconds
  DELETE FROM channel_typing
  WHERE updated_at < NOW() - INTERVAL '10 seconds';
  RETURN NULL;
END;
$$ language plpgsql security definer;

-- Create trigger to clean up old typing indicators
CREATE TRIGGER cleanup_typing_indicators
  AFTER INSERT OR UPDATE ON channel_typing
  FOR EACH STATEMENT
  EXECUTE FUNCTION cleanup_typing_indicators(); 