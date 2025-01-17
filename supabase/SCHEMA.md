# Database Schema Reference

## Tables

### users
User profiles and authentication data.

| Column      | Type                    | Constraints                                    | Description                    |
|-------------|-------------------------|-----------------------------------------------|--------------------------------|
| id          | UUID                    | PRIMARY KEY, REFERENCES auth.users(id)        | Unique identifier              |
| email       | TEXT                    | NOT NULL, LENGTH <= 255                       | User's email address           |
| name        | TEXT                    | NOT NULL, LENGTH <= 100                       | Display name                   |
| avatar_url  | TEXT                    | NULL                                          | Profile picture URL            |
| created_at  | TIMESTAMP WITH TIME ZONE| NOT NULL, DEFAULT NOW()                       | Account creation timestamp     |
| updated_at  | TIMESTAMP WITH TIME ZONE| NOT NULL, DEFAULT NOW()                       | Last update timestamp          |

### groups
Groups that contain channels.

| Column      | Type                    | Constraints                                    | Description                    |
|-------------|-------------------------|-----------------------------------------------|--------------------------------|
| id          | UUID                    | PRIMARY KEY, DEFAULT uuid_generate_v4()       | Unique identifier              |
| name        | TEXT                    | NOT NULL, LENGTH <= 100                       | URL-friendly name              |
| display_name | TEXT                   | NOT NULL, LENGTH <= 100                       | Display name                   |
| description | TEXT                    | NULL, LENGTH <= 1000                          | Group description              |
| visibility  | TEXT                    | CHECK (IN ('public', 'private')), DEFAULT 'private' | Group visibility         |
| created_by  | UUID                    | REFERENCES users(id) ON DELETE SET NULL       | Creator's user ID             |
| created_at  | TIMESTAMP WITH TIME ZONE| NOT NULL, DEFAULT NOW()                       | Creation timestamp             |
| updated_at  | TIMESTAMP WITH TIME ZONE| NOT NULL, DEFAULT NOW()                       | Last update timestamp          |

### group_members
Membership and roles within groups.

| Column      | Type                    | Constraints                                    | Description                    |
|-------------|-------------------------|-----------------------------------------------|--------------------------------|
| group_id    | UUID                    | REFERENCES groups(id) ON DELETE CASCADE       | Group ID                       |
| user_id     | UUID                    | REFERENCES users(id) ON DELETE CASCADE        | User ID                        |
| role        | TEXT                    | CHECK (IN ('owner', 'admin', 'member'))       | User's role in group           |
| created_at  | TIMESTAMP WITH TIME ZONE| NOT NULL, DEFAULT NOW()                       | Membership timestamp           |
| PRIMARY KEY | (group_id, user_id)                                                     | Composite key                  |

### channels
Chat channels where messages are exchanged.

| Column      | Type                    | Constraints                                    | Description                    |
|-------------|-------------------------|-----------------------------------------------|--------------------------------|
| id          | UUID                    | PRIMARY KEY, DEFAULT uuid_generate_v4()       | Unique identifier              |
| group_id    | UUID                    | NOT NULL, REFERENCES groups(id)               | Parent group ID                |
| name        | TEXT                    | NOT NULL, LENGTH <= 100                       | Channel name                   |
| type        | TEXT                    | CHECK (IN ('text', 'voice')), DEFAULT 'text'  | Channel type                   |
| visibility  | TEXT                    | CHECK (IN ('public', 'private')), DEFAULT 'private' | Channel visibility       |
| description | TEXT                    | NULL, LENGTH <= 1000                          | Channel description            |
| created_by  | UUID                    | REFERENCES users(id) ON DELETE SET NULL       | Creator's user ID             |
| created_at  | TIMESTAMP WITH TIME ZONE| NOT NULL, DEFAULT NOW()                       | Creation timestamp             |
| updated_at  | TIMESTAMP WITH TIME ZONE| NOT NULL, DEFAULT NOW()                       | Last update timestamp          |
| fts         | TSVECTOR                | GENERATED ALWAYS AS (...)                     | Full-text search vector        |

