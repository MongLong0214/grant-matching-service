# region_scope 3단계 지역 분류 — 구현 상세 문서

> 작성일: 2026-02-18 | 브랜치: `add` | 커밋: `3fe1b91`
> 변경 파일: 39개 (+3,121 / -725)

---

## 1. 문제 정의

### 배경

전체 18,693 supports 중 11,487건(61.5%)이 `target_regions=[]`였다.
기존 매칭 엔진은 **빈 지역 = 전국**으로 취급했으나, 실제로는:

| 분류 | 건수 | 설명 |
|------|------|------|
| 진짜 전국 | ~2,500건 | 중앙정부/부처 정책 |
| 지역 추출 실패 | ~9,000건 | 기관명/텍스트에서 지역 미추출 |

**결과**: 인천 유저에게 경상북도 정책이 추천되는 등 신뢰도 저하.

### 근본 원인 3가지

1. `organization` 필드에서 지역 미추출 (예: "경상북도 김천시" → 빈 regions)
2. Source API에 지역 필드가 있지만 사용 안 함 (수행기관, rsdAreaPamtEqltIstm 등)
3. `target_regions=[]` = "전국"이라는 잘못된 가정

---

## 2. 설계: region_scope 3단계

```
national  → 확인된 전국 (중앙정부/부처, "전국" 키워드)  → score 1.0
regional  → 확인된 지역 (API 필드, org, 텍스트에서 추출)  → 기존 매칭 로직
unknown   → 지역 불명 (어디서도 추출 실패)               → score 0.3 + tailored 진입 불가
```

### 매칭 동작 변경

| region_scope | 지역 일치 | 지역 불일치 | knockout | tier 제한 |
|-------------|----------|-----------|----------|-----------|
| national | 1.0 | 1.0 | 없음 | 없음 |
| regional | 1.0 | **0.0 (knockout)** | 있음 | 없음 |
| unknown | **0.3** | **0.3** | 없음 | **tailored 불가** |

### 핵심 결정 근거

- **unknown = 0.3 (0.5가 아닌 이유)**: 0.5일 때 top-tier의 75.6%가 unknown으로 점유 → 0.3으로 낮추어 verified 정책과 격차 확대
- **tailored 진입 차단**: "맞춤"이라 표시된 정책은 지역이 확인된 것만. unknown은 "추천/탐색"에서 노출
- **knockout 안 함**: unknown은 지역을 모르므로 탈락시키면 오탈락 위험. 점수 패널티로 안전하게 처리

---

## 3. 변경 파일 전체 목록

### Phase 1: DB + 타입 (Foundation)

| 파일 | 변경 | 설명 |
|------|------|------|
| `supabase/migrations/00013_add_region_scope.sql` | **신규** | `region_scope TEXT NOT NULL DEFAULT 'unknown'` 컬럼 추가 |
| `src/lib/supabase/types.ts` | 수정 | Row/Insert에 `region_scope` 타입 추가 |
| `src/lib/supabase/mappers.ts` | 수정 | `regionScope: row.region_scope` 매핑 |
| `src/types/index.ts` | 수정 | `RegionScope` 타입 + Support.regionScope 추가 |

### Phase 2: Extraction 개선

| 파일 | 변경 | 설명 |
|------|------|------|
| `src/lib/extraction/region-scope.ts` | **신규** | `determineRegionScope()` + `NATIONAL_KEYWORDS` + `NATIONAL_TEXT_PATTERNS` |
| `src/lib/extraction/region-dictionary.ts` | 수정 | `preprocessOrgForRegion()` 추가 — 기관명에서 지역 추출 전처리 |
| `src/lib/extraction/index.ts` | 수정 | org 파라미터 추가, regionScope 판정 로직 통합 |

### Phase 3: 매칭 로직

| 파일 | 변경 | 설명 |
|------|------|------|
| `src/lib/matching-v4/scores.ts` | 수정 | `scoreRegionWithDistrict()`에 regionScope 파라미터 추가 |
| `src/lib/matching-v4/dimensions.ts` | 수정 | regionScope 전달 + knockout 조건 변경 |
| `src/lib/matching-v4/index.ts` | 수정 | unknown → tailored 진입 차단 추가 |

### Phase 4: Fetchers (10개)

