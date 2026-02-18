# 프로덕션 리뷰 및 수정 보고서

> **일시**: 2026-02-18
> **범위**: region_scope 구현 + fetcher 리팩토링 전체 (main 브랜치 대비 38개 파일)
> **빌드 검증**: tsc 0에러 / eslint 0에러 / next build 성공
> **2차 리뷰**: 1차 수정 후 재검증 → 8건 추가 수정 + DB 마이그레이션 1건

---

## 1. 리뷰 프로세스

### 팀 구성 (3개 리뷰 에이전트 병렬)

| 리뷰어 | 담당 | 파일 수 | 이슈 | 등급 |
|--------|------|---------|------|------|
| core-reviewer | 매칭 엔진 + 타입 + 추출 | 12 | 3건 | B+ |
| fetcher-reviewer | Fetchers + Sync 인프라 | 11 | 13건 | B |
| ui-scripts-reviewer | UI + Scripts + Migration | 16 | 13건 | C+ |

### 수정 팀 구성 (3개 수정 에이전트 병렬)

| 에이전트 | 담당 | 처리 |
|----------|------|------|
| core-fixer | 타입 + UI + Migration | 6건 수정 |
| fetcher-fixer | Fetcher 버그 + 중복 제거 | 13건 수정 |
| scripts-fixer | 스크립트 삭제/분할/한글화 | 11건 수정 |

**총 30건 수정** (29건 리뷰 이슈 + 1건 ESLint 후속 수정)

---

## 2. 발견 이슈 전체 목록

### P1-high (18건)

| # | 파일 | 이슈 | 수정 내용 |
|---|------|------|----------|
| 1 | kstartup-helpers.ts:34 | 필드 매핑 버그: 접수시작일→공고마감일 | 잘못된 매핑 라인 삭제 |
| 2 | bizinfo.ts | external_id 누락 | `bizinfo-${program.번호}` 추가 |
| 3 | sync/route.ts | bizinfo delete-then-insert (데이터 손실 위험) | batch upsert 패턴으로 전환 |
| 4 | bizinfo.ts:56 | raw fetch 사용 (retry 없음) | fetchWithRetry로 전환 |
| 5 | 3개 파일 | parseDate 3중복 | sync-helpers.ts 하나로 통합 |
| 6 | 4개 파일 | mapCategory 4중복 | sync-helpers.ts 공통 버전 생성 |
| 7 | types/index.ts:61 | MatchTier v3 값 + `\| string` (타입 안전성 무력화) | v4 값으로 갱신, `\| string` 제거 |
| 8 | region-dictionary.ts | 246줄 (200줄 초과) | region-data.ts(112줄) + region-dictionary.ts(125줄) 분리 |
| 9 | scripts/ | 디버깅 스크립트 6개 잔류 | 6개 삭제 |
| 10 | audit-sub-region-3000.ts | 776줄 (200줄 초과) | scripts/audit/ 4파일 분할 |
| 11 | validate-region-dictionary.ts | 579줄 (200줄 초과) | scripts/validate/ 5파일 분할 |
| 12 | retag-all-dimensions.ts | 257줄 (200줄 초과) | 147줄로 압축 |
| 13 | debug-leaky-regions.js, debug-support.js | TypeScript 프로젝트에 .js 파일 | 삭제 (디버깅 스크립트) |
| 14 | 삭제 대상 스크립트 | any[] 타입 사용 | 파일 삭제로 해소 |
| 15 | audit-region-scope.ts | eslint-disable + as any | 적절한 Row 타입 적용, 130줄로 압축 |
| 16 | validate-region-dictionary.ts | 영어 주석 다수 | 전량 한글 변환 |
| 17 | audit-sub-region-3000.ts | 영어 주석 다수 | 전량 한글 변환 |
| 18 | audit-sub-region-3000.ts:32-55 | 상수 하드코딩 (동기화 깨짐 위험) | src/constants/index에서 import |

### P2-medium (9건)