### channel_members
Membership and roles within channels. Limited to 1000 members per channel.

| Column      | Type                    | Constraints                                    | Description                    |
|-------------|-------------------------|-----------------------------------------------|--------------------------------|
| channel_id  | UUID                    | REFERENCES channels(id) ON DELETE CASCADE     | Channel ID                     |
| user_id     | UUID                    | REFERENCES users(id) ON DELETE CASCADE        | User ID                        |
| role        | TEXT                    | CHECK (IN ('owner', 'admin', 'member'))       | User's role in channel         |
| created_at  | TIMESTAMP WITH TIME ZONE| NOT NULL, DEFAULT NOW()                       | Membership timestamp           |
| PRIMARY KEY | (channel_id, user_id)                                                   | Composite key                  |

### messages
Individual messages within channels.

| Column         | Type                    | Constraints                                    | Description                    |
|----------------|-------------------------|-----------------------------------------------|--------------------------------|
| id             | UUID                    | PRIMARY KEY, DEFAULT uuid_generate_v4()       | Unique identifier              |
| channel_id     | UUID                    | REFERENCES channels(id) ON DELETE CASCADE     | Parent channel ID              |
| sender_id      | UUID                    | REFERENCES users(id) ON DELETE SET NULL       | Message author's ID            |
| content        | TEXT                    | NOT NULL, LENGTH <= 4000                      | Message content                |
| type           | TEXT                    | CHECK (IN ('text', 'code')), DEFAULT 'text'   | Message format type            |
| metadata       | JSONB                   | DEFAULT '{}'                                  | Additional message data        |
| replying_to_id | UUID                    | REFERENCES messages(id) ON DELETE SET NULL    | Message being replied to       |
| thread_id      | UUID                    | REFERENCES messages(id) ON DELETE CASCADE     | Parent message ID for threads  |
| created_at     | TIMESTAMP WITH TIME ZONE| NOT NULL, DEFAULT NOW()                       | Creation timestamp             |
| updated_at     | TIMESTAMP WITH TIME ZONE| NOT NULL, DEFAULT NOW()                       | Last update timestamp          |
| deleted_at     | TIMESTAMP WITH TIME ZONE| NULL                                          | Soft delete timestamp          |
| fts            | TSVECTOR                | GENERATED ALWAYS AS (...)                     | Full-text search vector        |

### reactions
Emoji reactions to messages. Limited to 100 reactions per message.

| Column      | Type                    | Constraints                                    | Description                    |
|-------------|-------------------------|-----------------------------------------------|--------------------------------|
| id          | UUID                    | PRIMARY KEY, DEFAULT uuid_generate_v4()       | Unique identifier              |
| message_id  | UUID                    | REFERENCES messages(id) ON DELETE CASCADE     | Target message ID              |
| user_id     | UUID                    | REFERENCES users(id) ON DELETE CASCADE        | Reactor's user ID             |
| emoji       | TEXT                    | NOT NULL, LENGTH <= 20                        | Emoji content                  |
| created_at  | TIMESTAMP WITH TIME ZONE| NOT NULL, DEFAULT NOW()                       | Reaction timestamp             |
| UNIQUE      | (message_id, user_id, emoji)                                           | Prevent duplicate reactions    |

### file_metadata
Metadata for uploaded files.

| Column      | Type                    | Constraints                                    | Description                    |
|-------------|-------------------------|-----------------------------------------------|--------------------------------|
| id          | UUID                    | PRIMARY KEY, DEFAULT uuid_generate_v4()       | Unique identifier              |
| name        | TEXT                    | NOT NULL                                      | Original file name             |
| size        | BIGINT                  | NOT NULL                                      | File size in bytes             |
| mime_type   | TEXT                    | NOT NULL                                      | MIME type                      |
| storage_key | TEXT                    | NOT NULL                                      | Storage bucket key             |
| created_by  | UUID                    | REFERENCES users(id) ON DELETE SET NULL       | Uploader's user ID            |
| created_at  | TIMESTAMP WITH TIME ZONE| NOT NULL, DEFAULT NOW()                       | Upload timestamp               |