| 파일 | 변경 | organization 소스 |
|------|------|-------------------|
| `src/lib/fetchers/bokjiro-central.ts` | 수정 | `item.jurMnofNm` |
| `src/lib/fetchers/bokjiro-local.ts` | 수정 | `item.ctpvNm` (기존) + title 전달 수정 |
| `src/lib/fetchers/subsidy24.ts` | 수정 | `item.부서명` |
| `src/lib/fetchers/small-loan-finance.ts` | **리팩터링** | `item.ofrInstNm` |
| `src/lib/fetchers/msit-rnd.ts` | 수정 | `item.deptName` |
| `src/lib/fetchers/kstartup.ts` | 수정 | `item.pbancRceptInsttNm` |
| `src/lib/fetchers/sme-biz-announcement.ts` | **리팩터링** | `item.insttNm \|\| item.jrsdInsttNm` |
| `src/lib/fetchers/social-finance.ts` | **리팩터링** | `item.operInstNm \|\| item.sprvsnInstNm` |
| `src/lib/fetchers/loan-comparison.ts` | **리팩터링** | `item.fnc_instt_nm` |
| `src/lib/bizinfo.ts` | 수정 | `program.소관기관` + `program.수행기관` |

### Phase 5: 공통 유틸 추출

| 파일 | 변경 | 설명 |
|------|------|------|
| `src/lib/fetchers/sync-helpers.ts` | **신규** | 싱크 로그, XML 파싱, JSON 파싱, upsert 공통 유틸 |

### Phase 6: 스크립트

| 파일 | 변경 | 설명 |
|------|------|------|
| `scripts/retag-all-dimensions.ts` | 수정 | regionScope 산출 + 업데이트 로직 추가 |
| `scripts/audit-sub-region-3000.ts` | **신규** | 3000케이스 구/군 전수조사 스크립트 |
| `scripts/audit-region-scope.ts` | **신규** | region_scope 분포 감사 스크립트 |
| `scripts/simulate-incheon-user.ts` | 수정 | regionScope 표시 추가 |

### Phase 7: UI/API

| 파일 | 변경 | 설명 |
|------|------|------|
| `src/components/ui/region-selector.tsx` | **신규** | 구/군 선택 UI 컴포넌트 |
| `src/components/business-form.tsx` | 수정 | subRegion 선택 추가 |
| `src/components/personal-form.tsx` | 수정 | subRegion 선택 추가 |
| `src/app/api/diagnose/route.ts` | 수정 | subRegion 처리 추가 |
| `src/lib/diagnosis.ts` | 수정 | subRegion 저장 |
| `src/constants/index.ts` | 수정 | REGION_DISTRICTS 상수 추가 |

---

## 4. 핵심 함수 상세

### 4.1 `determineRegionScope()`

```
파일: src/lib/extraction/region-scope.ts
```

**판정 순서:**
1. `regions.length > 0` → `'regional'`
2. 텍스트에 "전국/전지역/지역 제한 없/지역 무관" → `'national'`
3. organization이 `'중앙정부'` → `'national'`
4. organization에 NATIONAL_KEYWORDS 포함 → `'national'`
5. 그 외 → `'unknown'`

**NATIONAL_KEYWORDS (26개):**
```
국방부, 법무부, 환경부, 과학기술, 중소벤처기업부, 산업통상자원부,
고용노동부, 보건복지부, 국토교통부, 농림축산식품부, 해양수산부,
문화체육관광부, 교육부, 여성가족부, 행정안전부, 기획재정부,
금융위원회, 공정거래위원회, 국세청, 병무청, 통계청, 소방청,
특허청, 산림청, 기상청, 조달청
```

### 4.2 `preprocessOrgForRegion()`

```
파일: src/lib/extraction/region-dictionary.ts
```

기관명에서 지역 추출 전 처리. 2글자 시/도명이 기관명에 직접 붙은 패턴 분리.

```
"대전신용보증재단" → "대전 신용보증재단"  (경계 체크 통과)
"경북신용보증재단" → "경북 신용보증재단"
"서울시설공단"     → "서울 시설공단"
```

SIDO_SHORT: 서울/부산/대구/인천/광주/대전/울산/세종/경기/강원/충북/충남/전북/전남/경북/경남/제주

### 4.3 `scoreRegionWithDistrict()`

```
파일: src/lib/matching-v4/scores.ts
```

