# 개인 트랙 매칭 알고리즘 전수검증 결과

> 검증일: 2026-02-16
> 테스트 케이스: 200개
> 전체 활성 supports: 6364개
> 개인 트랙 대상: 5687개

---

## Executive Summary

**전체 품질 등급: F**

| 지표 | 결과 | 목표 | 판정 |
|------|------|------|------|
| 빈 결과 비율 | 0.0% (0건) | < 5% | PASS |
| 과다 매칭 비율 (100건+) | 43.5% (87건) | < 10% | FAIL |
| 저매칭 비율 (1-3건) | 0.0% (0건) | < 15% | PASS |
| NULL bias 후보 | 23개 | 0개 | WARN |
| 평균 매칭 건수 | 86.2 | 10-50 | WARN |

---

## 1. DB 데이터 현황

### 서비스 타입 분포

| 서비스 타입 | 건수 |
|------------|------|
| both | 415 |
| personal | 5272 |
| business | 677 |

### 개인 트랙 supports 필드 채움률

| 필드 | 채워진 건수 | 비율 |
|------|-----------|------|
| targetRegions | 62/5687 | 1.1% |
| targetAge (min/max) | 1441/5687 | 25.3% |
| targetHouseholdTypes | 586/5687 | 10.3% |
| targetIncomeLevels | 677/5687 | 11.9% |
| targetEmploymentStatus | 378/5687 | 6.6% |
| benefitCategories | 2826/5687 | 49.7% |
| extractionConfidence | 5687/5687 | 100.0% |

### extractionConfidence >= 0.3 (유효 데이터) 비율

| 차원 | 유효 건수 | 비율 |
|------|----------|------|
| regions | 62/5687 | 1.1% |
| age | 1220/5687 | 21.5% |
| householdTypes | 429/5687 | 7.5% |
| incomeLevels | 492/5687 | 8.7% |
| employmentStatus | 351/5687 | 6.2% |

---

## 2. 200개 케이스 통계 요약

### Tier별 매칭 건수 분포

| 지표 | Total | Tailored | Recommended | Exploratory |
|------|-------|----------|-------------|-------------|
| 평균 | 86.2 | 0.4 | 35.8 | 50.0 |
| 중위수 | 94.5 | 0 | 44.5 | 50 |
| 표준편차 | 15.7 | 0.9 | 15.6 | 0.0 |
| 최소 | 52 | 0 | 2 | 50 |
| 최대 | 100 | 7 | 50 | 50 |
| P10 | 61 | 0 | 11 | 50 |
| P25 | 72 | 0 | 22 | 50 |
| P75 | 100 | 1 | 50 | 50 |
| P90 | 100 | 1 | 50 | 50 |

### Knockout 분포

| 지표 | 값 |
|------|---|
| 평균 | 1658.1 |
| 중위수 | 1677 |
| 최소 | 1182 |
| 최대 | 2005 |

### Coverage Factor 분포

| 지표 | 값 |
|------|---|
| 평균 | 0.375 |
| 중위수 | 0.325 |
| 표준편차 | 0.090 |
| 최소 | 0.28 |
| 최대 | 0.82 |


### 전체 Score 분포

| 지표 | 값 |
|------|---|
| 평균 | 0.398 |
| 중위수 | 0.38 |
| 표준편차 | 0.081 |
| 최소 | 0.28 |
| 최대 | 0.813 |


---

## 3. 관심분야 보너스 효과

| 조건 | 케이스수 | 평균 매칭 | 평균 Tailored |
|------|---------|----------|-------------|
| 관심분야 있음 | 188 | 86.4 | 0.4 |
| 관심분야 없음 | 12 | 83.3 | 0.1 |

---

## 4. 차원별 분포 히트맵

### 지역별 평균 매칭 건수

| 지역 | 케이스 | 평균 매칭 |
|------|-------|----------|
| 제주 | 2 | 100.0 |
| 충북 | 8 | 93.4 |
| 전남 | 9 | 90.2 |
| 전북 | 8 | 89.5 |
| 대전 | 10 | 88.5 |
| 대구 | 13 | 88.4 |
| 서울 | 32 | 87.3 |
| 광주 | 10 | 86.9 |
| 경기 | 26 | 86.7 |
| 강원 | 9 | 86.3 |
| 인천 | 13 | 86.3 |
| 부산 | 16 | 84.2 |
| 경북 | 8 | 82.3 |
| 경남 | 12 | 82.1 |
| 울산 | 8 | 80.4 |
| 세종 | 8 | 80.1 |
| 충남 | 8 | 80.1 |