| # | 파일 | 이슈 | 수정 내용 |
|---|------|------|----------|
| 1 | msit-rnd.ts:83 | title(item.subject) extractEligibility에 미전달 | title 파라미터 추가 |
| 2 | sync-helpers.ts | upsertSupport SELECT+INSERT/UPDATE (N+1) | native `.upsert()` 변경 |
| 3 | 6개 fetcher | sync-helpers 미사용 (코드 중복) | 전량 sync-helpers 마이그레이션 |
| 4 | bokjiro helpers 2개 | getTotalCount 2중복 | sync-helpers 통합 |
| 5 | bokjiro helpers | parseXmlItems 이름 충돌 | parseServListItems로 rename |
| 6 | types/index.ts | MatchedScore.scores에 coverage 누락 | `coverage?: number` 추가 |
| 7 | personal-form.tsx | onRegionBlur 누락 (business-form과 불일치) | validateField('region') 추가 |
| 8 | 00012_add_sub_region.sql | 멱등성 없음 | IF NOT EXISTS 추가 |
| 9 | 00013_add_region_scope.sql | 멱등성 없음 | DO $$ BEGIN IF NOT EXISTS 추가 |

### P3-low (2건)

| # | 파일 | 이슈 | 수정 내용 |
|---|------|------|----------|
| 1 | bizinfo.ts | extractEligibility 중복 텍스트 | texts[]에서 중복 제거 |
| 2 | kstartup.ts | 불필요한 re-export | 삭제 |

### 후속 수정 (1건)

| # | 파일 | 이슈 | 수정 내용 |
|---|------|------|----------|
| 1 | 4개 fetcher | `let updated` prefer-const ESLint 에러 | `const updated = 0` 분리 |

---

## 3. 주요 아키텍처 변경

### 3-1. sync-helpers.ts — Fetcher 공용 인프라

```
src/lib/fetchers/sync-helpers.ts (175줄)
```

10개 fetcher가 공유하는 유틸리티 중앙 집중화:

| 함수 | 역할 |
|------|------|
| `createSyncClient()` | Supabase service_role 클라이언트 생성 |
| `startSyncLog()` | sync_logs 시작 레코드 삽입 |
| `completeSyncLog()` | sync_logs 완료 (통계 포함) |
| `failSyncLog()` | sync_logs 실패 (에러 메시지 포함) |
| `upsertSupport()` | external_id 기준 native upsert (1 DB call) |
| `getTotalCount()` | XML totalCount 추출 |
| `getXmlField()` | XML 태그 값 추출 (CDATA 지원) |
| `parseXmlItems()` | `<item>` 블록 파싱 + 에러 체크 |
| `parseJsonItems<T>()` | data.go.kr JSON 응답 파싱 |
| `parseDate()` | YYYYMMDD / YYYY-MM-DD 정규화 |
| `mapCategory()` | 키워드→카테고리 매핑 |

### 3-2. region-dictionary.ts 분리

```
이전: region-dictionary.ts (246줄) — 데이터 + 로직 혼합
이후: region-data.ts (112줄) — 순수 데이터 사전
      region-dictionary.ts (125줄) — 추출 로직
```

| 파일 | 내용 |
|------|------|
| region-data.ts | REGION_VARIANTS, CITY_TO_REGION, PARTICLE_STARTS, SIDO_SHORT |
| region-dictionary.ts | isValidBoundary(), extractRegionsWithDistricts(), preprocessOrgForRegion(), CTPV_TO_REGION |

기존 import 호환: `region-dictionary.ts`에서 `REGION_VARIANTS` re-export 유지.

### 3-3. bizinfo 동기화 방식 변경

```
이전: DELETE source='bizinfo' → INSERT (데이터 손실 위험)
이후: upsert(record, { onConflict: 'external_id' }) (원자적, 무손실)
```

- `external_id: bizinfo-${program.번호}` 필드 추가
- `fetchWithRetry` 적용 (네트워크 일시 장애 대비)

### 3-4. MatchTier 타입 정합성

