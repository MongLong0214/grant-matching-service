-- Pipeline support columns for supports table
ALTER TABLE supports ADD COLUMN IF NOT EXISTS raw_eligibility_text TEXT;
ALTER TABLE supports ADD COLUMN IF NOT EXISTS raw_exclusion_text TEXT;
ALTER TABLE supports ADD COLUMN IF NOT EXISTS raw_preference_text TEXT;
ALTER TABLE supports ADD COLUMN IF NOT EXISTS extraction_confidence JSONB;
ALTER TABLE supports ADD COLUMN IF NOT EXISTS external_id TEXT;

-- Unique index for deduplication across sources
CREATE UNIQUE INDEX IF NOT EXISTS idx_supports_external_id ON supports(external_id) WHERE external_id IS NOT NULL;

-- Composite index for matching queries
CREATE INDEX IF NOT EXISTS idx_supports_category_active ON supports(category, is_active) WHERE is_active = true;

COMMENT ON COLUMN supports.source IS 'Data source: seed, bizinfo, kstartup, bokjiro-central, bokjiro-local, bizinfo-rss';
COMMENT ON COLUMN supports.raw_eligibility_text IS 'Raw eligibility criteria text from source API';
COMMENT ON COLUMN supports.raw_exclusion_text IS 'Raw exclusion criteria text from source API';
COMMENT ON COLUMN supports.raw_preference_text IS 'Raw preference/priority text from source API';
COMMENT ON COLUMN supports.extraction_confidence IS 'JSON object with per-field extraction confidence scores';
COMMENT ON COLUMN supports.external_id IS 'Unique ID from source API for deduplication';
