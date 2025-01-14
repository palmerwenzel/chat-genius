-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can create channels" ON channels;
DROP POLICY IF EXISTS "Users can view their channels" ON channels;
DROP POLICY IF EXISTS "Channel owners and admins can update channels" ON channels;
DROP POLICY IF EXISTS "Channel owners can delete channels" ON channels;

-- Allow authenticated users to create channels
CREATE POLICY "Users can create channels"
ON channels
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Allow users to view channels they are members of
CREATE POLICY "Users can view their channels"
ON channels
FOR SELECT
USING (
  EXISTS (
    SELECT 1 
    FROM channel_members 
    WHERE channel_members.channel_id = id 
    AND channel_members.user_id = auth.uid()
  )
);

-- Allow channel owners and admins to update their channels
CREATE POLICY "Channel owners and admins can update channels"
ON channels
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 
    FROM channel_members 
    WHERE channel_members.channel_id = id 
    AND channel_members.user_id = auth.uid()
    AND channel_members.role IN ('owner', 'admin')
  )
);

-- Allow channel owners to delete their channels
CREATE POLICY "Channel owners can delete channels"
ON channels
FOR DELETE
USING (
  EXISTS (
    SELECT 1 
    FROM channel_members 
    WHERE channel_members.channel_id = id 
    AND channel_members.user_id = auth.uid()
    AND channel_members.role = 'owner'
  )
); 