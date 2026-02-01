-- Enable Row Level Security
ALTER TABLE supports ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnoses ENABLE ROW LEVEL SECURITY;

-- Supports: public read, service_role only write
CREATE POLICY "supports_public_read" ON supports
  FOR SELECT USING (true);

CREATE POLICY "supports_service_write" ON supports
  FOR ALL USING (current_setting('request.jwt.claim.role', true) = 'service_role');

-- Diagnoses: anyone can insert, read by ID only
CREATE POLICY "diagnoses_public_insert" ON diagnoses
  FOR INSERT WITH CHECK (true);

CREATE POLICY "diagnoses_public_read" ON diagnoses
  FOR SELECT USING (true);
