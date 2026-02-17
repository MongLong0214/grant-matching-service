-- external_id의 partial unique index를 proper unique constraint로 변경
-- PostgREST upsert의 onConflict에서 partial index를 인식하지 못하는 문제 해결

-- 기존 partial index 제거
DROP INDEX IF EXISTS idx_supports_external_id;

-- NULL 값이 있는 레코드 정리 (external_id가 NULL인 것은 seed 데이터)
-- NULL은 UNIQUE constraint에서 허용됨 (PostgreSQL: NULL != NULL)

-- proper unique constraint 추가
ALTER TABLE supports ADD CONSTRAINT supports_external_id_unique UNIQUE (external_id);