### 연령대별

| 연령대 | 케이스 | 평균 매칭 | 평균 Tailored |
|--------|-------|----------|-------------|
| 10대 | 33 | 95.8 | 0.5 |
| 20대 | 34 | 98.2 | 0.9 |
| 30대 | 34 | 84.3 | 0.1 |
| 40대 | 33 | 63.2 | 0.0 |
| 50대 | 33 | 80.4 | 1.1 |
| 60대이상 | 33 | 95.0 | 0.0 |

### 소득수준별

| 소득수준 | 케이스 | 평균 매칭 |
|---------|-------|----------|
| 기초생활 | 41 | 91.9 |
| 차상위 | 40 | 88.1 |
| 중위50이하 | 39 | 90.1 |
| 중위100이하 | 41 | 85.4 |
| 중위100초과 | 39 | 75.3 |

### 가구유형별

| 가구유형 | 케이스 | 평균 매칭 |
|---------|-------|----------|
| 1인 | 34 | 96.3 |
| 신혼부부 | 33 | 98.7 |
| 영유아 | 33 | 83.8 |
| 다자녀 | 33 | 63.0 |
| 한부모 | 33 | 81.0 |
| 일반 | 34 | 93.9 |

### 취업상태별

| 취업상태 | 케이스 | 평균 매칭 |
|---------|-------|----------|
| 재직자 | 33 | 96.2 |
| 구직자 | 33 | 98.7 |
| 학생 | 34 | 83.4 |
| 자영업 | 32 | 62.2 |
| 무직 | 35 | 81.4 |
| 은퇴 | 33 | 95.0 |

---

## 5. hasSpecificMatch 강등 분석

- 총 scored 건수: 17240
- hasSpecificMatch=false로 강등된 건수: 67 (0.4%)

> scorePipeline에서 hasSpecificMatch=false이면 tailored/recommended 점수라도 exploratory로 강등됩니다.
> 이는 모든 specific 차원(region, age, householdType, incomeLevel)이 rawScore < 0.8이거나 hasData=false일 때 발생합니다.

---

## 6. NULL Bias 후보 Supports

> 5개 차원 중 4개 이상이 NULL이면서 200개 프로필 중 100건 이상 매칭된 support

| NULL 차원 | 매칭 건수 | 평균 Score | 제목 | 기관 |
|----------|---------|-----------|------|------|
| 4/5 | 188/200 | 0.348 | 장애인 직업 능력 개발 지원 | 장애인고용과 |
| 4/5 | 177/200 | 0.346 | 보건소 한방진료 지원 | 건강관리과 |
| 4/5 | 172/200 | 0.348 | 긴급돌봄 지원 | 사회서비스사업과 |
| 4/5 | 164/200 | 0.348 | 양·한방 진료 지원 | 의료지원과 |
| 4/5 | 162/200 | 0.350 | 노숙인 등 복지 지원 | 자활정책과 |
| 4/5 | 158/200 | 0.387 | 귀농 농업창업 및 주택구입지원 사업 | 청년농육성정책팀 |
| 4/5 | 158/200 | 0.325 | 지역사랑상품권(결초보은상품권) | 경제정책실 |
| 4/5 | 157/200 | 0.325 | 장위석관 보건지소 만성질환관리사업 | 보건지소 |
| 4/5 | 152/200 | 0.347 | 서초구 마음건강검진 및 상담지원사업 | 건강관리과 |
| 4/5 | 150/200 | 0.373 | 산림재난대응단(산림병해충예찰방제단) 일자리 제공 | 산림병해충방제과 |
| 4/5 | 146/200 | 0.367 | 맞춤형농지지원사업 | 농지과 |
| 4/5 | 140/200 | 0.325 | 성북여성교실 | 여성가족과 |
| 4/5 | 139/200 | 0.352 | 물리치료 지원 | 보건행정과 |
| 4/5 | 130/200 | 0.359 | (광주광역시 북구) 장애인 평생교육이용권 지원 | 인권교육과 |
| 4/5 | 123/200 | 0.325 | 동두천사랑카드 구매할인 혜택 비용 지원 | 일자리경제과 |
| 4/5 | 113/200 | 0.383 | 맞춤형 성인발달장애인 교육 지원 | 노인장애인복지과 |
| 4/5 | 113/200 | 0.357 | 가사·간병 방문 지원 | 복지과 |
| 4/5 | 111/200 | 0.352 | 의료급여수급권자 일반건강검진비 지원 | 건강증진과 |
| 4/5 | 106/200 | 0.367 | 임실군장애인 평생교육이용권 지원 | 주민복지과 |
| 4/5 | 103/200 | 0.325 | 지역화폐(아산페이) | 지역경제과 |


