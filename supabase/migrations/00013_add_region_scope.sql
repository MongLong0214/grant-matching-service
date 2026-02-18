-- region_scope 3단계 분류: national / regional / unknown (멱등성 보장)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'supports' AND column_name = 'region_scope'
  ) THEN
    ALTER TABLE supports ADD COLUMN region_scope TEXT NOT NULL DEFAULT 'unknown';
  END IF;
END $$;

-- 기존 데이터 마이그레이션: target_regions 있으면 regional
UPDATE supports SET region_scope = 'regional'
  WHERE target_regions IS NOT NULL AND array_length(target_regions, 1) > 0
    AND region_scope = 'unknown';
