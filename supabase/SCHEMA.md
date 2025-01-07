# Database Schema Reference

## Tables

### users
User profiles and authentication data.

| Column      | Type                    | Constraints                                    | Description                    |
|-------------|-------------------------|-----------------------------------------------|--------------------------------|
| id          | UUID                    | PRIMARY KEY, DEFAULT uuid_generate_v4()       | Unique identifier              |
| email       | TEXT                    | UNIQUE, NOT NULL, LENGTH <= 255               | User's email address           |
| name        | TEXT                    | NULL, LENGTH <= 50                            | Display name                   |
| avatar_url  | TEXT                    | NULL                                          | Profile picture URL            |
| status      | TEXT                    | CHECK (IN ('online', 'offline', 'idle', 'dnd'))| User's presence status       |
| last_seen   | TIMESTAMP WITH TIME ZONE| NOT NULL, DEFAULT NOW()                       | Last activity timestamp        |
| created_at  | TIMESTAMP WITH TIME ZONE| NOT NULL, DEFAULT NOW()                       | Account creation timestamp     |
| updated_at  | TIMESTAMP WITH TIME ZONE| NOT NULL, DEFAULT NOW()                       | Last update timestamp          |

### channels
Chat channels where messages are exchanged.

| Column      | Type                    | Constraints                                    | Description                    |
|-------------|-------------------------|-----------------------------------------------|--------------------------------|
| id          | UUID                    | PRIMARY KEY, DEFAULT uuid_generate_v4()       | Unique identifier              |
| name        | TEXT                    | NOT NULL, LENGTH <= 100                       | Channel name                   |
| type        | TEXT                    | CHECK (IN ('text', 'voice')), DEFAULT 'text'  | Channel type                   |
| visibility  | TEXT                    | CHECK (IN ('public', 'private')), DEFAULT 'private' | Channel visibility       |
| description | TEXT                    | NULL, LENGTH <= 1000                          | Channel description/topic      |
| created_by  | UUID                    | REFERENCES users(id) ON DELETE SET NULL       | Creator's user ID             |
| created_at  | TIMESTAMP WITH TIME ZONE| NOT NULL, DEFAULT NOW()                       | Creation timestamp             |
| updated_at  | TIMESTAMP WITH TIME ZONE| NOT NULL, DEFAULT NOW()                       | Last update timestamp          |

### messages
Individual messages within channels.

| Column      | Type                    | Constraints                                    | Description                    |
|-------------|-------------------------|-----------------------------------------------|--------------------------------|
| id          | UUID                    | PRIMARY KEY, DEFAULT uuid_generate_v4()       | Unique identifier              |
| channel_id  | UUID                    | REFERENCES channels(id) ON DELETE CASCADE     | Parent channel ID              |
| sender_id   | UUID                    | REFERENCES users(id) ON DELETE SET NULL       | Message author's ID            |
| content     | TEXT                    | NOT NULL, LENGTH <= 4000                      | Message content                |
| type        | TEXT                    | CHECK (IN ('text', 'code')), DEFAULT 'text'   | Message format type            |
| metadata    | JSONB                   | DEFAULT '{}'                                  | Additional message data        |
| thread_id   | UUID                    | REFERENCES messages(id) ON DELETE CASCADE     | Parent message ID for threads  |
| created_at  | TIMESTAMP WITH TIME ZONE| NOT NULL, DEFAULT NOW()                       | Creation timestamp             |
| updated_at  | TIMESTAMP WITH TIME ZONE| NOT NULL, DEFAULT NOW()                       | Last update timestamp          |

### channel_members
Membership and roles within channels. Limited to 1000 members per channel.

| Column      | Type                    | Constraints                                    | Description                    |
|-------------|-------------------------|-----------------------------------------------|--------------------------------|
| channel_id  | UUID                    | REFERENCES channels(id) ON DELETE CASCADE     | Channel ID                     |
| user_id     | UUID                    | REFERENCES users(id) ON DELETE CASCADE        | User ID                        |
| role        | TEXT                    | CHECK (IN ('owner', 'admin', 'member'))       | User's role in channel         |
| created_at  | TIMESTAMP WITH TIME ZONE| NOT NULL, DEFAULT NOW()                       | Membership timestamp           |
| PRIMARY KEY | (channel_id, user_id)                                                   | Composite key                  |

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

## Enums and Valid Values

### User Status
- `online`: User is currently active
- `offline`: User is not connected
- `idle`: User is inactive
- `dnd`: Do not disturb

### Channel Types
- `text`: Text-based chat channel
- `voice`: Voice/video channel

### Channel Visibility
- `public`: Visible to all users
- `private`: Visible only to members

### Message Types
- `text`: Regular text message
- `code`: Code block with syntax highlighting

### Member Roles
- `owner`: Channel creator with full permissions
- `admin`: Channel administrator
- `member`: Regular channel member

## Resource Limits

1. **Users**:
   - Name: 50 characters
   - Email: 255 characters

2. **Channels**:
   - Name: 100 characters
   - Description: 1000 characters
   - Members: 1000 per channel

3. **Messages**:
   - Content: 4000 characters
   - Reactions: 100 per message

4. **Reactions**:
   - Emoji: 20 characters

## Indexes

1. **Primary Search Indexes**:
   ```sql
   CREATE INDEX messages_search_idx ON messages USING gist(to_tsvector('english'::regconfig, content));
   CREATE INDEX users_name_trgm_idx ON users USING gin(name gin_trgm_ops);
   CREATE INDEX channels_name_trgm_idx ON channels USING gin(name gin_trgm_ops);
   ```

2. **Performance Indexes**:
   ```sql
   CREATE INDEX users_email_idx ON users(email);
   CREATE INDEX channels_created_by_idx ON channels(created_by);
   CREATE INDEX messages_channel_id_idx ON messages(channel_id);
   CREATE INDEX messages_sender_id_idx ON messages(sender_id);
   CREATE INDEX messages_thread_id_idx ON messages(thread_id);
   CREATE INDEX messages_created_at_idx ON messages(created_at DESC);
   CREATE INDEX reactions_message_id_idx ON reactions(message_id);
   CREATE INDEX reactions_user_id_idx ON reactions(user_id);
   ```

## Triggers

1. Updated At Timestamp:
   - Automatically updates `updated_at` column on any row modification
   - Applied to: users, channels, messages

2. Channel Creation:
   - Automatically adds creator as channel owner
   - Applied to: channels

3. Member Limit:
   - Enforces maximum of 1000 members per channel
   - Applied to: channel_members

4. Reaction Limit:
   - Enforces maximum of 100 reactions per message
   - Applied to: reactions

## Row Level Security (RLS)

See [RLS_POLICIES.md](./RLS_POLICIES.md) for detailed security policies. 