---

## 7. 문제 케이스 Top 20

| # | 문제 유형 | 프로필 | 매칭 | T/R/E | KO | Avg Score |
|---|----------|--------|------|-------|------|-----------|
| 1 | LOW_DATA_HIGH_MATCH | P001: 10대 남성 서울 1인 기초생활 재직자 | 94 | 2/42/50 | 1323 | 0.411 |
| 2 | LOW_DATA_HIGH_MATCH | P003: 30대 남성 서울 영유아 중위50이하 학생 | 90 | 0/40/50 | 1636 | 0.386 |
| 3 | LOW_DATA_HIGH_MATCH | P004: 40대 여성 서울 다자녀 중위100이하 자영업 | 60 | 0/10/50 | 1822 | 0.336 |
| 4 | LOW_DATA_HIGH_MATCH | P005: 50대 남성 서울 한부모 중위100초과 무직 | 63 | 0/13/50 | 2001 | 0.353 |
| 5 | LOW_DATA_HIGH_MATCH | P007: 10대 남성 서울 1인 차상위 재직자 | 95 | 0/45/50 | 1323 | 0.393 |
| 6 | LOW_DATA_HIGH_MATCH | P009: 30대 남성 서울 영유아 중위100이하 학생 | 82 | 0/32/50 | 1671 | 0.378 |
| 7 | LOW_DATA_HIGH_MATCH | P010: 40대 여성 서울 다자녀 중위100초과 자영업 | 64 | 0/14/50 | 1947 | 0.340 |
| 8 | LOW_DATA_HIGH_MATCH | P011: 50대 남성 서울 한부모 기초생활 무직 | 83 | 3/30/50 | 1769 | 0.437 |
| 9 | LOW_DATA_HIGH_MATCH | P016: 40대 여성 서울 다자녀 기초생활 자영업 | 60 | 0/10/50 | 1757 | 0.333 |
| 10 | LOW_DATA_HIGH_MATCH | P017: 50대 남성 서울 한부모 차상위 무직 | 83 | 3/30/50 | 1769 | 0.382 |
| 11 | LOW_DATA_HIGH_MATCH | P021: 30대 남성 서울 영유아 기초생활 학생 | 74 | 0/24/50 | 1607 | 0.374 |
| 12 | LOW_DATA_HIGH_MATCH | P022: 40대 여성 서울 다자녀 차상위 자영업 | 60 | 0/10/50 | 1757 | 0.368 |
| 13 | LOW_DATA_HIGH_MATCH | P023: 50대 남성 서울 한부모 중위50이하 무직 | 90 | 0/40/50 | 1798 | 0.396 |
| 14 | LOW_DATA_HIGH_MATCH | P025: 10대 남성 서울 1인 중위100초과 재직자 | 95 | 0/45/50 | 1530 | 0.401 |
| 15 | LOW_DATA_HIGH_MATCH | P027: 30대 남성 서울 영유아 차상위 학생 | 75 | 0/25/50 | 1607 | 0.388 |
| 16 | LOW_DATA_HIGH_MATCH | P028: 40대 여성 서울 다자녀 중위50이하 자영업 | 67 | 0/17/50 | 1788 | 0.400 |
| 17 | LOW_DATA_HIGH_MATCH | P029: 50대 남성 서울 한부모 중위100이하 무직 | 79 | 0/29/50 | 1844 | 0.399 |
| 18 | LOW_DATA_HIGH_MATCH | P032: 20대 여성 경기 신혼부부 차상위 구직자 | 95 | 0/45/50 | 1652 | 0.399 |
| 19 | LOW_DATA_HIGH_MATCH | P033: 30대 남성 경기 영유아 중위50이하 학생 | 89 | 0/39/50 | 1639 | 0.379 |
| 20 | LOW_DATA_HIGH_MATCH | P034: 40대 여성 경기 다자녀 중위100이하 자영업 | 56 | 0/6/50 | 1824 | 0.354 |


---

## 8. 엣지 케이스 상세 분석


### EDGE-01: 20대 저소득 구직자 1인가구 (서울)