| regionScope | 반환값 | 조건 |
|-------------|--------|------|
| national | 1.0 | 무조건 |
| unknown | 0.3 | 무조건 |
| regional, regions=[] | 1.0 | 안전 폴백 |
| regional, region 불일치 | 0.0 | knockout |
| regional, region 일치, subRegions=[] | 1.0 | 시/도 매칭 |
| regional, region 일치, user subRegion 없음 | 0.85 | 구/군 미선택 패널티 |
| regional, region+subRegion 일치 | 1.0 | 완벽 매칭 |
| regional, region 일치, subRegion 불일치 | 0.75 | 같은 시/도, 다른 구/군 |

### 4.4 `scoreSupport()` — tailored 진입 제한

```
파일: src/lib/matching-v4/index.ts (line 101)
```

```typescript
if (support.regionScope === 'unknown' && tier === 'tailored') tier = 'recommended'
```

unknown 정책은 다른 차원이 아무리 높아도 tailored에 올라가지 않음.
→ "맞춤" = 지역이 확인된 정책만 보장.

### 4.5 `sync-helpers.ts` 공통 유틸

| 함수 | 용도 | 사용처 |
|------|------|--------|
| `createSyncClient()` | Supabase 서비스 클라이언트 | 4개 fetcher |
| `startSyncLog()` | 싱크 시작 로그 | 4개 fetcher |
| `completeSyncLog()` | 싱크 완료 로그 | 4개 fetcher |
| `failSyncLog()` | 싱크 실패 로그 | 4개 fetcher |
| `upsertSupport()` | supports 테이블 upsert | 4개 fetcher |
| `getXmlField()` | XML 태그 값 추출 (CDATA 지원) | 2개 XML fetcher |
| `parseXmlItems()` | XML `<item>` 블록 파싱 + 에러 체크 | 2개 XML fetcher |
| `parseJsonItems<T>()` | data.go.kr JSON 응답 파싱 | 4개 fetcher |
| `parseDate()` | YYYYMMDD → ISO 날짜 | sme-biz-announcement |

---

## 5. DB 마이그레이션

### 00013_add_region_scope.sql

```sql
ALTER TABLE supports ADD COLUMN region_scope TEXT NOT NULL DEFAULT 'unknown';
UPDATE supports SET region_scope = 'regional'
  WHERE target_regions IS NOT NULL AND array_length(target_regions, 1) > 0;
```

- 실행 방법: `npx supabase db push --linked`
- 적용일: 2026-02-17
- 롤백: `ALTER TABLE supports DROP COLUMN region_scope;`

### 마이그레이션 후 재태깅

```bash
npx tsx scripts/retag-all-dimensions.ts
```

결과:
- 3,126건 업데이트
- 분포: national 2,656 (14.2%) / regional 7,660 (41.0%) / unknown 8,377 (44.8%)

---

## 6. 가디언 코드 리뷰 결과 및 수정

3명의 guardian 에이전트가 병렬 리뷰 (types+extraction / matching / fetchers).
15건 이슈 발견 → 전체 수정 완료.

### P0 (Critical) — 1건

| 파일 | 이슈 | 수정 |
|------|------|------|
| `bizinfo.ts` | `service_type` 누락 + 개인트랙 필드 6개 미전달 | `service_type: 'business'` + 6개 필드 추가 |

### P1 (High) — 5건

| 파일 | 이슈 | 수정 |
|------|------|------|
| `region-scope.ts` | NATIONAL_KEYWORDS에 국방부/법무부 누락 | 2개 추가 (26개로 확대) |
| `msit-rnd.ts` | 개인트랙 필드 6개 누락 | target_age_min 등 6개 추가 |
| `bokjiro-local.ts` | extractEligibility title 파라미터 undefined | `item.servNm` 전달 |
| NATIONAL_TEXT_PATTERNS | region-dictionary.ts와 불일치 (오탐) | 검증 결과 false positive — 수정 불필요 |

### P2 (Medium) — 8건

| 파일 | 이슈 | 수정 |
|------|------|------|
| `scores.ts` | import 위치 파일 중간 | 파일 상단으로 이동 |
| `scores.ts` | 미사용 `scoreRegion()` 잔존 | 삭제 |
| `scores.ts` | 영문 주석 "safety fallback" | "안전 폴백" 한글로 |
| `sme-biz-announcement.ts` | 영문 주석 3건 | 한글로 변환 |
| `loan-comparison.ts` | 영문 주석 3건 | 한글로 변환 |
| `extraction/index.ts` | 200줄 초과 | determineRegionScope → region-scope.ts 분리 |
| 4개 fetcher | 200줄 초과 (225~277줄) | sync-helpers.ts 추출 (115~164줄로 축소) |