```typescript
// 이전 (v3 잔재 + 타입 무력화)
export type MatchTier = 'exact' | 'likely' | 'related'
tier: MatchTier | string  // → string으로 해소됨

// 이후 (v4 정확 매칭)
export type MatchTier = 'tailored' | 'recommended' | 'exploratory'
tier: MatchTier  // 컴파일 타임 검증 가능
```

### 3-5. 스크립트 디렉토리 정리

```
삭제 (6개 디버깅 스크립트):
  scripts/analyze-region-data.ts
  scripts/check-gyeongbuk-for-incheon.ts
  scripts/debug-leaky-regions.js
  scripts/debug-support.js
  scripts/simulate-incheon-user.ts
  scripts/verify-fix.ts

분할 (2개 → 9개 모듈):
  scripts/audit-sub-region-3000.ts (776줄) →
    scripts/audit/profile-generators.ts (117줄)
    scripts/audit/scoring-helpers.ts (192줄)
    scripts/audit/report-printer.ts (133줄)
    scripts/audit/sub-region-3000.ts (137줄)

  scripts/validate-region-dictionary.ts (579줄) →
    scripts/validate/shared.ts (56줄)
    scripts/validate/check-completeness.ts (68줄)
    scripts/validate/check-db.ts (111줄)
    scripts/validate/check-sub-regions.ts (87줄)
    scripts/validate/main.ts (66줄)

압축 (2개):
  scripts/retag-all-dimensions.ts: 257→147줄
  scripts/audit-region-scope.ts: 215→130줄
```

---

## 4. 변경 파일 전체 목록 (main 대비)

### 신규 파일 (7개)

| 파일 | 줄 수 | 역할 |
|------|-------|------|
| src/lib/extraction/region-data.ts | 112 | 지역명 데이터 사전 |
| src/lib/extraction/region-scope.ts | 35 | region_scope 3단계 판정 |
| src/lib/fetchers/sync-helpers.ts | 175 | Fetcher 공용 인프라 |
| src/components/ui/region-selector.tsx | 66 | 시도+구군 2단 선택 컴포넌트 |
| supabase/migrations/00012_add_sub_region.sql | 3 | sub_region 컬럼 추가 |
| supabase/migrations/00013_add_region_scope.sql | 14 | region_scope 컬럼 + 기존 데이터 마이그레이션 |
| scripts/retag-sub-regions.ts | 112 | sub-region 재추출 스크립트 |

### 수정 파일 (31개)

