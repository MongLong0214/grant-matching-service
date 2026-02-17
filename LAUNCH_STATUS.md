# Grant Match - 출시 상태 트래킹

> 최종 업데이트: 2026-02-15

---

## API 키 승인 현황

### 즉시 사용 가능 (data.go.kr 통합 키)

| API | 환경변수 | 키 | 상태 |
|-----|---------|-----|------|
| **보조금24** (행정안전부) | `SUBSIDY24_API_KEY` | `38caad1...99ea6` | ✅ 활성 |
| **과기정통부 사업공고** | `MSIT_RND_API_KEY` | `38caad1...99ea6` | ✅ 활성 |

> data.go.kr REST 타입 API는 개인 인증키 1개로 모든 API 공유. 발급일: 2026-01-31

### 승인 대기 중

| API | 환경변수 | 신청 사이트 | 신청일 | 예상 승인 | 확인 방법 |
|-----|---------|-----------|--------|----------|----------|
| **중소벤처24** | `SME_VENTURE24_API_KEY` | smes.go.kr | 2026-02-15 | 1-3 영업일 | smes.go.kr 로그인 > 인증키 조회 |
| **온통청년** | `YOUTH_POLICY_API_KEY` | youthcenter.go.kr | 2026-02-15 | 1-3 영업일 | youthcenter.go.kr > 마이페이지 > OPEN API |
| **KOCCA 지원사업** | `KOCCA_API_KEY` | kocca.kr | 2026-02-15 | 1-3 영업일 | kocca.kr > OPEN API > API 키조회 |

> 알림 이메일: chowonil0124@naver.com

### 승인 후 조치 (체크리스트)

각 키가 승인되면:

1. [ ] **중소벤처24** 키 수신
   - [ ] `.env.local`에 `SME_VENTURE24_API_KEY=발급된키` 추가
   - [ ] Vercel 환경변수에도 추가
   - [ ] `/api/sync/sme-venture24` 수동 테스트: `curl -X POST https://bojogeummate.kr/api/sync/sme-venture24 -H "Authorization: Bearer $SYNC_SECRET"`
   - [ ] Supabase `supports` 테이블에 데이터 적재 확인

2. [ ] **온통청년** 키 수신
   - [ ] `.env.local`에 `YOUTH_POLICY_API_KEY=발급된키` 추가
   - [ ] Vercel 환경변수에도 추가
   - [ ] `/api/sync/youth-policy` 수동 테스트
   - [ ] Supabase 데이터 적재 확인

3. [ ] **KOCCA** 키 수신
   - [ ] `.env.local`에 `KOCCA_API_KEY=발급된키` 추가
   - [ ] Vercel 환경변수에도 추가
   - [ ] `/api/sync/kocca` 수동 테스트
   - [ ] Supabase 데이터 적재 확인

4. [ ] **전체 Cron 통합 테스트**
   - [ ] `/api/cron/sync` 호출하여 9개 step 모두 성공 확인
   - [ ] 에러 발생 시 로그 확인 (Vercel Dashboard)

---

## 구현 완료 현황

### Phase 1: 매칭 알고리즘 수정 ✅

| 항목 | 파일 | 상태 |
|------|------|------|
| NULL 편향 버그 수정 | `src/lib/matching-v2.ts` | ✅ 완료 |
| 추출 신뢰도 통합 | `src/lib/matching-v2.ts` | ✅ 완료 |
| 매칭 결과 영속화 | `src/lib/data.ts`, `src/types/index.ts` | ✅ 완료 |
| 매칭 설명 UI | `src/components/support-card.tsx` | ✅ 완료 |
| 가중치 조정 | `src/lib/matching-v2.ts` | ✅ 완료 |

### Phase 2: 데이터 품질 개선 ✅

| 항목 | 파일 | 상태 |
|------|------|------|
| Bizinfo API 추출 적용 | `src/lib/bizinfo.ts` | ✅ 완료 |
| 매출 추출 패턴 확장 | `src/lib/extraction/revenue-patterns.ts` | ✅ 완료 |
| 추출 후 검증 | `src/lib/extraction/index.ts` | ✅ 완료 |
| Fetcher NULL/[] 구분 | 4개 fetcher | ✅ 완료 |
| 재시도 로직 | `src/lib/fetch-with-retry.ts` | ✅ 완료 |
| 중복제거 개선 | `src/lib/dedup.ts` | ✅ 완료 |

### Phase 3: 신규 데이터 소스 ✅ (코드 완료, 키 대기)