### presence
User presence information.

| Column      | Type                    | Constraints                                    | Description                    |
|-------------|-------------------------|-----------------------------------------------|--------------------------------|
| user_id     | UUID                    | PRIMARY KEY, REFERENCES users(id)             | User ID                        |
| status      | TEXT                    | CHECK (IN ('online', 'offline', 'idle', 'dnd'))| User's presence status       |
| last_seen   | TIMESTAMP WITH TIME ZONE| NOT NULL, DEFAULT NOW()                       | Last activity timestamp        |

## Enums and Valid Values

### User Status
- `online`: User is currently active
- `offline`: User is not connected
- `idle`: User is inactive
- `dnd`: Do not disturb

### Channel Types
- `text`: Text-based chat channel
- `voice`: Voice/video channel

### Channel/Group Visibility
- `public`: Visible to all users
- `private`: Visible only to members

### Message Types
- `text`: Regular text message

### Member Roles
- `owner`: Channel/group creator with full permissions
- `admin`: Channel/group administrator
- `member`: Regular channel/group member

## Resource Limits

1. **Users**:
   - Name: 100 characters
   - Email: 255 characters

2. **Groups/Channels**:
   - Name: 100 characters
   - Description: 1000 characters
   - Channel Members: 1000 per channel

3. **Messages**:
   - Content: 4000 characters
   - Reactions: 100 per message

4. **Reactions**:
   - Emoji: 20 characters

## Indexes

1. **Full-Text Search Indexes**:
   ```sql
   CREATE INDEX messages_fts ON messages USING GIN (fts);
   CREATE INDEX channels_fts ON channels USING GIN (fts);
   CREATE INDEX users_name_trgm_idx ON users USING gin(name gin_trgm_ops);
   CREATE INDEX channels_name_trgm_idx ON channels USING gin(name gin_trgm_ops);
   CREATE INDEX groups_name_trgm_idx ON groups USING gin(name gin_trgm_ops);
   ```

2. **Performance Indexes**:
   ```sql
   CREATE INDEX users_email_idx ON users(email);
   CREATE INDEX channels_created_by_idx ON channels(created_by);
   CREATE INDEX channels_group_id_idx ON channels(group_id);
   CREATE INDEX groups_created_by_idx ON groups(created_by);
   CREATE INDEX messages_channel_id_idx ON messages(channel_id);
   CREATE INDEX messages_sender_id_idx ON messages(sender_id);
   CREATE INDEX messages_replying_to_id_idx ON messages(replying_to_id);
   CREATE INDEX messages_thread_id_idx ON messages(thread_id);
   CREATE INDEX messages_created_at_idx ON messages(created_at DESC);
   CREATE INDEX reactions_message_id_idx ON reactions(message_id);
   CREATE INDEX reactions_user_id_idx ON reactions(user_id);
   ```

## Triggers

1. **Updated At Timestamp**:
   - Automatically updates `updated_at` column on any row modification
   - Applied to: users, groups, channels, messages

2. **Channel Creation**:
   - Automatically adds creator as channel owner
   - Applied to: channels

3. **Member Limit**:
   - Enforces maximum of 1000 members per channel
   - Applied to: channel_members

4. **Reaction Limit**:
   - Enforces maximum of 100 reactions per message
   - Applied to: reactions

5. **Thread Base Message**:
   - Ensures thread_id references a valid base message
   - Applied to: messages

6. **User Profile Creation**:
   - Creates user profile on auth.users insert
   - Applied to: users

7. **User Presence**:
   - Creates presence record on user creation
   - Applied to: users

## Row Level Security (RLS)

See [RLS_POLICIES.md](./RLS_POLICIES.md) for detailed security policies. 