| 파일 | 줄 수 | 주요 변경 |
|------|-------|----------|
| src/types/index.ts | 150 | MatchTier v4, RegionScope 타입, coverage 추가 |
| src/lib/matching-v4/index.ts | 187 | unknown→tailored 차단, subRegion 보너스 |
| src/lib/matching-v4/scores.ts | 131 | scoreRegionWithDistrict() region_scope 3분기 |
| src/lib/matching-v4/dimensions.ts | 151 | regionScope 파라미터 전달 |
| src/lib/extraction/index.ts | 188 | regionScope 추출 연동 |
| src/lib/extraction/region-dictionary.ts | 125 | 데이터→region-data.ts 분리, 로직만 보존 |
| src/lib/supabase/types.ts | 151 | SupportRow region_scope, MatchedScoreJson tier→MatchTier |
| src/lib/supabase/mappers.ts | 85 | regionScope 매핑 추가 |
| src/lib/diagnosis.ts | 134 | subRegion 저장 |
| src/lib/bizinfo.ts | 176 | external_id, fetchWithRetry, extractEligibility 정리 |
| src/app/api/diagnose/route.ts | 176 | subRegion 파라미터 처리 |
| src/app/api/sync/route.ts | 111 | bizinfo upsert 전환 |
| src/constants/index.ts | 157 | REGION_DISTRICTS 추가 |
| src/components/business-form.tsx | 179 | RegionSelector 연동, subRegion 전달 |
| src/components/personal-form.tsx | 200 | RegionSelector 연동, onRegionBlur 추가 |
| src/lib/fetchers/sync-helpers.ts | 175 | mapCategory, parseDate, getTotalCount 통합 |
| src/lib/fetchers/bokjiro-central.ts | 170 | sync-helpers 마이그레이션 |
| src/lib/fetchers/bokjiro-central-helpers.ts | 34 | getTotalCount→sync-helpers, parseServListItems rename |
| src/lib/fetchers/bokjiro-local.ts | 170 | sync-helpers 마이그레이션 |
| src/lib/fetchers/bokjiro-local-helpers.ts | 36 | getTotalCount→sync-helpers, parseServListItems rename |
| src/lib/fetchers/kstartup.ts | 94 | sync-helpers 마이그레이션, re-export 제거 |
| src/lib/fetchers/kstartup-helpers.ts | 140 | 매핑 버그 수정, parseDate→import |
| src/lib/fetchers/loan-comparison.ts | 159 | sync-helpers 활용 (기존) |
| src/lib/fetchers/msit-rnd.ts | 124 | sync-helpers 마이그레이션, title 파라미터 추가 |
| src/lib/fetchers/msit-rnd-parser.ts | 44 | parseDate/mapCategory→import |
| src/lib/fetchers/small-loan-finance.ts | 125 | sync-helpers 활용 (기존) |
| src/lib/fetchers/sme-biz-announcement.ts | 145 | sync-helpers 활용 (기존), mapCategory→import |
| src/lib/fetchers/social-finance.ts | 115 | sync-helpers 활용 (기존) |
| src/lib/fetchers/subsidy24.ts | 143 | sync-helpers 마이그레이션, mapCategory→import |
| scripts/retag-all-dimensions.ts | 147 | 통계 출력 압축 |
| scripts/audit-region-scope.ts | 130 | as any 제거, 타입 적용, 압축 |

---

## 5. 줄 수 현황 (200줄 제한 전수 검증)

### 프로덕션 코드 (src/)

| 파일 | 줄 수 | 상태 |
|------|-------|------|
| personal-form.tsx | 200 | 경계 |
| audience-patterns.ts | 192 | OK |
| extraction/index.ts | 188 | OK |
| matching-v4/index.ts | 187 | OK |
| business-form.tsx | 179 | OK |
| bizinfo.ts | 176 | OK |
| api/diagnose/route.ts | 176 | OK |
| sync-helpers.ts | 175 | OK |
| bokjiro-central.ts | 170 | OK |
| bokjiro-local.ts | 170 | OK |
| loan-comparison.ts | 159 | OK |
| constants/index.ts | 157 | OK |
| supabase/types.ts | 151 | OK |
| dimensions.ts | 151 | OK |
| types/index.ts | 150 | OK |
| sme-biz-announcement.ts | 145 | OK |
| subsidy24.ts | 143 | OK |
| kstartup-helpers.ts | 140 | OK |
| diagnosis.ts | 134 | OK |
| scores.ts | 131 | OK |
| region-dictionary.ts | 125 | OK |
| small-loan-finance.ts | 125 | OK |
| msit-rnd.ts | 124 | OK |
| social-finance.ts | 115 | OK |
| region-data.ts | 112 | OK |
| sync/route.ts | 111 | OK |
| kstartup.ts | 94 | OK |
| bizinfo-odcloud.ts | 90 | OK |
| mappers.ts | 85 | OK |
| region-selector.tsx | 66 | OK |
| msit-rnd-parser.ts | 44 | OK |
| bokjiro-local-helpers.ts | 36 | OK |
| region-scope.ts | 35 | OK |
| bokjiro-central-helpers.ts | 34 | OK |

**전체 200줄 이하 ✅** (personal-form.tsx 정확히 200줄)

### 스크립트 (scripts/) — 이번 작업 범위

