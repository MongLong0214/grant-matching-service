# 혜택 찾기 (가칭) — 서비스 리빌딩 기획서

> 전국민 정부지원 매칭 서비스 v2.0
> 소상공인 전용 → 소상공인 + 일반인 통합

---

## 1. 왜 리빌딩하는가

### 현재 서비스의 한계
| 문제 | 수치 | 영향 |
|------|------|------|
| 소상공인만 타겟 | 전체 인구의 ~6% | 시장 규모 제한 |
| 복지 데이터 버림 | 6,363건 중 62%가 복지 → 필터링 | 핵심 데이터를 버리고 있음 |
| 업종 데이터 38%만 보유 | 나머지 62%는 매칭 불가 | 결과 품질 한계 |
| 단일 사용자 유형 | 업종/직원수/매출 등 사업 차원만 | 일반인 진입 불가 |

### 피벗 근거
- 복지로 데이터 (이미 보유): **개인 대상 복지서비스 900건+** — 현재 폐기 중
- 보조금24 데이터 (이미 보유): 5,000건 중 **상당수가 개인 대상**
- 정부지원 검색 수요: 복지로 월 방문 500만+, 정부24 월 방문 2,000만+
- 기존 인프라 90% 재사용 가능 (Next.js, Supabase, 동기화 파이프라인)

---

## 2. 새로운 서비스 컨셉

### 서비스명 후보
1. **혜택찾기** — 직관적, 검색 친화
2. **내 혜택** — 개인화 강조
3. **지원금 찾기** — 현재 이름 확장

### 핵심 가치
> "30초 안에 나한테 맞는 정부 혜택을 찾아드립니다"

### 사용자 유형 (2-Track)

```
┌─────────────────────────────────────────────┐
│           어떤 분이신가요?                    │
│                                             │
│  ┌──────────────┐   ┌──────────────┐       │
│  │  👤 개인      │   │  🏢 사업자    │       │
│  │  (일반인)     │   │  (소상공인)   │       │
│  └──────────────┘   └──────────────┘       │
└─────────────────────────────────────────────┘
         │                    │
    개인 진단 폼         사업자 진단 폼
    (6개 질문)           (6개 질문, 기존)
         │                    │
    통합 매칭 엔진 ←──────────┘
         │
    맞춤 결과 (티어별)
```

---

## 3. 사용자 페르소나 & 입력 차원

### Track A: 개인 (일반인)

| 차원 | 입력 방식 | 선택지 | 용도 |
|------|----------|--------|------|
| **연령대** | 라디오 | 20대/30대/40대/50대/60대+ | 청년정책, 노인복지 매칭 |
| **지역** | 드롭다운 | 17개 시도 | 지역 복지 매칭 |
| **가구 유형** | 라디오 | 1인/신혼부부/영유아가구/다자녀/한부모/일반 | 가족 복지 매칭 |
| **소득 수준** | 라디오 | 기초생활/차상위/중위50%이하/중위100%이하/중위100%초과 | 소득 기반 복지 |
| **취업 상태** | 라디오 | 재직자/구직자/학생/자영업/무직/은퇴 | 고용 지원 매칭 |
| **관심 분야** | 멀티셀렉트 | 주거/육아/교육/취업/건강/생활안정/문화 | 탐색 필터 |

### Track B: 사업자 (소상공인) — 기존 유지

| 차원 | 입력 방식 | 현행 유지 |
|------|----------|----------|
| 업종 | 콤보박스 | 13개 업종 |
| 지역 | 드롭다운 | 17개 시도 |
| 직원 수 | 라디오 | 6단계 |
| 연매출 | 라디오 | 6단계 |
| 업력 | 라디오 | 6단계 |
| 대표자 연령 | 라디오 | 5단계 |

---

## 4. 데이터 모델 재설계

### 4.1 `supports` 테이블 확장

