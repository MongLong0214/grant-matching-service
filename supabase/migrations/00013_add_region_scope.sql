-- region_scope 3단계 분류: national / regional / unknown
-- 기존 target_regions=[]를 "전국"으로 취급하던 문제 해결
ALTER TABLE supports ADD COLUMN region_scope TEXT NOT NULL DEFAULT 'unknown';

-- 기존 데이터 마이그레이션: target_regions 있으면 regional
UPDATE supports SET region_scope = 'regional'
  WHERE target_regions IS NOT NULL AND array_length(target_regions, 1) > 0;