| 파일 | 줄 수 |
|------|-------|
| audit/scoring-helpers.ts | 192 |
| retag-all-dimensions.ts | 147 |
| audit/sub-region-3000.ts | 137 |
| audit/report-printer.ts | 133 |
| audit-region-scope.ts | 130 |
| audit/profile-generators.ts | 117 |
| retag-sub-regions.ts | 112 |
| validate/check-db.ts | 111 |
| validate/check-sub-regions.ts | 87 |
| validate/check-completeness.ts | 68 |
| validate/main.ts | 66 |
| validate/shared.ts | 56 |

**전체 200줄 이하 ✅**

---

## 6. Fetcher 일관성 매트릭스

### sync-helpers 활용 현황

| Fetcher | createSyncClient | startSyncLog | upsertSupport | mapCategory | parseDate |
|---------|:---:|:---:|:---:|:---:|:---:|
| bokjiro-central | ✅ | ✅ | ✅ | — | — |
| bokjiro-local | ✅ | ✅ | ✅ | — | — |
| kstartup | ✅ | ✅ | ✅ | ✅ | ✅ |
| loan-comparison | ✅ | ✅ | ✅ | — | ✅ |
| msit-rnd | ✅ | ✅ | ✅ | ✅ | ✅ |
| small-loan-finance | ✅ | ✅ | ✅ | — | — |
| sme-biz-announcement | ✅ | ✅ | ✅ | ✅ | ✅ |
| social-finance | ✅ | ✅ | ✅ | — | — |
| subsidy24 | ✅ | ✅ | ✅ | ✅ | — |
| bizinfo (sync/route.ts) | ✅ | ✅ | — | — | — |

> bizinfo는 sync route에서 batch upsert 수행. startSyncLog/completeSyncLog/failSyncLog 활용. 10개 소스 모두 sync-helpers 활용.

### extractEligibility 파라미터 전달

| Fetcher | organization | title |
|---------|:---:|:---:|
| bokjiro-central | ✅ jurMnofNm | — |
| bokjiro-local | ✅ jurMnofNm \|\| ctpvNm | — |
| kstartup | ✅ jrsdInsttNm \|\| excInsttNm | — |
| loan-comparison | ✅ fnc_instt_nm | — |
| msit-rnd | ✅ deptName | ✅ item.subject |
| small-loan-finance | ✅ ofrInstNm | — |
| sme-biz-announcement | ✅ insttNm \|\| jrsdInsttNm | — |
| social-finance | ✅ operInstNm \|\| sprvsnInstNm | — |
| subsidy24 | ✅ 부서명 | — |
| bizinfo | ✅ 소관기관 | — |

### region_scope upsert 포함

| Fetcher | region_scope |
|---------|:---:|
| 전체 10개 | ✅ extraction.regionScope |

---

## 7. 매칭 엔진 핵심 로직

### region_scope 3단계 점수 (scores.ts)

```
national (확인된 전국)  → 1.0
regional (확인된 지역)  → 기존 지역 매칭 로직
unknown  (지역 불명)    → 0.3
```

### unknown 정책 제한 (index.ts)

```
unknown region_scope → tailored("맞춤") 진입 불가
→ 최대 recommended("추천")까지만 노출
```

### 가중치 (변경 없음)

```
사업자: region 0.22 / businessAge 0.20 / businessType 0.18 / employee 0.15 / founderAge 0.15 / revenue 0.10
개인:   age 0.25 / region 0.20 / householdType 0.20 / incomeLevel 0.20 / employmentStatus 0.15
```

### 티어 임계값 (변경 없음)

```
tailored     ≥ 0.45 (최대 20건)
recommended  ≥ 0.30 (최대 25건)
exploratory  ≥ 0.18 (최대 25건)
총 상한: 70건
```

---

## 8. DB 마이그레이션

### 00012_add_sub_region.sql

```sql
ALTER TABLE supports ADD COLUMN IF NOT EXISTS target_sub_regions TEXT[];
ALTER TABLE diagnoses ADD COLUMN IF NOT EXISTS sub_region TEXT;
```

### 00013_add_region_scope.sql