```sql
-- 기존 필드 유지 + 새 필드 추가
ALTER TABLE supports ADD COLUMN IF NOT EXISTS
  service_type TEXT DEFAULT 'business';
  -- 'business': 사업자 대상
  -- 'personal': 개인 대상
  -- 'both': 양쪽 모두

ALTER TABLE supports ADD COLUMN IF NOT EXISTS
  target_age_min INTEGER;        -- 대상 연령 최소
ALTER TABLE supports ADD COLUMN IF NOT EXISTS
  target_age_max INTEGER;        -- 대상 연령 최대
ALTER TABLE supports ADD COLUMN IF NOT EXISTS
  target_household_types TEXT[];  -- ['1인', '다자녀', '한부모', '신혼부부', ...]
ALTER TABLE supports ADD COLUMN IF NOT EXISTS
  target_income_level TEXT[];     -- ['기초생활', '차상위', '중위50%이하', ...]
ALTER TABLE supports ADD COLUMN IF NOT EXISTS
  target_employment_status TEXT[]; -- ['구직자', '재직자', '학생', ...]
ALTER TABLE supports ADD COLUMN IF NOT EXISTS
  benefit_categories TEXT[];      -- ['주거', '육아', '교육', '취업', '건강', ...]
```

### 4.2 `diagnoses` 테이블 확장

```sql
ALTER TABLE diagnoses ADD COLUMN IF NOT EXISTS
  user_type TEXT DEFAULT 'business';  -- 'personal' | 'business'
ALTER TABLE diagnoses ADD COLUMN IF NOT EXISTS
  age_group TEXT;               -- '20대', '30대', ...
ALTER TABLE diagnoses ADD COLUMN IF NOT EXISTS
  household_type TEXT;          -- '1인', '다자녀', ...
ALTER TABLE diagnoses ADD COLUMN IF NOT EXISTS
  income_level TEXT;            -- '기초생활', '차상위', ...
ALTER TABLE diagnoses ADD COLUMN IF NOT EXISTS
  employment_status TEXT;       -- '재직자', '구직자', ...
ALTER TABLE diagnoses ADD COLUMN IF NOT EXISTS
  interest_categories TEXT[];   -- ['주거', '육아', ...]
```

### 4.3 기존 필드 보존
- `target_business_types`, `target_employee_*`, `target_revenue_*`, `target_business_age_*` → 사업자 트랙 전용 (유지)
- `target_regions` → 양쪽 공용 (유지)
- `target_founder_age_*` → `target_age_*`로 통합 가능 (개인 연령 = 대표자 연령)

---

## 5. 매칭 알고리즘 v4 설계

### 5.1 듀얼 트랙 매칭

```typescript
function matchSupportsV4(supports: Support[], input: UserInput): MatchResult {
  // 1. 트랙별 필터링
  const candidates = supports.filter(s => {
    if (input.userType === 'personal') return s.serviceType !== 'business'
    if (input.userType === 'business') return s.serviceType !== 'personal'
    return true
  })

  // 2. 트랙별 차원 선택
  const dimensions = input.userType === 'personal'
    ? getPersonalDimensions(input)
    : getBusinessDimensions(input)

  // 3. 동일한 3단계 파이프라인 (v3 재사용)
  // Knockout → Score Only What You Know → Coverage Factor
}
```

### 5.2 개인 트랙 차원

| 차원 | 가중치 | Knockout 조건 |
|------|--------|--------------|
| 지역 | 0.20 | 명시 지역 + 유저 미포함 |
| 연령 | 0.25 | 유저 > max+5 또는 < min-5 |
| 가구 유형 | 0.20 | 명시 가구 + 유저 미포함 |
| 소득 수준 | 0.20 | 명시 소득 + 유저 초과 |
| 취업 상태 | 0.15 | 명시 상태 + 유저 미포함 |

### 5.3 관심 분야 부스트
- 유저가 선택한 `interest_categories`와 지원사업의 `benefit_categories` 일치 시 +0.15 보너스
- 이 보너스는 Coverage Factor 적용 후 가산

### 5.4 v3 파이프라인 재사용
- Business Relevance Filter → **Service Type Filter**로 대체
- Knockout / Score Only What You Know / Coverage Factor → 동일 로직
- Specificity Cap / Org Diversity → 동일 적용
- Tier 시스템 (tailored/recommended/exploratory) → 동일

