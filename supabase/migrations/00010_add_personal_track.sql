-- 00010: 개인 트랙 지원을 위한 supports/diagnoses 테이블 확장
-- 전국민 대상 혜택찾기 서비스 (개인 + 사업자 듀얼 트랙)

-- === supports 테이블: 개인 차원 컬럼 추가 ===
ALTER TABLE supports ADD COLUMN service_type TEXT DEFAULT 'unknown';
ALTER TABLE supports ADD COLUMN target_age_min INTEGER;
ALTER TABLE supports ADD COLUMN target_age_max INTEGER;
ALTER TABLE supports ADD COLUMN target_household_types TEXT[];
ALTER TABLE supports ADD COLUMN target_income_levels TEXT[];
ALTER TABLE supports ADD COLUMN target_employment_status TEXT[];
ALTER TABLE supports ADD COLUMN benefit_categories TEXT[];

-- === diagnoses 테이블: 개인 트랙 필드 추가 ===
ALTER TABLE diagnoses ADD COLUMN user_type TEXT DEFAULT 'business';
ALTER TABLE diagnoses ADD COLUMN age_group TEXT;
ALTER TABLE diagnoses ADD COLUMN gender TEXT;
ALTER TABLE diagnoses ADD COLUMN household_type TEXT;
ALTER TABLE diagnoses ADD COLUMN income_level TEXT;
ALTER TABLE diagnoses ADD COLUMN employment_status TEXT;
ALTER TABLE diagnoses ADD COLUMN interest_categories TEXT[];

-- === 기존 사업자 필드 nullable 변경 (개인 트랙은 사업자 정보 없음) ===
ALTER TABLE diagnoses ALTER COLUMN business_type DROP NOT NULL;
ALTER TABLE diagnoses ALTER COLUMN employee_count DROP NOT NULL;
ALTER TABLE diagnoses ALTER COLUMN annual_revenue DROP NOT NULL;
ALTER TABLE diagnoses ALTER COLUMN business_age DROP NOT NULL;
ALTER TABLE diagnoses ALTER COLUMN founder_age DROP NOT NULL;

-- === 기존 데이터 source 기반 service_type 태깅 ===
UPDATE supports SET service_type = 'personal' WHERE source = 'bokjiro-central';
UPDATE supports SET service_type = 'personal' WHERE source = 'bokjiro-local';
UPDATE supports SET service_type = 'business' WHERE source = 'msit-rnd';
UPDATE supports SET service_type = 'business' WHERE source = 'kstartup';
UPDATE supports SET service_type = 'both' WHERE source = 'subsidy24';
