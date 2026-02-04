-- Sync execution logs
CREATE TABLE IF NOT EXISTS sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'running',
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  programs_fetched INT DEFAULT 0,
  programs_inserted INT DEFAULT 0,
  programs_updated INT DEFAULT 0,
  programs_skipped INT DEFAULT 0,
  api_calls_used INT DEFAULT 0,
  error_message TEXT,
  metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_sync_logs_source_started ON sync_logs(source, started_at DESC);

-- Bokjiro incremental collection cursor
CREATE TABLE IF NOT EXISTS sync_cursors (
  source TEXT PRIMARY KEY,
  last_processed_index INT NOT NULL DEFAULT -1,
  service_ids JSONB,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_complete BOOLEAN DEFAULT false
);

-- RLS policies: service_role only
ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_cursors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sync_logs_service_only" ON sync_logs
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "sync_cursors_service_only" ON sync_cursors
  FOR ALL USING (auth.role() = 'service_role');
