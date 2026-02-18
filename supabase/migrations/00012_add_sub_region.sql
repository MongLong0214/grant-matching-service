-- 구/군 단위 지역 선택 지원 (멱등성 보장)
ALTER TABLE supports ADD COLUMN IF NOT EXISTS target_sub_regions TEXT[];
ALTER TABLE diagnoses ADD COLUMN IF NOT EXISTS sub_region TEXT;
