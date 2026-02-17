-- 구/군 단위 지역 선택 지원
ALTER TABLE supports ADD COLUMN target_sub_regions TEXT[];
ALTER TABLE diagnoses ADD COLUMN sub_region TEXT;