### P3 (Low) — 1건

| 파일 | 이슈 | 수정 |
|------|------|------|
| `dimensions.ts` | 중복 scope 변수 선언 패턴 | 코드 정리 |

---

## 7. 3000케이스 전수조사 결과

### 테스트 구성

| 구분 | 케이스 수 | 설명 |
|------|----------|------|
| Personal Type A | 750 | 구/군 일치 검증 (유효한 sub-region 조합) |
| Personal Type B | 450 | 영향 없음 검증 (supports 없는 sub-region 조합) |
| Personal Type C | 300 | 미선택 fallback 검증 (subRegion=undefined) |
| Business Type A | 750 | 구/군 일치 검증 |
| Business Type B | 450 | 영향 없음 검증 |
| Business Type C | 300 | 미선택 fallback 검증 |
| **합계** | **3,000** | |

### 안전 지표 (전부 통과)

| 지표 | 결과 | 의미 |
|------|------|------|
| **Region FP** | **0건 / 29,825건 (0.0000%)** | 다른 시/도 정책이 절대 오추천되지 않음 |
| **Cross-Track** | **0건 / 191,008건 (0.0000%)** | personal↔business 교차 오추천 없음 |
| **Zero-Match** | **0건 / 3,000명 (0.0%)** | 모든 유저가 결과를 받음 |

### 매칭 품질 지표

| 지표 | 결과 | 의미 |
|------|------|------|
| **Score Lift** | **+0.4235** | 구/군 선택 시 관련 정책 점수 42% 상승 |
| **Differentiation** | **47.3%** | 같은 시/도 내 다른 구/군 → 결과 절반 달라짐 |
| **Type B No-Impact** | **96.8%** | 관련 없는 구/군 선택 → 결과 거의 안 변함 |

### tier별 unknown 비율

| tier | unknown 비율 | 의미 |
|------|-------------|------|
| **tailored (맞춤)** | **0.0%** | 지역 확인된 정책만 |
| recommended (추천) | 92.0% | unknown 정책은 여기서 노출 |
| 합계 | 58.6% | 변경 전 75.6%에서 개선 |

### Precision/Recall 해석 주의

감사 스크립트의 Precision/Recall (9.7%)은 **"유저의 구/군과 일치하는 모든 support"**를 관련 support로 카운트한다. 하지만 대부분은 **다른 차원(나이/소득/업종 등)에서 정당하게 탈락**한 것이므로, 이 수치가 낮은 것은 정상이다. 매칭 품질의 진짜 지표는 Region FP (0%)와 Score Lift (+0.42).

---

## 8. region_scope 분포

### 소스별

| Source | 전체 | national | regional | unknown |
|--------|------|----------|----------|---------|
| bizinfo | ~5,000 | 수행기관 추가로 개선 | 66% | 나머지 |
| small-loan-finance | ~4,986 | - | 50% | 나머지 |
| subsidy24 | ~4,615 | 부처 키워드 | 18% | 나머지 |
| sme-biz-announcement | ~1,964 | - | 1% | 대부분 |
| bokjiro-central | ~999 | - | 18% | 나머지 |
| msit-rnd | ~364 | 과학기술 → national | 0% | 나머지 |
| loan-comparison | ~426 | - | 51% | 나머지 |
| social-finance | ~467 | - | 45% | 나머지 |

### 전체 분포

```
national:  2,656건 (14.2%)  — 중앙정부/부처 확인
regional:  7,660건 (41.0%)  — 지역 추출 성공
unknown:   8,377건 (44.8%)  — 지역 불명 (점수 패널티)
```

---

## 9. 고도화 로드맵

### 9.1 unknown 비율 줄이기 (extraction 개선)

현재 unknown 8,377건(44.8%)을 줄이면 서비스 품질이 직접 향상된다.

**우선순위 높음:**
- **subsidy24** (4,615건, 18% 추출률): 구조화된 지역 필드 활용 가능성 조사
- **sme-biz-announcement** (1,964건, 1% 추출률): `dataContents` 본문에서 지역 힌트 추출 강화
- **bokjiro-central** (999건, 18% 추출률): `jurMnofNm` 파싱 개선

**접근 방법:**
1. 각 API의 응답 필드 중 미사용 지역 필드 조사
2. `preprocessOrgForRegion()` 패턴 확장 (3글자 지역명 등)
3. 본문 텍스트에서 "○○시/○○구 소재" 패턴 추출 추가

