# Row Level Security (RLS) Policies

## Overview

All tables have RLS enabled. Each policy defines who can perform specific operations (SELECT, INSERT, UPDATE, DELETE) on rows in the table.

## User Policies

### SELECT Policies
- "Users can view all profiles"
  ```sql
  USING (true)
  ```
  Allows all authenticated users to view user profiles.

### INSERT Policies
- "Users can insert their own profile"
  ```sql
  WITH CHECK (auth.uid() = id)
  ```
  Users can only create their own profile.

### UPDATE Policies
- "Users can update their own profile"
  ```sql
  USING (auth.uid() = id)
  ```
  Users can only update their own profile.

## Channel Policies

### SELECT Policies
- "Users can view accessible channels"
  ```sql
  USING (
    visibility = 'public' OR
    EXISTS (
      SELECT 1 FROM channel_members 
      WHERE channel_members.channel_id = id 
      AND channel_members.user_id = auth.uid()
    )
  )
  ```
  Users can view public channels and channels they are members of.

### INSERT Policies
- "Users can create channels"
  ```sql
  WITH CHECK (auth.uid() IS NOT NULL)
  ```
  Any authenticated user can create channels.

### UPDATE Policies
- "Channel owners and admins can update channels"
  ```sql
  USING (
    EXISTS (
      SELECT 1 FROM channel_members 
      WHERE channel_members.channel_id = id 
      AND channel_members.user_id = auth.uid()
      AND channel_members.role IN ('owner', 'admin')
    )
  )
  ```
  Only channel owners and admins can update channel details.

### DELETE Policies
- "Channel owners can delete channels"
  ```sql
  USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM channel_members 
      WHERE channel_members.channel_id = id 
      AND channel_members.user_id = auth.uid()
      AND channel_members.role = 'owner'
    )
  )
  ```
  Channel creator or owners can delete channels.

## Channel Members Policies

### SELECT Policies
- "Users can view channel members of their channels"
  ```sql
  USING (
    EXISTS (
      SELECT 1 FROM channel_members AS cm 
      WHERE cm.channel_id = channel_id 
      AND cm.user_id = auth.uid()
    )
  )
  ```
  Users can view member lists of channels they belong to.

### INSERT/UPDATE Policies
- "Channel owners and admins can manage members"
  ```sql
  USING (
    EXISTS (
      SELECT 1 FROM channel_members 
      WHERE channel_members.channel_id = channel_id 
      AND channel_members.user_id = auth.uid()
      AND channel_members.role IN ('owner', 'admin')
    )
  )
  ```
  Channel owners and admins can add/update members.

### DELETE Policies
- "Users can remove themselves from channels"
  ```sql
  USING (user_id = auth.uid())
  ```
  Users can leave channels they are members of.

- "Admins can remove non-owner members"
  ```sql
  USING (
    EXISTS (
      SELECT 1 FROM channel_members AS cm
      WHERE cm.channel_id = channel_members.channel_id
      AND cm.user_id = auth.uid()
      AND cm.role IN ('owner', 'admin')
    )
    AND (
      SELECT role FROM channel_members AS target
      WHERE target.channel_id = channel_members.channel_id
      AND target.user_id = channel_members.user_id
    ) != 'owner'
  )
  ```
  Admins can remove members but not owners.

## Message Policies

### SELECT Policies
- "Users can view messages in their channels"
  ```sql
  USING (
    EXISTS (
      SELECT 1 FROM channel_members 
      WHERE channel_members.channel_id = channel_id 
      AND channel_members.user_id = auth.uid()
    )
  )
  ```
  Users can view messages in channels they are members of.

### INSERT Policies
- "Users can create messages in their channels"
  ```sql
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM channel_members 
      WHERE channel_members.channel_id = channel_id 
      AND channel_members.user_id = auth.uid()
    )
    AND auth.uid() = sender_id
  )
  ```
  Users can send messages in channels they are members of.

### UPDATE/DELETE Policies
- "Users can manage their own messages"
  ```sql
  USING (sender_id = auth.uid())
  ```
  Users can edit/delete their own messages.

## Reaction Policies

### SELECT Policies
- "Users can view reactions in their channels"
  ```sql
  USING (
    EXISTS (
      SELECT 1 FROM messages 
      JOIN channel_members ON messages.channel_id = channel_members.channel_id 
      WHERE messages.id = message_id 
      AND channel_members.user_id = auth.uid()
    )
  )
  ```
  Users can see reactions in channels they are members of.

### ALL Policies
- "Users can manage their own reactions"
  ```sql
  USING (user_id = auth.uid())
  ```
  Users can add/remove their own reactions.

## Helper Functions

### is_channel_member
```sql
CREATE OR REPLACE FUNCTION public.is_channel_member(channel_id uuid, user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM channel_members
    WHERE channel_members.channel_id = $1
    AND channel_members.user_id = $2
  );
END;
$$ language plpgsql security definer;
```

### is_channel_admin
```sql
CREATE OR REPLACE FUNCTION public.is_channel_admin(channel_id uuid, user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM channel_members
    WHERE channel_members.channel_id = $1
    AND channel_members.user_id = $2
    AND channel_members.role IN ('owner', 'admin')
  );
END;
$$ language plpgsql security definer;
``` 