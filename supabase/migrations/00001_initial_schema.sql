-- 지원금 테이블
CREATE TABLE IF NOT EXISTS supports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  organization TEXT NOT NULL,
  category TEXT NOT NULL,
  start_date DATE,
  end_date DATE,
  detail_url TEXT NOT NULL,
  target_regions TEXT[],
  target_business_types TEXT[],
  target_employee_min INTEGER,
  target_employee_max INTEGER,
  target_revenue_min BIGINT,
  target_revenue_max BIGINT,
  target_business_age_min INTEGER,
  target_business_age_max INTEGER,
  amount TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 진단 테이블
CREATE TABLE IF NOT EXISTS diagnoses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_type TEXT NOT NULL,
  region TEXT NOT NULL,
  employee_count INTEGER NOT NULL,
  annual_revenue BIGINT NOT NULL,
  business_start_date DATE NOT NULL,
  email TEXT,
  matched_support_ids UUID[],
  matched_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_supports_is_active ON supports(is_active);
CREATE INDEX IF NOT EXISTS idx_supports_end_date ON supports(end_date);
CREATE INDEX IF NOT EXISTS idx_diagnoses_created_at ON diagnoses(created_at);

-- updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS supports_updated_at ON supports;
CREATE TRIGGER supports_updated_at
  BEFORE UPDATE ON supports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
