-- Enable the pg_trgm extension for trigram matching
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Add generated columns for messages
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS fts tsvector 
GENERATED ALWAYS AS (
  to_tsvector('english', regexp_replace(content, '[^\w\s]', ' ', 'g'))
) STORED;

CREATE INDEX IF NOT EXISTS messages_fts ON messages USING GIN (fts);

-- Add generated columns for channels
ALTER TABLE channels 
ADD COLUMN IF NOT EXISTS fts tsvector 
GENERATED ALWAYS AS (
  setweight(to_tsvector('english', coalesce(name, '')), 'A') || 
  setweight(to_tsvector('english', coalesce(description, '')), 'B')
) STORED;

CREATE INDEX IF NOT EXISTS channels_fts ON channels USING GIN (fts);