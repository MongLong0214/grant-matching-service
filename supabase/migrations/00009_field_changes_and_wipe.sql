-- 1. supports 테이블에 founder age 컬럼 추가
ALTER TABLE supports ADD COLUMN IF NOT EXISTS target_founder_age_min INTEGER;
ALTER TABLE supports ADD COLUMN IF NOT EXISTS target_founder_age_max INTEGER;

-- 2. diagnoses 테이블 변경: business_age, founder_age 추가
ALTER TABLE diagnoses ADD COLUMN IF NOT EXISTS business_age INTEGER;
ALTER TABLE diagnoses ADD COLUMN IF NOT EXISTS founder_age INTEGER;

-- 3. 전체 데이터 삭제 (DB 리셋)
TRUNCATE TABLE supports CASCADE;
TRUNCATE TABLE diagnoses CASCADE;

-- 4. 기존 컬럼 정리 (business_start_date는 유지하되 NOT NULL 제거)
ALTER TABLE diagnoses ALTER COLUMN business_start_date DROP NOT NULL;
ALTER TABLE diagnoses ALTER COLUMN business_start_date SET DEFAULT NULL;

-- 5. 새 컬럼에 NOT NULL + DEFAULT 설정
ALTER TABLE diagnoses ALTER COLUMN business_age SET NOT NULL;
ALTER TABLE diagnoses ALTER COLUMN business_age SET DEFAULT 0;
ALTER TABLE diagnoses ALTER COLUMN founder_age SET NOT NULL;
ALTER TABLE diagnoses ALTER COLUMN founder_age SET DEFAULT 0;