- **매칭 결과**: 100건 (T:2/R:48/E:50)
- **Knockout**: 1677건, **Filtered**: 677건
- **Score**: avg=0.449, max=0.743, min=0.325
- **관심분야 보너스**: 80건
- **차원 활성률**: region=1%, age=21%, householdType=8%, incomeLevel=9%, employmentStatus=6%

**Top Tailored:**
- [0.743] 평택시 청년 월세 지원 (coverage=0.685)
- [0.697] 국민취업지원제도 (coverage=0.64)



### EDGE-02: 30대 신혼부부 중위100이하 (지방)

- **매칭 결과**: 100건 (T:2/R:48/E:50)
- **Knockout**: 1707건, **Filtered**: 677건
- **Score**: avg=0.417, max=0.767, min=0.325
- **관심분야 보너스**: 58건
- **차원 활성률**: region=1%, age=21%, householdType=8%, incomeLevel=9%, employmentStatus=6%

**Top Tailored:**
- [0.767] 통합공공임대주택 공급 (coverage=0.685)
- [0.658] 청년주택드림 청약통장 (coverage=0.64)



### EDGE-03: 60대이상 은퇴 기초생활 1인가구

- **매칭 결과**: 100건 (T:0/R:50/E:50)
- **Knockout**: 1436건, **Filtered**: 677건
- **Score**: avg=0.472, max=0.640, min=0.325
- **관심분야 보너스**: 86건
- **차원 활성률**: region=1%, age=21%, householdType=8%, incomeLevel=9%, employmentStatus=6%



### EDGE-04: 10대 학생 (다자녀 가구)

- **매칭 결과**: 87건 (T:7/R:30/E:50)
- **Knockout**: 1182건, **Filtered**: 677건
- **Score**: avg=0.475, max=0.740, min=0.325
- **관심분야 보너스**: 74건
- **차원 활성률**: region=1%, age=21%, householdType=8%, incomeLevel=9%, employmentStatus=6%

**Top Tailored:**
- [0.740] 다자녀 학자금 지원 (coverage=0.64)
- [0.740] 환경기초시설 주변마을 주민자녀 장학금 (coverage=0.64)
- [0.676] 동구인재육성장학회 장학금 지원 (coverage=0.64)



### EDGE-05: 40대 한부모 차상위

- **매칭 결과**: 95건 (T:0/R:45/E:50)
- **Knockout**: 1790건, **Filtered**: 677건
- **Score**: avg=0.401, max=0.605, min=0.324
- **관심분야 보너스**: 49건
- **차원 활성률**: region=1%, age=21%, householdType=8%, incomeLevel=9%, employmentStatus=6%



### EDGE-06: 50대 무직 중위50이하

- **매칭 결과**: 75건 (T:0/R:25/E:50)
- **Knockout**: 1852건, **Filtered**: 677건
- **Score**: avg=0.388, max=0.605, min=0.298
- **관심분야 보너스**: 50건
- **차원 활성률**: region=1%, age=21%, householdType=8%, incomeLevel=9%, employmentStatus=6%



### EDGE-07: 여성 30대 영유아가구 경력단절

- **매칭 결과**: 100건 (T:0/R:50/E:50)
- **Knockout**: 1788건, **Filtered**: 677건
- **Score**: avg=0.371, max=0.586, min=0.303
- **관심분야 보너스**: 53건
- **차원 활성률**: region=1%, age=21%, householdType=8%, incomeLevel=9%, employmentStatus=6%



### EDGE-08: 20대 학생 중위100초과 (장학금)

- **매칭 결과**: 81건 (T:0/R:31/E:50)
- **Knockout**: 1805건, **Filtered**: 677건
- **Score**: avg=0.369, max=0.560, min=0.325
- **관심분야 보너스**: 24건
- **차원 활성률**: region=1%, age=21%, householdType=8%, incomeLevel=9%, employmentStatus=6%



---

## 9. 근본 원인 분석

### 핵심 문제: 극단적으로 낮은 데이터 채움률

200개 케이스 전수검증 결과, **과다 매칭(100건+)이 43.5%**로 목표(10% 미만)를 크게 초과합니다. 근본 원인은 알고리즘 자체가 아닌 **supports 데이터의 개인 트랙 필드 채움률이 극단적으로 낮다는 것**입니다.

