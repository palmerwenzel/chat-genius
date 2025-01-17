-- Add display_name column to groups table
ALTER TABLE groups ADD COLUMN display_name TEXT CHECK (char_length(display_name) <= 100);

-- Update existing groups to set display_name to current name
UPDATE groups SET display_name = name WHERE display_name IS NULL;

-- Make display_name NOT NULL after populating data
ALTER TABLE groups ALTER COLUMN display_name SET NOT NULL;

-- Add an index for faster lookups
CREATE INDEX idx_groups_name ON groups(name);
CREATE INDEX idx_groups_display_name ON groups(display_name);

-- Update the schema version
COMMENT ON TABLE groups IS 'Groups that contain channels. Schema version: 2'; 