```sql
-- supports 테이블에 region_scope 컬럼 추가 (멱등성 보장)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'supports' AND column_name = 'region_scope'
  ) THEN
    ALTER TABLE supports ADD COLUMN region_scope TEXT NOT NULL DEFAULT 'unknown';
  END IF;
END $$;

-- 기존 데이터 마이그레이션: target_regions가 있으면 regional
UPDATE supports SET region_scope = 'regional'
WHERE target_regions IS NOT NULL
  AND array_length(target_regions, 1) > 0
  AND region_scope = 'unknown';
```

---

## 9. 유지보수 커맨드

### 빌드 검증 (3종)

```bash
npx tsc --noEmit          # TypeScript 타입 검사
npx eslint src/            # ESLint (src/ 범위)
npx next build             # Next.js 프로덕션 빌드
```

### 데이터 품질 검증

```bash
# region_scope 분포 확인
npx tsx scripts/audit-region-scope.ts

# 3000-case 전수조사 (개인 1500 + 사업자 1500)
npx tsx scripts/audit/sub-region-3000.ts

# 지역 사전 검증 (4가지 CHECK)
npx tsx scripts/validate/main.ts
```

### 데이터 재추출

```bash
# 전체 차원 재추출 (region_scope 포함)
npx tsx scripts/retag-all-dimensions.ts

# sub-region만 재추출
npx tsx scripts/retag-sub-regions.ts
```

### 수동 동기화

```bash
npx tsx scripts/run-sync.ts                  # 전체 소스
curl -X POST /api/sync/bokjiro-central       # 개별 소스
```

---

## 10. 고도화 로드맵

### 단기 (다음 스프린트)

1. **unknown 비율 감소** — extraction 로직 강화로 unknown→national/regional 전환률 높이기
2. **bizinfo sync-helpers 통합** — 현재 sync route에서 직접 upsert하는 구조를 fetcher 패턴으로 정규화
3. **기존 대형 스크립트 정리** — scripts/ 디렉토리에 이번 작업 범위 외 200줄 초과 파일 13개 잔존 (audit-matching-800: 1810줄 등)

### 중기

4. **region_scope 판정 고도화** — NATIONAL_KEYWORDS 확장, 기관명 패턴 학습
5. **sub-region 매칭 세분화** — 현재 +0.08 보너스 → 구/군별 가중치 차등

### 장기

6. **Fetcher 추가** — KOCCA (승인 대기), 추가 공공데이터 소스
7. **매칭 v5** — ML 기반 가중치 최적화 (사용자 피드백 데이터 축적 후)

---

## 11. 의존성 맵

```
사용자 입력
  ├─ business-form.tsx / personal-form.tsx
  │   └─ region-selector.tsx (시도+구군 2단 선택)
  └─ api/diagnose/route.ts
       ├─ diagnosis.ts (DB 저장)
       └─ matching-v4/index.ts (매칭 엔진)
            ├─ dimensions.ts (차원별 점수 오케스트레이션)
            │   └─ scores.ts (점수 함수 + region_scope 3분기)
            └─ Support 타입 ← supabase/mappers.ts
                                  └─ supabase/types.ts

데이터 수집
  ├─ api/cron/sync/route.ts (Vercel cron 3AM UTC)
  │   └─ 10개 fetcher (sync-helpers.ts 공유)
  │       ├─ extraction/index.ts (자격조건 추출)
  │       │   ├─ region-dictionary.ts (지역 추출 로직)
  │       │   │   └─ region-data.ts (지역명 데이터 사전)
  │       │   └─ region-scope.ts (national/regional/unknown 판정)
  │       └─ sync-helpers.ts (DB upsert, XML/JSON 파싱, 싱크 로그)
  └─ api/sync/route.ts (bizinfo 수동 동기화)
```

---

## 12. 삭제된 파일 목록