| 차원 | hasData + conf >= 0.3 | 비율 | 영향 |
|------|----------------------|------|------|
| region | 62/5687 | **1.1%** | 98.9%의 support에서 지역 필터링 불가 |
| age | 1220/5687 | **21.5%** | 대부분 연령 매칭 불가 |
| householdType | 429/5687 | **7.5%** | 가구유형 차별화 거의 불가 |
| incomeLevel | 492/5687 | **8.7%** | 소득수준 필터링 약함 |
| employmentStatus | 351/5687 | **6.2%** | 취업상태 차별화 불가 |

**결과적 메커니즘:**
1. 5687개 support 중 대부분은 활성 차원이 1개(age)뿐
2. age만 활성이면 coverage factor = 0.1 + 0.9 * 0.25 = 0.325
3. age rawScore=1.0인 경우 finalScore = 1.0 * 0.325 = 0.325 > exploratory 임계값(0.20)
4. age에서 knockout이 안 되면(conf < 0.7) 대부분 exploratory로 통과
5. exploratory cap(50개)에 거의 항상 도달, recommended도 다수 통과

### 이를 뒷받침하는 증거

1. **Exploratory 표준편차 = 0.0**: 모든 200개 케이스에서 exploratory가 정확히 50개(cap) 도달
2. **Coverage factor 중위수 = 0.325**: age(weight=0.25) 1개만 활성인 패턴이 지배적 (0.1 + 0.9*0.25 = 0.325)
3. **Score 중위수 = 0.38**: 낮은 coverage에도 recommended 임계값(0.40)에 근접
4. **Knockout 평균 = 1658**: 5687개 중 1658개만 knockout (29%) -- 나머지 71%가 scoring 통과 시도
5. **NULL bias 후보 23개**: 5개 차원 중 4개가 NULL인데도 100건+ 매칭

### 차원별 차별화 능력 (200개 케이스 평균)

- **region**: 활성률 1%이므로 거의 모든 support에서 무력화
- **age**: 활성률 21.5%로 가장 높지만, 10대/20대/60대이상은 넓은 범위에 해당하여 높은 매칭
- **householdType**: 활성률 7.5%이지만 knockout(conf>=0.7)도 약함
- **incomeLevel**: 활성률 8.7%, 소득이 낮을수록 더 많이 매칭 (0.8 부분점수 + 서열 방향)
- **employmentStatus**: 활성률 6.2%, 가장 차별화 약함

### 가구유형/취업상태에 의한 차별화 패턴

데이터가 있는 경우의 knockout이 효과적으로 작동하는 증거:
- **다자녀**: 평균 63.0건 (가장 낮음) -- 다자녀 대상 support가 householdType으로 필터링
- **자영업**: 평균 62.2건 (가장 낮음) -- 자영업 대상 support가 employmentStatus으로 필터링
- **신혼부부/구직자**: 평균 98.7건 -- NULL 데이터가 많아 knockout이 거의 안 됨

이는 알고리즘이 **데이터가 있을 때는 정상 작동**하지만, 데이터 부재 시 과다 매칭을 방지하는 안전장치가 부족함을 의미합니다.

---

## 10. 알고리즘 개선 권고안

### P0 (즉시 수정): scorePipeline 최소 활성 차원 강화

**현재 문제**: 활성 차원 1개(age만)로도 매칭이 통과되어 대부분의 support가 exploratory/recommended에 진입
**영향 범위**: 전체 매칭 건수 대폭 감소 예상

```typescript
// 파일: src/lib/matching-v4/index.ts, scorePipeline 함수 (line 54)
// Before:
if (activeDims.length < 1) return null

// After:
if (activeDims.length < 2) return null
```

> 주의: 이 변경 시 age 하나만 유효한 support가 모두 탈락합니다. 현재 데이터에서는 age만 유효한 support가 대다수이므로 매칭 건수가 급감할 수 있습니다. 데이터 품질 개선(P1)과 병행 적용을 권장합니다.

### P0-ALT (보수적 대안): 활성 차원 1개일 때 exploratory 제한

매칭 건수 급감을 우려한다면, 활성 차원 1개인 경우 exploratory로만 제한:

```typescript
// 파일: src/lib/matching-v4/index.ts, scoreSupport 함수 (line 88 부근, tier 결정 후)
// 기존 코드:
if (!result.hasSpecificMatch && (tier === 'tailored' || tier === 'recommended')) tier = 'exploratory'

// 추가:
const activeDimsCount = dims.filter(d => d.hasData).length
if (activeDimsCount <= 1 && tier !== 'exploratory') tier = 'exploratory'
```

### P1 (단기): 추출 파이프라인 개인 트랙 데이터 품질 개선

