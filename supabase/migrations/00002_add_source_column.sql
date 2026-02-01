-- Add source column to distinguish seed data from API data
ALTER TABLE supports ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'seed';

-- Update existing seed data
UPDATE supports SET source = 'seed' WHERE source IS NULL OR source = 'seed';

-- Index for filtering by source
CREATE INDEX IF NOT EXISTS idx_supports_source ON supports(source);