| 파일 | 이유 |
|------|------|
| scripts/analyze-region-data.ts | 일회성 분석 |
| scripts/check-gyeongbuk-for-incheon.ts | 일회성 디버깅 |
| scripts/debug-leaky-regions.js | 일회성 디버깅 + .js |
| scripts/debug-support.js | 일회성 디버깅 + .js |
| scripts/simulate-incheon-user.ts | 일회성 디버깅 |
| scripts/verify-fix.ts | 일회성 검증 |
| scripts/audit-sub-region-3000.ts | scripts/audit/로 분할 |
| scripts/validate-region-dictionary.ts | scripts/validate/로 분할 |

---

## 13. 2차 리뷰 (1차 수정 검증 + 추가 발견)

### 리뷰 팀 구성

| 리뷰어 | 담당 | 이슈 | 등급 |
|--------|------|------|------|
| core-reviewer-v2 | 매칭 엔진 + 타입 + 추출 | 0건 | A (PASS) |
| fetcher-reviewer-v2 | Fetchers + Sync 인프라 | 5건 | B+ |
| ui-scripts-reviewer-v2 | UI + Scripts | 3건 | B+ |

**1차 수정 검증**: 20/20건 확인 완료

### 2차 발견 이슈 (8건)

| # | 심각도 | 파일 | 이슈 | 수정 내용 |
|---|--------|------|------|----------|
| 1 | **P0** | bokjiro-central.ts, bokjiro-local.ts | 동일 API URL인데 external_id prefix가 다름 → 데이터 중복 | external_id `bokjiro-${servId}`로 통합 + DB 마이그레이션 00014 |
| 2 | P1 | sync-helpers.ts | upsertSupport 실패 시 에러 무시 (silent swallow) | `console.error` 로깅 추가 |
| 3 | P1 | sync/route.ts | 삭제된 `createAdminClient` 호출 + sync_logs 미기록 | `createSyncClient` + startSyncLog/completeSyncLog/failSyncLog |
| 4 | P1 | bizinfo.ts | raw_eligibility_text 등 3개 필드 누락 | `raw_eligibility_text`, `raw_exclusion_text`, `raw_preference_text` 추가 |
| 5 | P1 | personal-form.tsx | focus-on-first-error 미구현 (business-form과 불일치) | handleSubmit에 `document.getElementById().focus()` 추가 |
| 6 | P1 | audit/sub-region-3000.ts | 27줄 로컬 mapSupportRow 복사본 | `src/lib/supabase/mappers` import로 교체 |
| 7 | P2 | 5개 fetcher | stats 의미 불일치: `fetched`=upsert건수, `inserted`=0 | `fetched`=API건수, `inserted`=upsert건수로 통일 |
| 8 | P2 | audit-region-scope.ts | HOUSEHOLD_TYPES/EMPLOYMENT_STATUS 값이 form constants와 불일치 | constants와 동일 값으로 수정 |

---

## 14. DB 마이그레이션 (2차 리뷰 추가)

### 00014_unify_bokjiro_external_id.sql

bokjiro 데이터 중복 제거를 위한 external_id 통합:

```
기존 상태:
  bokjiro-central-{servId}: 1,900건
  bokjiro-local-{servId}: 100건

마이그레이션 순서:
  1. bokjiro-local-* → bokjiro-* (local이 ctpvNm 기반 지역 매핑으로 더 정확)
  2. 중복 central 레코드 삭제 (local에 이미 있는 servId)
  3. 남은 central → bokjiro-*

결과:
  bokjiro-{servId}: ~1,900건 (중복 제거 후)
```

### 배포 순서 (필수)

```
1. supabase db push (00014 마이그레이션 적용)
2. Vercel 배포
3. 싱크 실행하여 unified external_id 확인
```

> ⚠️ 마이그레이션 없이 배포하면 ~2,000건 중복 레코드 발생

---

## 15. Fetcher stats 의미 정의 (2차 리뷰 표준화)

```
fetched:  API에서 받아온 총 건수
inserted: DB에 upsert 성공 건수
updated:  0 (native upsert로 insert/update 미구분)
skipped:  ID 누락 또는 upsert 실패 건수
```

10개 fetcher 전부 이 의미로 통일 완료.