**근본 원인 해결**. 현재 채움률이 1~21%인 필드들의 추출 정확도를 높여야 합니다.

| 차원 | 현재 채움률 | 목표 채움률 | 파일 |
|------|-----------|-----------|------|
| region | 1.1% | 30%+ | `src/lib/extraction/audience-patterns.ts` |
| age | 21.5% | 50%+ | `src/lib/extraction/audience-patterns.ts` |
| householdType | 7.5% | 25%+ | `src/lib/extraction/audience-patterns.ts` |
| incomeLevel | 8.7% | 25%+ | `src/lib/extraction/audience-patterns.ts` |
| employmentStatus | 6.2% | 20%+ | `src/lib/extraction/audience-patterns.ts` |

- 많은 support의 `rawEligibilityText`에 "누구나", "제한없음" 등의 표현이 포함되어 있을 수 있으나, 현재 추출기가 이를 명시적 데이터로 변환하지 못하고 NULL로 남김
- "전 국민", "전 연령" 같은 패턴을 감지하여 전체 범위 데이터로 채우면 coverage factor가 상승

### P2 (중기): Coverage Factor 보정 강화

현재 `0.1 + 0.9 * (totalActiveWeight / 1.0)`은 활성 차원 1개 시에도 floor가 0.28~0.325로 높음.

```typescript
// 파일: src/lib/matching-v4/index.ts, scorePipeline 함수 (line 61)
// Before:
const coverageFactor = 0.1 + 0.9 * (totalActiveWeight / 1.0)

// After (제곱 감쇠):
const ratio = totalActiveWeight / 1.0
const coverageFactor = 0.05 + 0.95 * (ratio * ratio)
```

이렇게 하면:
- 차원 1개(weight=0.25): 0.05 + 0.95 * 0.0625 = 0.109 (현재 0.325)
- 차원 2개(weight=0.45): 0.05 + 0.95 * 0.2025 = 0.242
- 차원 5개(weight=1.0): 0.05 + 0.95 * 1.0 = 1.0

### P2 (중기): 관심분야 보너스를 비례 방식으로 변경

+0.10 고정 보너스는 낮은 score에서 tier 경계를 넘기 쉬움.

```typescript
// 파일: src/lib/matching-v4/index.ts, scorePipeline 함수 (line 63)
// Before:
if (hasInterestBonus) finalScore = Math.min(1.0, finalScore + 0.10)

// After (비례 보너스):
if (hasInterestBonus) finalScore = Math.min(1.0, finalScore * 1.12)
```

### P3 (장기): Knockout 임계값 하향 검토

현재 conf >= 0.7에서만 knockout이 작동하지만, 유효 데이터(conf >= 0.3)인 경우에도 knockout을 적용하면 더 많은 부적합 support를 제거 가능.

```typescript
// 파일: src/lib/matching-v4/dimensions.ts, isKnockedOutPersonal 함수
// Before (각 차원):
if (regions && regions.length > 0 && (c?.regions ?? 0) >= 0.7) {

// After:
if (regions && regions.length > 0 && (c?.regions ?? 0) >= 0.5) {
```

> 주의: false positive knockout 증가 가능. 추출 정확도가 개선된 후 적용 권장.

---

## 11. 코드 수정 제안 요약

| # | 우선순위 | 파일 | 수정 내용 | 예상 효과 |
|---|---------|------|----------|----------|
| 1 | P0 | `src/lib/matching-v4/index.ts` line 54 | `activeDims.length < 2` | 과다매칭 43.5% -> 15% 이하 (추정) |
| 2 | P0-ALT | `src/lib/matching-v4/index.ts` line 88 | 활성 1개면 exploratory 제한 | recommended 감소, exploratory 유지 |
| 3 | P1 | `src/lib/extraction/audience-patterns.ts` | 추출 패턴 확대 | 채움률 향상 -> 정밀 매칭 |
| 4 | P2 | `src/lib/matching-v4/index.ts` line 61 | coverage factor 제곱 감쇠 | 낮은 데이터 support score 감소 |
| 5 | P2 | `src/lib/matching-v4/index.ts` line 63 | 관심분야 비례 보너스 | tier 승격 남용 방지 |
| 6 | P3 | `src/lib/matching-v4/dimensions.ts` line 116+ | knockout conf 0.7 -> 0.5 | 부적합 제거 강화 |

---

*Generated by audit-personal-matching.ts on 2026-02-16T12:06:40.125Z*