### 9.2 unknown 점수 튜닝

현재 0.3. 데이터 기반으로 조정 가능:
- unknown 중 실제 전국인 비율 → 높으면 0.3 유지 또는 상향
- unknown 중 지역 한정인 비율 → 높으면 0.2로 하향
- 방법: unknown supports를 수동 샘플링(100건)하여 실제 지역 분포 확인

### 9.3 구/군 데이터 확충

현재 sub-region supports: 2,942건 (15.7%). 시/도별 불균형:
- 경기: 621건 (풍부)
- 대전: 27건 (부족)
- 제주: 21건 (부족)
- 세종: 0건

**개선 방안:**
- 기관명에서 시/군/구 추출 강화 (현재 preprocessOrgForRegion은 시/도만 처리)
- 본문의 "○○구 거주자" 패턴 추출 추가
- 복지로 API의 `ctpvNm` + `sggNm` 필드 활용 확대

### 9.4 매칭 알고리즘 개선

- **sub-region 보너스 조정**: 현재 +0.08 고정. 구/군 데이터 밀도에 따라 동적 조정 검토
- **coverage factor 개선**: unknown region이 coverage에 기여하는 비중 조정
- **interest category 매칭 강화**: benefitCategories 추출 정확도 높이면 개인 트랙 차별화 강화

### 9.5 프론트엔드 개선

- 결과 화면에 `region_scope` 뱃지 표시 ("내 지역" / "전국" / "확인 필요")
- unknown 정책에 "이 정책의 지역 정보가 확인되지 않았습니다" 안내 추가
- 구/군 선택 시 "내 구/군 맞춤 정책 N건" 카운트 표시

---

## 10. 실행 명령어 모음

```bash
# 전체 재태깅 (region_scope + 모든 차원)
npx tsx scripts/retag-all-dimensions.ts

# 3000케이스 전수조사
npx tsx scripts/audit-sub-region-3000.ts

# region_scope 분포 감사
npx tsx scripts/audit-region-scope.ts

# 인천 유저 시뮬레이션
npx tsx scripts/simulate-incheon-user.ts

# 빌드 3종 검증
npx tsc --noEmit && npx eslint . && npx next build

# DB 마이그레이션 적용
npx supabase db push --linked

# region_scope 롤백
# 1. scores.ts: return 0.3 → return 0.5
# 2. index.ts: unknown tailored 차단 라인 삭제
# 3. DB: ALTER TABLE supports DROP COLUMN region_scope;
```

---

## 11. 파일 줄 수 (200줄 규칙 준수)

| 파일 | 줄 수 | 상태 |
|------|-------|------|
| extraction/index.ts | 188 | ✅ |
| extraction/region-scope.ts | 35 | ✅ |
| matching-v4/scores.ts | 132 | ✅ |
| matching-v4/dimensions.ts | 151 | ✅ |
| matching-v4/index.ts | 186 | ✅ |
| fetchers/sync-helpers.ts | 160 | ✅ |
| fetchers/sme-biz-announcement.ts | 164 | ✅ |
| fetchers/loan-comparison.ts | 159 | ✅ |
| fetchers/small-loan-finance.ts | 125 | ✅ |
| fetchers/social-finance.ts | 115 | ✅ |

---

## 12. 의존 관계 맵

```
extractEligibility(texts, title, organization)
  ├─ extractRegionsWithDistricts(regionText)     → regions, subRegions
  ├─ preprocessOrgForRegion(organization)         → 기관명 전처리
  ├─ determineRegionScope(regions, org, rawText)  → regionScope
  └─ validateExtraction(raw, withTitle)           → 후처리 검증

matchSupportsV4(supports, userInput)
  ├─ isServiceTypeMatch(support, userType)        → service_type 필터
  ├─ isKnockedOutBusiness/Personal(support, input)
  │   └─ regionScope === 'regional' 일 때만 knockout
  ├─ getBusinessDimensions / getPersonalDimensions
  │   └─ scoreRegionWithDistrict(regions, subRegions, regionScope, ...)
  └─ scoreSupport(support, dims, ...)
      └─ regionScope === 'unknown' → tier cap at 'recommended'

각 fetcher sync 함수
  ├─ extractEligibility(texts, title, organization)  → extraction 결과
  └─ record.region_scope = extraction.regionScope     → DB 저장
```
