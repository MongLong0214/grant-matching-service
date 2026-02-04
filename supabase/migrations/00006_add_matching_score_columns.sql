-- Add matching score data to diagnoses
ALTER TABLE diagnoses ADD COLUMN IF NOT EXISTS matched_scores JSONB;

COMMENT ON COLUMN diagnoses.matched_scores IS 'JSON array of {supportId, score, tier, breakdown} for each matched support';