| Fetcher | 파일 | 코드 | API 키 |
|---------|------|------|--------|
| 보조금24 | `src/lib/fetchers/subsidy24.ts` | ✅ | ✅ 활성 |
| 과기정통부 | `src/lib/fetchers/msit-rnd.ts` | ✅ | ✅ 활성 |
| 중소벤처24 | `src/lib/fetchers/sme-venture24.ts` | ✅ | ⏳ 대기 |
| 온통청년 | `src/lib/fetchers/youth-policy.ts` | ✅ | ⏳ 대기 |
| KOCCA | `src/lib/fetchers/kocca.ts` | ✅ | ⏳ 대기 |

### Phase 4: 출시 필수 요소 ✅

| 항목 | 파일 | 상태 |
|------|------|------|
| 이용약관 | `src/app/terms/page.tsx` | ✅ 완료 |
| 개인정보처리방침 | `src/app/privacy/page.tsx` | ✅ 완료 |
| 404 페이지 | `src/app/not-found.tsx` | ✅ 완료 |
| 전역 에러 페이지 | `src/app/global-error.tsx` | ✅ 완료 |

### 빌드 검증 ✅

- `tsc --noEmit` → 에러 0
- `eslint .` → 에러 0
- `next build` → 성공

---

## 출시 전 남은 작업

### P0 - 즉시 필요

| # | 작업 | 담당 | 상태 |
|---|------|------|------|
| 1 | `.env.local`에 보조금24/과기정통부 API 키 추가 | Isaac | 미완료 |
| 2 | Vercel 환경변수에 활성 API 키 등록 | Isaac | 미완료 |
| 3 | 보조금24/과기정통부 sync 수동 테스트 | Isaac | 미완료 |
| 4 | ~~Supabase `diagnoses` 테이블 `matched_scores JSONB` 컬럼 추가~~ | Claude | ✅ 완료 (마이그레이션 00006 적용) |
| 5 | ~~Supabase `diagnoses` 테이블 `email` 컬럼 제거~~ | Claude | ✅ 완료 (마이그레이션 00007 적용) |
| 6 | 3개 API 키 승인 확인 (중소벤처24/온통청년/KOCCA) | Isaac | 대기 중 |
| 7 | ~~시드 데이터 Google URL → 공식 URL 교체~~ | Claude | ✅ 완료 (30개 전체) |
| 8 | ~~500 에러 수정 (진단 API)~~ | Claude | ✅ 완료 (fallback 로직 추가) |

### P1 - 1주 내

| # | 작업 | 비고 |
|---|------|------|
| 1 | Google Search Console 등록 + 인증 코드 교체 | `layout.tsx` GOOGLE_VERIFICATION_CODE |
| 2 | Naver Search Advisor 등록 + 인증 코드 교체 | `layout.tsx` NAVER_VERIFICATION_CODE |
| 3 | Vercel Cron 첫 실행 확인 | 매일 3AM UTC |
| 4 | Google Analytics 4 연동 | 측정 ID 발급 필요 |
| 5 | 승인된 API 키 Vercel 환경변수 등록 | 승인 시 즉시 |

### P2 - 1개월 내

| # | 작업 | 비고 |
|---|------|------|
| 1 | 데이터 수집 실패 알림 설정 | Slack/이메일 |
| 2 | 사용자 인증 시스템 | Supabase Auth |
| 3 | 지원금 상세 페이지 `/support/[id]` | |
| 4 | 지원금 브라우징 `/supports` | |

---

## DB 마이그레이션 SQL

✅ **모두 적용 완료** (`npx supabase db push --linked` 실행됨, 2026-02-15)

```sql
-- 00006: matched_scores JSONB 컬럼 추가 ✅ 적용됨
ALTER TABLE diagnoses ADD COLUMN IF NOT EXISTS matched_scores JSONB;

-- 00007: email 컬럼 제거 ✅ 적용됨
ALTER TABLE diagnoses DROP COLUMN IF EXISTS email;
```

---

## 환경변수 전체 목록

### 현재 설정됨

| 변수 | 용도 |
|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 익명 키 |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase 서비스 롤 키 |
| `SYNC_SECRET` | 데이터 동기화 인증 |
| `CRON_SECRET` | Cron 인증 |
| `BIZINFO_API_KEY` | 기업마당 (data.go.kr) |

### 추가 필요

| 변수 | 값 | Vercel | .env.local |
|------|-----|--------|-----------|
| `SUBSIDY24_API_KEY` | `38caad15186d13267e078e27f68f225c3507cc6ee2d14ed47bc6198dabf99ea6` | 추가 필요 | 추가 필요 |
| `MSIT_RND_API_KEY` | `38caad15186d13267e078e27f68f225c3507cc6ee2d14ed47bc6198dabf99ea6` | 추가 필요 | 추가 필요 |
| `SME_VENTURE24_API_KEY` | 승인 대기 | 추가 필요 | 추가 필요 |
| `YOUTH_POLICY_API_KEY` | 승인 대기 | 추가 필요 | 추가 필요 |
| `KOCCA_API_KEY` | 승인 대기 | 추가 필요 | 추가 필요 |
