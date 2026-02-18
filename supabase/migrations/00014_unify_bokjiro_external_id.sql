-- bokjiro external_id 통합 마이그레이션
-- bokjiro-central-{servId}, bokjiro-local-{servId} → bokjiro-{servId}
-- local이 ctpvNm 기반 지역 매핑으로 더 정확하므로 local 우선

-- Step 1: local 레코드를 unified 형식으로 변경 (local이 더 정확)
UPDATE supports
SET external_id = 'bokjiro-' || SUBSTRING(external_id FROM 'bokjiro-local-(.+)')
WHERE external_id LIKE 'bokjiro-local-%';

-- Step 2: local에 이미 존재하는 servId의 central 레코드 삭제 (중복 제거)
DELETE FROM supports
WHERE external_id LIKE 'bokjiro-central-%'
  AND 'bokjiro-' || SUBSTRING(external_id FROM 'bokjiro-central-(.+)')
      IN (SELECT external_id FROM supports WHERE external_id LIKE 'bokjiro-%' AND external_id NOT LIKE 'bokjiro-central-%');

-- Step 3: 남은 central 레코드도 unified 형식으로 변경
UPDATE supports
SET external_id = 'bokjiro-' || SUBSTRING(external_id FROM 'bokjiro-central-(.+)')
WHERE external_id LIKE 'bokjiro-central-%';