---

## 6. 데이터 소스 전략

### 현재 소스 재분류

| 소스 | 사업자 | 개인 | 상태 | 변경 |
|------|--------|------|------|------|
| Bokjiro Central | ✗ | ✓ | 900건 | service_type='personal' 태깅 |
| Subsidy24 | ✓ | ✓ | 5,000건 | 개별 분류 필요 |
| MSIT R&D | ✓ | ✗ | 364건 | service_type='business' 태깅 |
| K-Startup | ✓ | ✗ | 0건 (403) | 해결 후 business 태깅 |

### 신규 소스 (Phase 2+)

| 소스 | 대상 | API | 예상 레코드 |
|------|------|-----|-----------|
| 복지로 맞춤형 API | 개인 | api.bokjiro.go.kr | 10,000+ |
| 청년정책 | 청년 | youthcenter.go.kr | 500+ |
| 고용24 | 구직자 | work24.go.kr | 1,000+ |
| 여성가족부 | 가족 | mogef.go.kr | 300+ |

### 추출 파이프라인 확장

현재 `src/lib/extraction/index.ts`에 개인 차원 추출기 추가:
- `extractTargetAge()` — "청년(만 19~34세)" → { min: 19, max: 34 }
- `extractHouseholdTypes()` — "다자녀가구" → ["다자녀"]
- `extractIncomeLevel()` — "기준 중위소득 50% 이하" → ["중위50%이하"]
- `extractEmploymentStatus()` — "실업자, 구직자" → ["구직자"]
- `extractBenefitCategories()` — 제목/내용 기반 분류

---

## 7. UI/UX 플로우

### 7.1 랜딩 페이지 (/)
```
┌─────────────────────────────────────────┐
│                                         │
│   나에게 맞는 정부 혜택,                 │
│   30초면 찾아드립니다                    │
│                                         │
│   ┌─────────────┐ ┌─────────────┐      │
│   │  👤 개인     │ │  🏢 사업자   │      │
│   │  혜택 찾기   │ │  지원금 찾기  │      │
│   └─────────────┘ └─────────────┘      │
│                                         │
│   ✓ 6,000+ 정부 지원사업 데이터         │
│   ✓ 30초 간편 진단                      │
│   ✓ 맞춤형 결과 제공                    │
│                                         │
└─────────────────────────────────────────┘
```

### 7.2 진단 폼 (/diagnose?type=personal | /diagnose?type=business)
- 유형별 다른 질문 세트
- 6단계 프로그레스 바 (동일 UX)
- 30초 목표 (모든 필드 선택형)

### 7.3 결과 페이지 (/result/[id])
- 기존 v3 UI 재사용 (tier sections, cards, expand/collapse)
- 개인 트랙: 카테고리 필터 추가 (주거/육아/교육/취업/건강)
- 사업자 트랙: 기존과 동일

---

## 8. 기술 아키텍처 변경

### 재사용 (변경 없음)
- Next.js 16 + App Router
- Supabase (DB + Auth)
- Tailwind 4
- Vercel 배포
- fetchWithRetry, sync pipeline
- shadcn/ui components

### 수정
| 파일/영역 | 변경 내용 |
|----------|----------|
| `src/types/index.ts` | `UserInput` 유니언 타입, `Support` 확장 필드 |
| `src/lib/matching-v4.ts` | 듀얼 트랙 매칭 엔진 (v3 로직 재사용) |
| `src/lib/extraction/index.ts` | 개인 차원 추출기 추가 |
| `src/components/diagnose-form.tsx` | 유형 선택 + 조건부 폼 필드 |
| `src/app/diagnose/page.tsx` | `?type=personal|business` 쿼리 파라미터 |
| `src/app/api/diagnose/route.ts` | 유형별 분기 매칭 |
| `src/lib/supabase/types.ts` | 새 필드 타입 |
| `src/lib/supabase/mappers.ts` | 새 필드 매핑 |
| `src/constants/index.ts` | 개인 차원 옵션 추가 |
| `supabase/migrations/00010_*.sql` | 새 컬럼 마이그레이션 |

### 신규 생성
| 파일 | 용도 |
|------|------|
| `src/lib/extraction/age-patterns.ts` | 연령 추출 패턴 |
| `src/lib/extraction/household-patterns.ts` | 가구 유형 추출 |
| `src/lib/extraction/income-patterns.ts` | 소득 수준 추출 |
| `src/lib/extraction/employment-patterns.ts` | 취업 상태 추출 |
| `src/lib/extraction/category-patterns.ts` | 혜택 카테고리 분류 |
| `src/lib/fetchers/welfare-api.ts` | 복지로 맞춤형 API 페처 (Phase 2) |

---

## 9. 실행 로드맵

### Phase 1: MVP (1주) — 데이터 재분류 + 개인 트랙 기본

| Step | 작업 | 우선순위 |
|------|------|---------|
| 1 | DB 마이그레이션: 새 컬럼 추가 | P0 |
| 2 | 기존 데이터 `service_type` 분류 (bokjiro→personal, msit→business) | P0 |
| 3 | 개인 차원 추출기 구현 (age, household, income, employment) | P0 |
| 4 | 기존 bokjiro 데이터 재추출 (개인 차원) | P0 |
| 5 | 매칭 v4 구현 (듀얼 트랙) | P0 |
| 6 | 진단 폼 유형 분기 (개인/사업자) | P0 |
| 7 | 랜딩 페이지 업데이트 | P1 |
| 8 | 결과 페이지 카테고리 필터 | P1 |

### Phase 2: 데이터 확장 (2주)
- 복지로 맞춤형 API 연동
- 청년정책 API 연동
- 고용24 API 연동
- Bizinfo 95k건 동기화 + 분류
- 추출 파이프라인 정확도 개선

### Phase 3: 고도화 (4주)
- 사용자 계정 + 저장/알림
- 주기적 새 혜택 알림
- 상세 혜택 정보 페이지 (외부 링크 대신 내부)
- SEO 최적화 (혜택별 정적 페이지)

---

## 10. 핵심 결정 사항 (Isaac 승인 필요)

| # | 결정 | 옵션 | 추천 |
|---|------|------|------|
| 1 | 서비스명 | 혜택찾기 / 내 혜택 / 지원금 찾기 | 혜택찾기 |
| 2 | 도메인/URL 변경 | 현행 유지 / 새 도메인 | 현행 유지 후 Phase 3에서 변경 |
| 3 | 개인 Track 먼저 | 개인→사업자 순 / 동시 | 동시 (기존 사업자 유지하면서 개인 추가) |
| 4 | DB 마이그레이션 전략 | 새 컬럼 추가 (호환) / 테이블 분리 | 새 컬럼 추가 (안전) |
| 5 | Phase 1 MVP 범위 | 개인 기본 매칭만 / 카테고리 필터 포함 | 기본 매칭 + 카테고리 필터 |

---

## 부록: 현재 코드베이스 재사용 분석

### 그대로 유지 (95%)
- `src/app/layout.tsx`, SEO, 메타데이터
- `src/components/ui/*` (shadcn)
- `src/lib/fetch-with-retry.ts`
- `src/lib/supabase/server.ts`, `client.ts`
- `src/lib/dedup.ts`
- 모든 fetcher 파일 (데이터 수집 파이프라인)
- `src/app/api/sync/*` (동기화 라우트)
- `src/app/api/cron/sync/route.ts`

### 수정 (핵심 변경)
- `src/lib/matching-v3.ts` → v4로 확장 (dual track)
- `src/components/diagnose-form.tsx` → 유형 분기
- `src/components/support-list.tsx` → 카테고리 필터 추가
- `src/app/api/diagnose/route.ts` → 유형별 매칭
- `src/types/index.ts` → 새 타입

### 신규 생성
- `src/lib/matching-v4.ts` (또는 v3 확장)
- `src/lib/extraction/` 5개 새 추출기
- `supabase/migrations/00010_*.sql`
