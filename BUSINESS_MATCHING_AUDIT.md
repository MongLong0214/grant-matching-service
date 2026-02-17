# 사업자 트랙 매칭 알고리즘 전수검증 리포트

> 검증 일시: 2026-02-16T12:05:45.515Z
> 검증 케이스: 200개
> DB 지원사업: 6364개 (사업자 대상: 1092개)

## 1. Executive Summary

**전체 품질 등급: B (85/100)**

감점 사유:
- 평균 tailored 0.32 (너무 낮음)

| 지표 | 값 | 목표 | 상태 |
|------|-----|------|------|
| 빈 결과 비율 | 0.0% (0건) | < 5% | PASS |
| 과다 매칭 비율 (100+) | 0.0% (0건) | < 10% | PASS |
| 평균 매칭 건수 | 52.84 | 10~50 | WARN |
| 중위 매칭 건수 | 51.00 | 10~50 | WARN |
| 평균 tailored | 0.32 | >= 3 | FAIL |
| 평균 recommended | 4.99 | >= 5 | WARN |
| 평균 exploratory | 47.54 | >= 5 | PASS |

## 2. DB 데이터 현황

### 서비스 타입별 분포
| 서비스 타입 | 건수 |
|-----------|------|
| personal | 5272 |
| business | 677 |
| both | 415 |

### NULL 필드 현황 (전체 supports 대비)
| 필드 | NULL 건수 | NULL 비율 |
|------|----------|----------|
| targetRevenueMin | 6364 | 100.0% |
| targetBusinessAgeMin | 6358 | 99.9% |
| targetEmployeeMin | 6331 | 99.5% |
| targetBusinessAgeMax | 6321 | 99.3% |
| targetRegions | 6298 | 99.0% |
| targetRevenueMax | 6263 | 98.4% |
| targetEmployeeMax | 6240 | 98.1% |
| targetFounderAgeMax | 6140 | 96.5% |
| targetFounderAgeMin | 5892 | 92.6% |
| targetBusinessTypes | 4446 | 69.9% |

### 추출 신뢰도 분포
| 차원 | High (>=0.5) | Low (0.3~0.5) | None (<0.3) |
|------|-------------|---------------|-------------|
| regions | 66 | 0 | 6298 |
| businessTypes | 1918 | 0 | 4446 |
| employee | 148 | 0 | 6216 |
| revenue | 101 | 0 | 6263 |
| businessAge | 49 | 0 | 6315 |
| founderAge | 656 | 0 | 5708 |

## 3. 200개 케이스 통계 요약

### 매칭 건수 분포
- 평균: 52.84, 중위수: 51.00
- 평균 점수: 0.33, 중위 점수: 0.34, 표준편차: 0.04
- 평균 knockout 비율: 7.6%, 중위: 7.6%

### 매칭 건수 히스토그램
| 범위 | 케이스 수 | 비율 |
|------|---------|------|
| 0~0 | 0 | 0.0% |
| 1~4 | 0 | 0.0% |
| 5~9 | 0 | 0.0% |
| 10~19 | 3 | 1.5% |
| 20~29 | 10 | 5.0% |
| 30~49 | 10 | 5.0% |
| 50~99 | 177 | 88.5% |
| 100+ | 0 | 0.0% |

## 4. Tier별 분포 히트맵

### 업종별 평균 매칭 건수
| 업종 | 케이스수 | 평균매칭 | 빈결과 | 비율 |
|------|---------|---------|--------|------|
| 도매업 | 11 | 63.18 | 0 | 0.0% |
| 숙박업 | 11 | 60.00 | 0 | 0.0% |
| 소매업 | 15 | 58.27 | 0 | 0.0% |
| 음식점업 | 20 | 56.60 | 0 | 0.0% |
| 교육서비스업 | 11 | 52.91 | 0 | 0.0% |
| 기타서비스업 | 51 | 52.53 | 0 | 0.0% |
| 전문서비스업 | 9 | 51.11 | 0 | 0.0% |
| 정보통신업 | 16 | 50.75 | 0 | 0.0% |
| 제조업 | 16 | 50.44 | 0 | 0.0% |
| 보건업 | 10 | 49.00 | 0 | 0.0% |
| 예술/스포츠 | 8 | 48.00 | 0 | 0.0% |
| 건설업 | 11 | 47.00 | 0 | 0.0% |
| 운수업 | 11 | 43.36 | 0 | 0.0% |

### 지역별 평균 매칭 건수
| 지역 | 케이스수 | 평균매칭 | 빈결과 | 빈결과비율 |
|------|---------|---------|--------|----------|
| 경남 | 13 | 58.69 | 0 | 0.0% |
| 인천 | 11 | 57.09 | 0 | 0.0% |
| 충남 | 7 | 56.86 | 0 | 0.0% |
| 대구 | 13 | 56.46 | 0 | 0.0% |
| 전남 | 7 | 55.00 | 0 | 0.0% |
| 전북 | 8 | 53.50 | 0 | 0.0% |
| 제주 | 8 | 53.38 | 0 | 0.0% |
| 울산 | 8 | 53.38 | 0 | 0.0% |
| 세종 | 9 | 53.11 | 0 | 0.0% |
| 경기 | 28 | 52.71 | 0 | 0.0% |
| 대전 | 10 | 52.50 | 0 | 0.0% |
| 서울 | 35 | 51.74 | 0 | 0.0% |
| 광주 | 9 | 50.67 | 0 | 0.0% |
| 강원 | 7 | 50.14 | 0 | 0.0% |
| 부산 | 13 | 47.62 | 0 | 0.0% |
| 충북 | 7 | 47.57 | 0 | 0.0% |
| 경북 | 7 | 47.14 | 0 | 0.0% |

### 직원 수별 평균 매칭 건수
| 직원 수 | 케이스수 | 평균매칭 |
|--------|---------|---------|
| 1~4명 | 52 | 59.60 |
| 5~9명 | 50 | 59.88 |
| 50~99명 | 31 | 50.81 |
| 10~49명 | 39 | 50.82 |
| 100명+ | 28 | 32.82 |

### 업력별 평균 매칭 건수
| 업력 | 케이스수 | 평균매칭 |
|------|---------|---------|
| 예비창업 | 32 | 52.81 |
| 5~10년 | 36 | 54.28 |
| 3~5년 | 36 | 51.78 |
| 10년+ | 29 | 54.14 |
| 1~3년 | 38 | 53.61 |
| 1년미만 | 29 | 50.14 |

### 대표자 연령별 평균 매칭 건수
| 연령대 | 케이스수 | 평균매칭 |
|--------|---------|---------|
| 20대 | 38 | 51.11 |
| 50대 | 40 | 53.40 |
| 40대 | 43 | 54.37 |
| 60대+ | 29 | 51.66 |
| 30대 | 50 | 53.10 |

## 5. 문제 케이스 Top 20 상세 분석

### Case #36: [기타] 40대 소매업 5~9명 3~5년 서울
- **프로필**: 소매업 / 서울 / 직원7명 / 매출0.5억 / 업력48개월 / 대표45세
- **매칭**: tailored=1, recommended=23, exploratory=50, total=74
- **knockout**: 455건 (7.1%), serviceType필터: 5272건
- **점수**: avg=0.39, max=0.75
- **Top3 평균 breakdown**: region=0.33, businessType=0.67, employee=1.00, revenue=1.00, businessAge=0.22, founderAge=0.28
- **태그**: low-revenue
- **상위 매칭 예시**:
  - [tailored] score=0.75 "사업화 연계 지식재산평가 지원" (지식재산거래과)
    breakdown: region=1.00, businessType=0.00, employee=1.00, revenue=1.00, businessAge=0.67, founderAge=0.85
    targets: region=["서울","인천","경기"], type=[]
  - [recommended] score=0.49 "안양시 소상공인 이자보전 지원" (기업경제과)
    breakdown: region=0.00, businessType=1.00, employee=1.00, revenue=1.00, businessAge=0.00, founderAge=0.00
    targets: region=[], type=["음식점업","소매업","기타서비스업"]
  - [recommended] score=0.49 "소상공인 고용보험 가입지원" (중앙정부)
    breakdown: region=0.00, businessType=1.00, employee=1.00, revenue=1.00, businessAge=0.00, founderAge=0.00
    targets: region=[], type=["음식점업","소매업","기타서비스업"]

### Case #68: [기타] 30대 도매업 5~9명 5~10년 충남
- **프로필**: 도매업 / 충남 / 직원7명 / 매출7.5억 / 업력84개월 / 대표35세
- **매칭**: tailored=1, recommended=23, exploratory=50, total=74
- **knockout**: 459건 (7.2%), serviceType필터: 5272건
- **점수**: avg=0.39, max=0.70
- **Top3 평균 breakdown**: region=0.00, businessType=1.00, employee=1.00, revenue=0.67, businessAge=0.33, founderAge=0.32
- **태그**: none
- **상위 매칭 예시**:
  - [tailored] score=0.70 "청년일자리도약장려금" (공정채용기반과)
    breakdown: region=0.00, businessType=1.00, employee=1.00, revenue=0.00, businessAge=1.00, founderAge=0.95
    targets: region=[], type=["음식점업","소매업","기타서비스업","예술/스포츠"]
  - [recommended] score=0.49 "안양시 소상공인 이자보전 지원" (기업경제과)
    breakdown: region=0.00, businessType=1.00, employee=1.00, revenue=1.00, businessAge=0.00, founderAge=0.00
    targets: region=[], type=["음식점업","소매업","기타서비스업"]
  - [recommended] score=0.49 "소상공인 고용보험 가입지원" (중앙정부)
    breakdown: region=0.00, businessType=1.00, employee=1.00, revenue=1.00, businessAge=0.00, founderAge=0.00
    targets: region=[], type=["음식점업","소매업","기타서비스업"]

### Case #196: [기타] 20대 숙박업 5~9명 3~5년 경기 (보충)
- **프로필**: 숙박업 / 경기 / 직원7명 / 매출0.5억 / 업력48개월 / 대표25세
- **매칭**: tailored=2, recommended=22, exploratory=50, total=74
- **knockout**: 475건 (7.5%), serviceType필터: 5272건
- **점수**: avg=0.40, max=0.77
- **Top3 평균 breakdown**: region=0.33, businessType=0.67, employee=1.00, revenue=0.67, businessAge=0.56, founderAge=0.67
- **태그**: supplemental
- **상위 매칭 예시**:
  - [tailored] score=0.77 "사업화 연계 지식재산평가 지원" (지식재산거래과)
    breakdown: region=1.00, businessType=0.00, employee=1.00, revenue=1.00, businessAge=0.67, founderAge=1.00
    targets: region=["서울","인천","경기"], type=[]
  - [tailored] score=0.71 "청년일자리도약장려금" (공정채용기반과)
    breakdown: region=0.00, businessType=1.00, employee=1.00, revenue=0.00, businessAge=1.00, founderAge=1.00
    targets: region=[], type=["음식점업","소매업","기타서비스업","예술/스포츠"]
  - [recommended] score=0.49 "안양시 소상공인 이자보전 지원" (기업경제과)
    breakdown: region=0.00, businessType=1.00, employee=1.00, revenue=1.00, businessAge=0.00, founderAge=0.00
    targets: region=[], type=["음식점업","소매업","기타서비스업"]

### Case #6: [기타] 소매업 1명 1억미만 제주 (영세 소매)
- **프로필**: 소매업 / 제주 / 직원2명 / 매출0.5억 / 업력24개월 / 대표45세
- **매칭**: tailored=0, recommended=23, exploratory=50, total=73
- **knockout**: 460건 (7.2%), serviceType필터: 5272건
- **점수**: avg=0.39, max=0.61
- **Top3 평균 breakdown**: region=0.00, businessType=1.00, employee=1.00, revenue=1.00, businessAge=0.00, founderAge=0.00
- **태그**: edge, micro-retail
- **상위 매칭 예시**:
  - [recommended] score=0.49 "안양시 소상공인 이자보전 지원" (기업경제과)
    breakdown: region=0.00, businessType=1.00, employee=1.00, revenue=1.00, businessAge=0.00, founderAge=0.00
    targets: region=[], type=["음식점업","소매업","기타서비스업"]
  - [recommended] score=0.49 "소상공인 고용보험 가입지원" (중앙정부)
    breakdown: region=0.00, businessType=1.00, employee=1.00, revenue=1.00, businessAge=0.00, founderAge=0.00
    targets: region=[], type=["음식점업","소매업","기타서비스업"]
  - [recommended] score=0.49 "소상공인 노란우산공제 정액장려금 지원" (중앙정부)
    breakdown: region=0.00, businessType=1.00, employee=1.00, revenue=1.00, businessAge=0.00, founderAge=0.00
    targets: region=[], type=["음식점업","소매업","기타서비스업"]

### Case #9: [기타] 30대 음식점업 5~9명 예비 세종
- **프로필**: 음식점업 / 세종 / 직원7명 / 매출0.5억 / 업력-1개월 / 대표35세
- **매칭**: tailored=1, recommended=22, exploratory=50, total=73
- **knockout**: 470건 (7.4%), serviceType필터: 5272건
- **점수**: avg=0.40, max=0.70
- **Top3 평균 breakdown**: region=0.00, businessType=1.00, employee=1.00, revenue=0.67, businessAge=0.33, founderAge=0.32
- **태그**: pre-startup, low-revenue
- **상위 매칭 예시**:
  - [tailored] score=0.70 "청년일자리도약장려금" (공정채용기반과)
    breakdown: region=0.00, businessType=1.00, employee=1.00, revenue=0.00, businessAge=1.00, founderAge=0.95
    targets: region=[], type=["음식점업","소매업","기타서비스업","예술/스포츠"]
  - [recommended] score=0.49 "안양시 소상공인 이자보전 지원" (기업경제과)
    breakdown: region=0.00, businessType=1.00, employee=1.00, revenue=1.00, businessAge=0.00, founderAge=0.00
    targets: region=[], type=["음식점업","소매업","기타서비스업"]
  - [recommended] score=0.49 "소상공인 고용보험 가입지원" (중앙정부)
    breakdown: region=0.00, businessType=1.00, employee=1.00, revenue=1.00, businessAge=0.00, founderAge=0.00
    targets: region=[], type=["음식점업","소매업","기타서비스업"]

### Case #26: [기타] 30대 음식점업 1~4명 1년미만 서울
- **프로필**: 음식점업 / 서울 / 직원2명 / 매출0.5억 / 업력6개월 / 대표35세
- **매칭**: tailored=1, recommended=22, exploratory=50, total=73
- **knockout**: 472건 (7.4%), serviceType필터: 5272건
- **점수**: avg=0.40, max=0.84
- **Top3 평균 breakdown**: region=0.33, businessType=0.67, employee=1.00, revenue=1.00, businessAge=0.33, founderAge=0.33
- **태그**: micro, low-revenue
- **상위 매칭 예시**:
  - [tailored] score=0.84 "사업화 연계 지식재산평가 지원" (지식재산거래과)
    breakdown: region=1.00, businessType=0.00, employee=1.00, revenue=1.00, businessAge=1.00, founderAge=1.00
    targets: region=["서울","인천","경기"], type=[]
  - [recommended] score=0.49 "안양시 소상공인 이자보전 지원" (기업경제과)
    breakdown: region=0.00, businessType=1.00, employee=1.00, revenue=1.00, businessAge=0.00, founderAge=0.00
    targets: region=[], type=["음식점업","소매업","기타서비스업"]
  - [recommended] score=0.49 "소상공인 고용보험 가입지원" (중앙정부)
    breakdown: region=0.00, businessType=1.00, employee=1.00, revenue=1.00, businessAge=0.00, founderAge=0.00
    targets: region=[], type=["음식점업","소매업","기타서비스업"]

### Case #39: [기타] 50대 소매업 5~9명 1~3년 경기
- **프로필**: 소매업 / 경기 / 직원7명 / 매출3.0억 / 업력24개월 / 대표55세
- **매칭**: tailored=0, recommended=23, exploratory=50, total=73
- **knockout**: 468건 (7.4%), serviceType필터: 5272건
- **점수**: avg=0.38, max=0.51
- **Top3 평균 breakdown**: region=0.00, businessType=1.00, employee=1.00, revenue=1.00, businessAge=0.00, founderAge=0.00
- **태그**: none
- **상위 매칭 예시**:
  - [recommended] score=0.49 "안양시 소상공인 이자보전 지원" (기업경제과)
    breakdown: region=0.00, businessType=1.00, employee=1.00, revenue=1.00, businessAge=0.00, founderAge=0.00
    targets: region=[], type=["음식점업","소매업","기타서비스업"]
  - [recommended] score=0.49 "소상공인 고용보험 가입지원" (중앙정부)
    breakdown: region=0.00, businessType=1.00, employee=1.00, revenue=1.00, businessAge=0.00, founderAge=0.00
    targets: region=[], type=["음식점업","소매업","기타서비스업"]
  - [recommended] score=0.49 "소상공인 노란우산공제 정액장려금 지원" (중앙정부)
    breakdown: region=0.00, businessType=1.00, employee=1.00, revenue=1.00, businessAge=0.00, founderAge=0.00
    targets: region=[], type=["음식점업","소매업","기타서비스업"]

### Case #71: [기타] 60대+ 도매업 5~9명 1~3년 울산
- **프로필**: 도매업 / 울산 / 직원7명 / 매출7.5억 / 업력24개월 / 대표65세
- **매칭**: tailored=0, recommended=23, exploratory=50, total=73
- **knockout**: 468건 (7.4%), serviceType필터: 5272건
- **점수**: avg=0.38, max=0.51
- **Top3 평균 breakdown**: region=0.00, businessType=1.00, employee=1.00, revenue=1.00, businessAge=0.00, founderAge=0.00
- **태그**: senior-founder
- **상위 매칭 예시**:
  - [recommended] score=0.49 "안양시 소상공인 이자보전 지원" (기업경제과)
    breakdown: region=0.00, businessType=1.00, employee=1.00, revenue=1.00, businessAge=0.00, founderAge=0.00
    targets: region=[], type=["음식점업","소매업","기타서비스업"]
  - [recommended] score=0.49 "소상공인 고용보험 가입지원" (중앙정부)
    breakdown: region=0.00, businessType=1.00, employee=1.00, revenue=1.00, businessAge=0.00, founderAge=0.00
    targets: region=[], type=["음식점업","소매업","기타서비스업"]
  - [recommended] score=0.49 "소상공인 노란우산공제 정액장려금 지원" (중앙정부)
    breakdown: region=0.00, businessType=1.00, employee=1.00, revenue=1.00, businessAge=0.00, founderAge=0.00
    targets: region=[], type=["음식점업","소매업","기타서비스업"]

### Case #72: [기타] 40대 도매업 5~9명 5~10년 대구
- **프로필**: 도매업 / 대구 / 직원7명 / 매출7.5억 / 업력84개월 / 대표45세
- **매칭**: tailored=0, recommended=23, exploratory=50, total=73
- **knockout**: 458건 (7.2%), serviceType필터: 5272건
- **점수**: avg=0.39, max=0.61
- **Top3 평균 breakdown**: region=0.00, businessType=1.00, employee=1.00, revenue=1.00, businessAge=0.00, founderAge=0.00
- **태그**: none
- **상위 매칭 예시**:
  - [recommended] score=0.49 "안양시 소상공인 이자보전 지원" (기업경제과)
    breakdown: region=0.00, businessType=1.00, employee=1.00, revenue=1.00, businessAge=0.00, founderAge=0.00
    targets: region=[], type=["음식점업","소매업","기타서비스업"]
  - [recommended] score=0.49 "소상공인 고용보험 가입지원" (중앙정부)
    breakdown: region=0.00, businessType=1.00, employee=1.00, revenue=1.00, businessAge=0.00, founderAge=0.00
    targets: region=[], type=["음식점업","소매업","기타서비스업"]
  - [recommended] score=0.49 "소상공인 노란우산공제 정액장려금 지원" (중앙정부)
    breakdown: region=0.00, businessType=1.00, employee=1.00, revenue=1.00, businessAge=0.00, founderAge=0.00
    targets: region=[], type=["음식점업","소매업","기타서비스업"]

### Case #76: [기타] 60대+ 도매업 5~9명 10년+ 대구
- **프로필**: 도매업 / 대구 / 직원7명 / 매출3.0억 / 업력180개월 / 대표65세
- **매칭**: tailored=0, recommended=23, exploratory=50, total=73
- **knockout**: 470건 (7.4%), serviceType필터: 5272건
- **점수**: avg=0.37, max=0.49
- **Top3 평균 breakdown**: region=0.00, businessType=1.00, employee=1.00, revenue=1.00, businessAge=0.00, founderAge=0.00
- **태그**: senior-founder, established
- **상위 매칭 예시**:
  - [recommended] score=0.49 "안양시 소상공인 이자보전 지원" (기업경제과)
    breakdown: region=0.00, businessType=1.00, employee=1.00, revenue=1.00, businessAge=0.00, founderAge=0.00
    targets: region=[], type=["음식점업","소매업","기타서비스업"]
  - [recommended] score=0.49 "소상공인 고용보험 가입지원" (중앙정부)
    breakdown: region=0.00, businessType=1.00, employee=1.00, revenue=1.00, businessAge=0.00, founderAge=0.00
    targets: region=[], type=["음식점업","소매업","기타서비스업"]
  - [recommended] score=0.49 "소상공인 노란우산공제 정액장려금 지원" (중앙정부)
    breakdown: region=0.00, businessType=1.00, employee=1.00, revenue=1.00, businessAge=0.00, founderAge=0.00
    targets: region=[], type=["음식점업","소매업","기타서비스업"]

### Case #98: [기타] 40대 숙박업 1~4명 1~3년 경기
- **프로필**: 숙박업 / 경기 / 직원2명 / 매출3.0억 / 업력24개월 / 대표45세
- **매칭**: tailored=1, recommended=22, exploratory=50, total=73
- **knockout**: 473건 (7.4%), serviceType필터: 5272건
- **점수**: avg=0.39, max=0.81
- **Top3 평균 breakdown**: region=0.33, businessType=0.67, employee=1.00, revenue=1.00, businessAge=0.33, founderAge=0.28
- **태그**: micro
- **상위 매칭 예시**:
  - [tailored] score=0.81 "사업화 연계 지식재산평가 지원" (지식재산거래과)
    breakdown: region=1.00, businessType=0.00, employee=1.00, revenue=1.00, businessAge=1.00, founderAge=0.85
    targets: region=["서울","인천","경기"], type=[]
  - [recommended] score=0.49 "안양시 소상공인 이자보전 지원" (기업경제과)
    breakdown: region=0.00, businessType=1.00, employee=1.00, revenue=1.00, businessAge=0.00, founderAge=0.00
    targets: region=[], type=["음식점업","소매업","기타서비스업"]
  - [recommended] score=0.49 "소상공인 고용보험 가입지원" (중앙정부)
    breakdown: region=0.00, businessType=1.00, employee=1.00, revenue=1.00, businessAge=0.00, founderAge=0.00
    targets: region=[], type=["음식점업","소매업","기타서비스업"]

### Case #104: [기타] 30대 숙박업 5~9명 5~10년 충남
- **프로필**: 숙박업 / 충남 / 직원7명 / 매출3.0억 / 업력84개월 / 대표35세
- **매칭**: tailored=1, recommended=22, exploratory=50, total=73
- **knockout**: 473건 (7.4%), serviceType필터: 5272건
- **점수**: avg=0.39, max=0.70
- **Top3 평균 breakdown**: region=0.00, businessType=1.00, employee=1.00, revenue=0.67, businessAge=0.33, founderAge=0.32
- **태그**: none
- **상위 매칭 예시**:
  - [tailored] score=0.70 "청년일자리도약장려금" (공정채용기반과)
    breakdown: region=0.00, businessType=1.00, employee=1.00, revenue=0.00, businessAge=1.00, founderAge=0.95
    targets: region=[], type=["음식점업","소매업","기타서비스업","예술/스포츠"]
  - [recommended] score=0.49 "안양시 소상공인 이자보전 지원" (기업경제과)
    breakdown: region=0.00, businessType=1.00, employee=1.00, revenue=1.00, businessAge=0.00, founderAge=0.00
    targets: region=[], type=["음식점업","소매업","기타서비스업"]
  - [recommended] score=0.49 "소상공인 고용보험 가입지원" (중앙정부)
    breakdown: region=0.00, businessType=1.00, employee=1.00, revenue=1.00, businessAge=0.00, founderAge=0.00
    targets: region=[], type=["음식점업","소매업","기타서비스업"]

### Case #154: [기타] 20대 기타서비스업 5~9명 1~3년 전남
- **프로필**: 기타서비스업 / 전남 / 직원7명 / 매출3.0억 / 업력24개월 / 대표25세
- **매칭**: tailored=1, recommended=22, exploratory=50, total=73
- **knockout**: 469건 (7.4%), serviceType필터: 5272건
- **점수**: avg=0.39, max=0.71
- **Top3 평균 breakdown**: region=0.00, businessType=1.00, employee=1.00, revenue=0.67, businessAge=0.33, founderAge=0.33
- **태그**: young-founder
- **상위 매칭 예시**:
  - [tailored] score=0.71 "청년일자리도약장려금" (공정채용기반과)
    breakdown: region=0.00, businessType=1.00, employee=1.00, revenue=0.00, businessAge=1.00, founderAge=1.00
    targets: region=[], type=["음식점업","소매업","기타서비스업","예술/스포츠"]
  - [recommended] score=0.49 "안양시 소상공인 이자보전 지원" (기업경제과)
    breakdown: region=0.00, businessType=1.00, employee=1.00, revenue=1.00, businessAge=0.00, founderAge=0.00
    targets: region=[], type=["음식점업","소매업","기타서비스업"]
  - [recommended] score=0.49 "소상공인 고용보험 가입지원" (중앙정부)
    breakdown: region=0.00, businessType=1.00, employee=1.00, revenue=1.00, businessAge=0.00, founderAge=0.00
    targets: region=[], type=["음식점업","소매업","기타서비스업"]

### Case #156: [기타] 40대 기타서비스업 5~9명 5~10년 인천
- **프로필**: 기타서비스업 / 인천 / 직원7명 / 매출7.5억 / 업력84개월 / 대표45세
- **매칭**: tailored=1, recommended=22, exploratory=50, total=73
- **knockout**: 464건 (7.3%), serviceType필터: 5272건
- **점수**: avg=0.39, max=0.69
- **Top3 평균 breakdown**: region=0.33, businessType=1.00, employee=1.00, revenue=1.00, businessAge=0.00, founderAge=0.00
- **태그**: none
- **상위 매칭 예시**:
  - [tailored] score=0.69 "소상공인 보증지원제도" (경제정책과)
    breakdown: region=1.00, businessType=1.00, employee=1.00, revenue=1.00, businessAge=0.00, founderAge=0.00
    targets: region=["인천"], type=["음식점업","소매업","기타서비스업"]
  - [recommended] score=0.49 "안양시 소상공인 이자보전 지원" (기업경제과)
    breakdown: region=0.00, businessType=1.00, employee=1.00, revenue=1.00, businessAge=0.00, founderAge=0.00
    targets: region=[], type=["음식점업","소매업","기타서비스업"]
  - [recommended] score=0.49 "소상공인 고용보험 가입지원" (중앙정부)
    breakdown: region=0.00, businessType=1.00, employee=1.00, revenue=1.00, businessAge=0.00, founderAge=0.00
    targets: region=[], type=["음식점업","소매업","기타서비스업"]

### Case #161: [기타] 50대 기타서비스업 1~4명 5~10년 인천
- **프로필**: 기타서비스업 / 인천 / 직원2명 / 매출0.5억 / 업력84개월 / 대표55세
- **매칭**: tailored=1, recommended=22, exploratory=50, total=73
- **knockout**: 478건 (7.5%), serviceType필터: 5272건
- **점수**: avg=0.38, max=0.69
- **Top3 평균 breakdown**: region=0.33, businessType=1.00, employee=1.00, revenue=1.00, businessAge=0.00, founderAge=0.00
- **태그**: micro, low-revenue
- **상위 매칭 예시**:
  - [tailored] score=0.69 "소상공인 보증지원제도" (경제정책과)
    breakdown: region=1.00, businessType=1.00, employee=1.00, revenue=1.00, businessAge=0.00, founderAge=0.00
    targets: region=["인천"], type=["음식점업","소매업","기타서비스업"]
  - [recommended] score=0.49 "안양시 소상공인 이자보전 지원" (기업경제과)
    breakdown: region=0.00, businessType=1.00, employee=1.00, revenue=1.00, businessAge=0.00, founderAge=0.00
    targets: region=[], type=["음식점업","소매업","기타서비스업"]
  - [recommended] score=0.49 "소상공인 고용보험 가입지원" (중앙정부)
    breakdown: region=0.00, businessType=1.00, employee=1.00, revenue=1.00, businessAge=0.00, founderAge=0.00
    targets: region=[], type=["음식점업","소매업","기타서비스업"]

### Case #170: [기타] 20대 기타서비스업 5~9명 10년+ 인천
- **프로필**: 기타서비스업 / 인천 / 직원7명 / 매출7.5억 / 업력180개월 / 대표25세
- **매칭**: tailored=1, recommended=22, exploratory=50, total=73
- **knockout**: 472건 (7.4%), serviceType필터: 5272건
- **점수**: avg=0.39, max=0.69
- **Top3 평균 breakdown**: region=0.33, businessType=1.00, employee=1.00, revenue=1.00, businessAge=0.00, founderAge=0.00
- **태그**: young-founder, established
- **상위 매칭 예시**:
  - [tailored] score=0.69 "소상공인 보증지원제도" (경제정책과)
    breakdown: region=1.00, businessType=1.00, employee=1.00, revenue=1.00, businessAge=0.00, founderAge=0.00
    targets: region=["인천"], type=["음식점업","소매업","기타서비스업"]
  - [recommended] score=0.49 "안양시 소상공인 이자보전 지원" (기업경제과)
    breakdown: region=0.00, businessType=1.00, employee=1.00, revenue=1.00, businessAge=0.00, founderAge=0.00
    targets: region=[], type=["음식점업","소매업","기타서비스업"]
  - [recommended] score=0.49 "소상공인 고용보험 가입지원" (중앙정부)
    breakdown: region=0.00, businessType=1.00, employee=1.00, revenue=1.00, businessAge=0.00, founderAge=0.00
    targets: region=[], type=["음식점업","소매업","기타서비스업"]

### Case #172: [기타] 30대 기타서비스업 5~9명 5~10년 서울
- **프로필**: 기타서비스업 / 서울 / 직원7명 / 매출3.0억 / 업력84개월 / 대표35세
- **매칭**: tailored=1, recommended=22, exploratory=50, total=73
- **knockout**: 465건 (7.3%), serviceType필터: 5272건
- **점수**: avg=0.40, max=0.70
- **Top3 평균 breakdown**: region=0.00, businessType=1.00, employee=1.00, revenue=0.67, businessAge=0.33, founderAge=0.32
- **태그**: none
- **상위 매칭 예시**:
  - [tailored] score=0.70 "청년일자리도약장려금" (공정채용기반과)
    breakdown: region=0.00, businessType=1.00, employee=1.00, revenue=0.00, businessAge=1.00, founderAge=0.95
    targets: region=[], type=["음식점업","소매업","기타서비스업","예술/스포츠"]
  - [recommended] score=0.49 "안양시 소상공인 이자보전 지원" (기업경제과)
    breakdown: region=0.00, businessType=1.00, employee=1.00, revenue=1.00, businessAge=0.00, founderAge=0.00
    targets: region=[], type=["음식점업","소매업","기타서비스업"]
  - [recommended] score=0.49 "소상공인 고용보험 가입지원" (중앙정부)
    breakdown: region=0.00, businessType=1.00, employee=1.00, revenue=1.00, businessAge=0.00, founderAge=0.00
    targets: region=[], type=["음식점업","소매업","기타서비스업"]

### Case #185: [기타] 40대 기타서비스업 1~4명 1~3년 서울
- **프로필**: 기타서비스업 / 서울 / 직원2명 / 매출7.5억 / 업력24개월 / 대표45세
- **매칭**: tailored=1, recommended=22, exploratory=50, total=73
- **knockout**: 465건 (7.3%), serviceType필터: 5272건
- **점수**: avg=0.40, max=0.81
- **Top3 평균 breakdown**: region=0.33, businessType=0.67, employee=1.00, revenue=1.00, businessAge=0.33, founderAge=0.28
- **태그**: micro
- **상위 매칭 예시**:
  - [tailored] score=0.81 "사업화 연계 지식재산평가 지원" (지식재산거래과)
    breakdown: region=1.00, businessType=0.00, employee=1.00, revenue=1.00, businessAge=1.00, founderAge=0.85
    targets: region=["서울","인천","경기"], type=[]
  - [recommended] score=0.49 "안양시 소상공인 이자보전 지원" (기업경제과)
    breakdown: region=0.00, businessType=1.00, employee=1.00, revenue=1.00, businessAge=0.00, founderAge=0.00
    targets: region=[], type=["음식점업","소매업","기타서비스업"]
  - [recommended] score=0.49 "소상공인 고용보험 가입지원" (중앙정부)
    breakdown: region=0.00, businessType=1.00, employee=1.00, revenue=1.00, businessAge=0.00, founderAge=0.00
    targets: region=[], type=["음식점업","소매업","기타서비스업"]

### Case #186: [기타] 30대 기타서비스업 5~9명 3~5년 광주
- **프로필**: 기타서비스업 / 광주 / 직원7명 / 매출7.5억 / 업력48개월 / 대표35세
- **매칭**: tailored=1, recommended=22, exploratory=50, total=73
- **knockout**: 464건 (7.3%), serviceType필터: 5272건
- **점수**: avg=0.40, max=0.70
- **Top3 평균 breakdown**: region=0.00, businessType=1.00, employee=1.00, revenue=0.67, businessAge=0.33, founderAge=0.32
- **태그**: none
- **상위 매칭 예시**:
  - [tailored] score=0.70 "청년일자리도약장려금" (공정채용기반과)
    breakdown: region=0.00, businessType=1.00, employee=1.00, revenue=0.00, businessAge=1.00, founderAge=0.95
    targets: region=[], type=["음식점업","소매업","기타서비스업","예술/스포츠"]
  - [recommended] score=0.49 "안양시 소상공인 이자보전 지원" (기업경제과)
    breakdown: region=0.00, businessType=1.00, employee=1.00, revenue=1.00, businessAge=0.00, founderAge=0.00
    targets: region=[], type=["음식점업","소매업","기타서비스업"]
  - [recommended] score=0.49 "소상공인 고용보험 가입지원" (중앙정부)
    breakdown: region=0.00, businessType=1.00, employee=1.00, revenue=1.00, businessAge=0.00, founderAge=0.00
    targets: region=[], type=["음식점업","소매업","기타서비스업"]

### Case #1: [기타] 50대 음식점업 5~9명 1억~5억 서울 (전형적 소상공인)
- **프로필**: 음식점업 / 서울 / 직원7명 / 매출3.0억 / 업력84개월 / 대표55세
- **매칭**: tailored=0, recommended=22, exploratory=50, total=72
- **knockout**: 483건 (7.6%), serviceType필터: 5272건
- **점수**: avg=0.38, max=0.51
- **Top3 평균 breakdown**: region=0.00, businessType=1.00, employee=1.00, revenue=1.00, businessAge=0.00, founderAge=0.00
- **태그**: edge, typical-small-biz
- **상위 매칭 예시**:
  - [recommended] score=0.49 "안양시 소상공인 이자보전 지원" (기업경제과)
    breakdown: region=0.00, businessType=1.00, employee=1.00, revenue=1.00, businessAge=0.00, founderAge=0.00
    targets: region=[], type=["음식점업","소매업","기타서비스업"]
  - [recommended] score=0.49 "소상공인 고용보험 가입지원" (중앙정부)
    breakdown: region=0.00, businessType=1.00, employee=1.00, revenue=1.00, businessAge=0.00, founderAge=0.00
    targets: region=[], type=["음식점업","소매업","기타서비스업"]
  - [recommended] score=0.49 "소상공인 노란우산공제 정액장려금 지원" (중앙정부)
    breakdown: region=0.00, businessType=1.00, employee=1.00, revenue=1.00, businessAge=0.00, founderAge=0.00
    targets: region=[], type=["음식점업","소매업","기타서비스업"]

## 6. NULL Bias 분석

| 지표 | 값 |
|------|-----|
| 모든 차원 데이터 없는 supports | 482개 (44.1%) |
| 데이터 없는 supports 평균 점수 | 0.00 |
| 데이터 있는 supports 평균 점수 | 0.29 |
| NULL bias ratio | 0.00 |

> NULL bias 없음. 데이터가 있는 supports가 적절히 더 높은 점수를 받고 있습니다.

## 7. 업종 Alias 분석

| 사용자 업종 | 매칭 타겟 업종 | 매칭 supports 수 |
|-----------|-------------|----------------|
| 음식점업 | 음식점업, 소매업, 기타서비스업, 제조업, 건설업, 전문서비스업, 숙박업, 교육서비스업, 예술/스포츠 | 51 |
| 소매업 | 음식점업, 소매업, 기타서비스업, 정보통신업, 도매업, 제조업, 운수업, 전문서비스업, 건설업, 교육서비스업, 예술/스포츠, 보건업 | 65 |
| 도매업 | 음식점업, 소매업, 기타서비스업, 정보통신업, 도매업, 제조업, 운수업, 전문서비스업, 건설업, 교육서비스업, 예술/스포츠, 보건업 | 65 |
| 제조업 | 제조업, 정보통신업, 전문서비스업, 예술/스포츠, 도매업, 운수업, 소매업, 건설업, 교육서비스업, 음식점업, 기타서비스업, 보건업 | 85 |
| 건설업 | 건설업, 소매업, 제조업, 운수업, 정보통신업, 교육서비스업, 예술/스포츠, 보건업, 전문서비스업, 음식점업, 기타서비스업, 도매업 | 13 |
| 운수업 | 운수업, 도매업, 제조업, 소매업, 건설업, 정보통신업, 교육서비스업, 예술/스포츠, 전문서비스업 | 12 |
| 숙박업 | 음식점업, 소매업, 기타서비스업, 제조업, 건설업, 전문서비스업, 숙박업, 교육서비스업, 예술/스포츠 | 51 |
| 정보통신업 | 정보통신업, 전문서비스업, 소매업, 교육서비스업, 보건업, 예술/스포츠, 제조업, 건설업, 운수업 | 132 |
| 전문서비스업 | 전문서비스업, 정보통신업, 보건업, 예술/스포츠, 제조업, 교육서비스업, 소매업, 건설업, 음식점업, 기타서비스업, 도매업, 운수업 | 170 |
| 교육서비스업 | 정보통신업, 교육서비스업, 전문서비스업, 예술/스포츠, 소매업, 제조업, 건설업, 운수업, 음식점업, 보건업 | 56 |
| 보건업 | 보건업, 전문서비스업, 정보통신업, 건설업, 제조업, 교육서비스업, 기타서비스업, 소매업 | 73 |
| 예술/스포츠 | 음식점업, 소매업, 기타서비스업, 전문서비스업, 예술/스포츠, 정보통신업, 교육서비스업, 제조업, 건설업, 운수업, 숙박업, 보건업 | 58 |
| 기타서비스업 | 음식점업, 소매업, 기타서비스업, 전문서비스업, 예술/스포츠, 정보통신업, 교육서비스업, 제조업, 건설업, 운수업, 숙박업, 보건업 | 58 |

## 8. Coverage Factor 분석

- 평균: 0.58
- 중위수: 0.51
- 공식: `0.1 + 0.9 * (totalActiveWeight / 1.0)`

> coverage factor는 활성 차원(hasData=true, confidence>=0.3)의 가중치 합에 비례합니다.
> 가중치 합이 1.0이면 coverage=1.0, 합이 0이면 coverage=0.1 (바닥).

## 8b. hasSpecificMatch 강등 분석

| 지표 | 값 |
|------|-----|
| 전체 매칭 있는 케이스 | 200 |
| tailored > 0 케이스 | 58 (29.0%) |
| recommended > 0 케이스 | 83 (41.5%) |
| 전부 exploratory 케이스 | 84 (42.0%) |

> **설명**: `scoreSupport()`에서 `hasSpecificMatch`가 false이면 tailored/recommended → exploratory로 강등됩니다.
> "specific" 차원은 region(isSpecific=true)과 businessType(isSpecific=true)입니다.
> 이 두 차원에서 rawScore >= 0.8인 매칭이 하나도 없으면 강등됩니다.
> DB에서 region 데이터가 있는 supports가 극소수(1%~2%)이므로, 대부분의 매칭에서 region 차원은 비활성입니다.
> businessType은 30% 정도에서 활성이지만, 업종이 다르면 0.0으로 즉시 실패합니다.

## 9. 알고리즘 개선 권고안

### P1-HIGH: hasSpecificMatch 강등이 과도함 (42% 케이스가 전부 exploratory)

전체 매칭 결과가 있는 케이스 중 42.0%에서 tailored/recommended가 0건이며, 모든 결과가 exploratory로 강등되었습니다. 원인: "specific" 차원(region, businessType)에서 rawScore >= 0.8인 매칭이 없으면 tailored/recommended → exploratory로 강등됩니다. DB에서 region 데이터가 있는 supports는 66개(전체의 1.0%)에 불과합니다. 해결안: (1) hasSpecificMatch 조건을 완화하거나, (2) region/businessType 데이터 커버리지를 높이거나, (3) hasSpecificMatch 강등을 tier 1단계 감소로 변경하세요.

**관련 파일**: `src/lib/matching-v4/index.ts (scoreSupport L89), src/lib/matching-v4/dimensions.ts (isSpecific)`

### P1-HIGH: Tier 분포 극단적 불균형 (tailored=0.32, exploratory=47.54)

평균 tailored 0.32건, exploratory 47.54건으로 대부분의 매칭이 exploratory에 집중됩니다. 사용자 관점에서 "맞춤(tailored)" 결과가 거의 없어 매칭 품질이 낮게 느껴집니다. 원인: (1) DB의 대다수 supports에서 추출 신뢰도가 낮아 활성 차원이 적고, (2) coverage factor가 점수를 낮추며, (3) hasSpecificMatch 미충족 시 exploratory로 강등됩니다. 해결안: tailored 임계값을 0.65→0.55로 낮추거나, coverage factor 바닥값을 0.1→0.3으로 올리세요.

**관련 파일**: `src/lib/matching-v4/index.ts (TIER_THRESHOLDS, scorePipeline coverage)`

### P3-LOW: 가중치 검토

현재 가중치: region=0.22, businessAge=0.20, businessType=0.18, employee=0.15, founderAge=0.15, revenue=0.10. region과 businessType이 "specific" 차원으로 분류되어 hasSpecificMatch 판정에 영향을 미칩니다. 이 두 차원이 모두 데이터 부족일 때 "specific match 없음" → exploratory 강등이 발생합니다.

**관련 파일**: `src/lib/matching-v4/dimensions.ts (BUSINESS_WEIGHTS), src/lib/matching-v4/index.ts (scoreSupport hasSpecificMatch)`

## 10. 전체 200 케이스 결과 요약

| # | 라벨 | 업종 | 지역 | 매칭총수 | tailored | recommended | exploratory | avg score | max score |
|---|------|------|------|---------|----------|-------------|-------------|-----------|-----------|
| 0 | 20대 예비창업자 IT 서울 (K-Startup 타겟) | 정보통신업 | 서울 | 52 | 1 | 1 | 50 | 0.36 | 0.84 |
| 1 | 50대 음식점업 5~9명 1억~5억 서울 (전형적 소상 | 음식점업 | 서울 | 72 | 0 | 22 | 50 | 0.38 | 0.51 |
| 2 | 제조업 50명+ 10억~50억 경기 (중소기업 R&D) | 제조업 | 경기 | 50 | 0 | 0 | 50 | 0.29 | 0.54 |
| 3 | 농업(기타서비스업) 1~4명 1억미만 전남 | 기타서비스업 | 전남 | 72 | 0 | 22 | 50 | 0.38 | 0.51 |
| 4 | 60대 10년이상 건설업 경남 (노후 사업체) | 건설업 | 경남 | 51 | 0 | 1 | 50 | 0.32 | 0.46 |
| 5 | 30대 IT 예비창업자 세종 (지방 창업) | 정보통신업 | 세종 | 51 | 0 | 1 | 50 | 0.35 | 0.51 |
| 6 | 소매업 1명 1억미만 제주 (영세 소매) | 소매업 | 제주 | 73 | 0 | 23 | 50 | 0.39 | 0.61 |
| 7 | 보건업 10~49명 5억~10억 대구 (의료기관) | 보건업 | 대구 | 50 | 0 | 0 | 50 | 0.37 | 0.61 |
| 8 | 20대 음식점업 50~99명 5~10년 서울 | 음식점업 | 서울 | 51 | 1 | 0 | 50 | 0.28 | 0.71 |
| 9 | 30대 음식점업 5~9명 예비 세종 | 음식점업 | 세종 | 73 | 1 | 22 | 50 | 0.40 | 0.70 |
| 10 | 50대 음식점업 10~49명 예비 경북 | 음식점업 | 경북 | 50 | 0 | 0 | 50 | 0.34 | 0.51 |
| 11 | 30대 음식점업 5~9명 10년+ 경남 | 음식점업 | 경남 | 72 | 0 | 22 | 50 | 0.38 | 0.64 |
| 12 | 60대+ 음식점업 100명+ 3~5년 경기 | 음식점업 | 경기 | 22 | 0 | 0 | 22 | 0.27 | 0.40 |
| 13 | 60대+ 음식점업 1~4명 1~3년 경기 | 음식점업 | 경기 | 72 | 0 | 22 | 50 | 0.38 | 0.51 |
| 14 | 50대 음식점업 10~49명 10년+ 서울 | 음식점업 | 서울 | 50 | 0 | 0 | 50 | 0.32 | 0.46 |
| 15 | 30대 음식점업 50~99명 3~5년 서울 | 음식점업 | 서울 | 52 | 2 | 0 | 50 | 0.29 | 0.70 |
| 16 | 30대 음식점업 100명+ 5~10년 서울 | 음식점업 | 서울 | 25 | 1 | 0 | 24 | 0.29 | 0.70 |
| 17 | 20대 음식점업 10~49명 1년미만 대구 | 음식점업 | 대구 | 51 | 1 | 0 | 50 | 0.34 | 0.71 |
| 18 | 20대 음식점업 10~49명 1~3년 제주 | 음식점업 | 제주 | 51 | 1 | 0 | 50 | 0.35 | 0.71 |
| 19 | 40대 음식점업 1~4명 1~3년 대구 | 음식점업 | 대구 | 72 | 0 | 22 | 50 | 0.39 | 0.61 |
| 20 | 40대 음식점업 1~4명 5~10년 경남 | 음식점업 | 경남 | 72 | 0 | 22 | 50 | 0.39 | 0.61 |
| 21 | 60대+ 음식점업 10~49명 1~3년 강원 | 음식점업 | 강원 | 50 | 0 | 0 | 50 | 0.33 | 0.51 |
| 22 | 40대 음식점업 1~4명 1~3년 경남 | 음식점업 | 경남 | 72 | 0 | 22 | 50 | 0.39 | 0.61 |
| 23 | 40대 음식점업 10~49명 1~3년 서울 | 음식점업 | 서울 | 51 | 1 | 0 | 50 | 0.35 | 0.81 |
| 24 | 20대 음식점업 10~49명 3~5년 전북 | 음식점업 | 전북 | 51 | 1 | 0 | 50 | 0.35 | 0.71 |
| 25 | 40대 음식점업 10~49명 예비 전남 | 음식점업 | 전남 | 50 | 0 | 0 | 50 | 0.35 | 0.51 |
| 26 | 30대 음식점업 1~4명 1년미만 서울 | 음식점업 | 서울 | 73 | 1 | 22 | 50 | 0.40 | 0.84 |
| 27 | 30대 소매업 10~49명 1년미만 광주 | 소매업 | 광주 | 51 | 1 | 0 | 50 | 0.35 | 0.70 |
| 28 | 40대 소매업 1~4명 1년미만 강원 | 소매업 | 강원 | 50 | 0 | 0 | 50 | 0.34 | 0.51 |
| 29 | 20대 소매업 1~4명 예비 경남 | 소매업 | 경남 | 72 | 0 | 22 | 50 | 0.39 | 0.51 |
| 30 | 20대 소매업 1~4명 예비 대전 | 소매업 | 대전 | 72 | 0 | 22 | 50 | 0.39 | 0.51 |
| 31 | 40대 소매업 5~9명 1년미만 광주 | 소매업 | 광주 | 50 | 0 | 0 | 50 | 0.34 | 0.51 |
| 32 | 30대 소매업 50~99명 1년미만 인천 | 소매업 | 인천 | 52 | 2 | 0 | 50 | 0.29 | 0.76 |
| 33 | 60대+ 소매업 10~49명 1~3년 서울 | 소매업 | 서울 | 51 | 0 | 1 | 50 | 0.32 | 0.51 |
| 34 | 30대 소매업 1~4명 1~3년 서울 | 소매업 | 서울 | 52 | 1 | 1 | 50 | 0.35 | 0.84 |
| 35 | 50대 소매업 10~49명 3~5년 경기 | 소매업 | 경기 | 51 | 0 | 1 | 50 | 0.32 | 0.51 |
| 36 | 40대 소매업 5~9명 3~5년 서울 | 소매업 | 서울 | 74 | 1 | 23 | 50 | 0.39 | 0.75 |
| 37 | 50대 소매업 50~99명 1~3년 경남 | 소매업 | 경남 | 51 | 0 | 1 | 50 | 0.26 | 0.44 |
| 38 | 20대 소매업 5~9명 3~5년 충북 | 소매업 | 충북 | 52 | 1 | 1 | 50 | 0.35 | 0.71 |
| 39 | 50대 소매업 5~9명 1~3년 경기 | 소매업 | 경기 | 73 | 0 | 23 | 50 | 0.38 | 0.51 |
| 40 | 40대 소매업 5~9명 예비 부산 | 소매업 | 부산 | 50 | 0 | 0 | 50 | 0.34 | 0.51 |
| 41 | 30대 제조업 5~9명 1년미만 충북 | 제조업 | 충북 | 50 | 0 | 0 | 50 | 0.35 | 0.51 |
| 42 | 60대+ 제조업 1~4명 예비 대전 | 제조업 | 대전 | 51 | 0 | 1 | 50 | 0.33 | 0.51 |
| 43 | 30대 제조업 5~9명 10년+ 충남 | 제조업 | 충남 | 50 | 0 | 0 | 50 | 0.35 | 0.64 |
| 44 | 40대 제조업 5~9명 1년미만 인천 | 제조업 | 인천 | 51 | 1 | 0 | 50 | 0.36 | 0.81 |
| 45 | 30대 제조업 5~9명 3~5년 서울 | 제조업 | 서울 | 51 | 1 | 0 | 50 | 0.36 | 0.77 |
| 46 | 40대 제조업 5~9명 10년+ 서울 | 제조업 | 서울 | 50 | 0 | 0 | 50 | 0.34 | 0.61 |
| 47 | 30대 제조업 1~4명 1년미만 대구 | 제조업 | 대구 | 50 | 0 | 0 | 50 | 0.35 | 0.51 |
| 48 | 30대 제조업 1~4명 3~5년 부산 | 제조업 | 부산 | 50 | 0 | 0 | 50 | 0.35 | 0.64 |
| 49 | 40대 제조업 5~9명 1~3년 경기 | 제조업 | 경기 | 51 | 1 | 0 | 50 | 0.36 | 0.81 |
| 50 | 30대 제조업 5~9명 예비 부산 | 제조업 | 부산 | 51 | 0 | 1 | 50 | 0.36 | 0.51 |
| 51 | 30대 제조업 50~99명 1~3년 경남 | 제조업 | 경남 | 50 | 0 | 0 | 50 | 0.29 | 0.56 |
| 52 | 60대+ 제조업 1~4명 3~5년 부산 | 제조업 | 부산 | 50 | 0 | 0 | 50 | 0.33 | 0.51 |
| 53 | 20대 제조업 10~49명 10년+ 세종 | 제조업 | 세종 | 50 | 0 | 0 | 50 | 0.34 | 0.64 |
| 54 | 20대 제조업 10~49명 1년미만 경기 | 제조업 | 경기 | 51 | 1 | 0 | 50 | 0.35 | 0.84 |
| 55 | 60대+ 정보통신업 100명+ 1~3년 충남 | 정보통신업 | 충남 | 50 | 0 | 0 | 50 | 0.26 | 0.26 |
| 56 | 30대 정보통신업 100명+ 5~10년 서울 | 정보통신업 | 서울 | 50 | 0 | 0 | 50 | 0.27 | 0.41 |
| 57 | 30대 정보통신업 50~99명 1년미만 부산 | 정보통신업 | 부산 | 50 | 0 | 0 | 50 | 0.29 | 0.42 |
| 58 | 40대 정보통신업 1~4명 3~5년 경기 | 정보통신업 | 경기 | 52 | 1 | 1 | 50 | 0.36 | 0.75 |
| 59 | 60대+ 정보통신업 5~9명 1~3년 울산 | 정보통신업 | 울산 | 50 | 0 | 0 | 50 | 0.33 | 0.51 |
| 60 | 50대 정보통신업 100명+ 1년미만 제주 | 정보통신업 | 제주 | 50 | 0 | 0 | 50 | 0.26 | 0.33 |
| 61 | 50대 정보통신업 50~99명 10년+ 대전 | 정보통신업 | 대전 | 50 | 0 | 0 | 50 | 0.26 | 0.37 |
| 62 | 20대 정보통신업 10~49명 예비 서울 | 정보통신업 | 서울 | 52 | 1 | 1 | 50 | 0.36 | 0.84 |
| 63 | 40대 정보통신업 10~49명 1~3년 경남 | 정보통신업 | 경남 | 50 | 0 | 0 | 50 | 0.34 | 0.61 |
| 64 | 20대 정보통신업 10~49명 예비 인천 | 정보통신업 | 인천 | 52 | 1 | 1 | 50 | 0.35 | 0.84 |
| 65 | 40대 정보통신업 5~9명 1년미만 경남 | 정보통신업 | 경남 | 50 | 0 | 0 | 50 | 0.35 | 0.51 |
| 66 | 20대 정보통신업 5~9명 예비 서울 | 정보통신업 | 서울 | 52 | 1 | 1 | 50 | 0.35 | 0.84 |
| 67 | 20대 정보통신업 5~9명 10년+ 광주 | 정보통신업 | 광주 | 50 | 0 | 0 | 50 | 0.34 | 0.64 |
| 68 | 30대 도매업 5~9명 5~10년 충남 | 도매업 | 충남 | 74 | 1 | 23 | 50 | 0.39 | 0.70 |
| 69 | 40대 도매업 1~4명 1년미만 경기 | 도매업 | 경기 | 51 | 1 | 0 | 50 | 0.35 | 0.81 |
| 70 | 30대 도매업 50~99명 3~5년 서울 | 도매업 | 서울 | 53 | 2 | 1 | 50 | 0.29 | 0.70 |
| 71 | 60대+ 도매업 5~9명 1~3년 울산 | 도매업 | 울산 | 73 | 0 | 23 | 50 | 0.38 | 0.51 |
| 72 | 40대 도매업 5~9명 5~10년 대구 | 도매업 | 대구 | 73 | 0 | 23 | 50 | 0.39 | 0.61 |
| 73 | 50대 도매업 50~99명 10년+ 부산 | 도매업 | 부산 | 51 | 0 | 1 | 50 | 0.25 | 0.44 |
| 74 | 50대 도매업 1~4명 예비 전북 | 도매업 | 전북 | 72 | 0 | 22 | 50 | 0.38 | 0.51 |
| 75 | 30대 도매업 1~4명 예비 전남 | 도매업 | 전남 | 72 | 0 | 22 | 50 | 0.39 | 0.51 |
| 76 | 60대+ 도매업 5~9명 10년+ 대구 | 도매업 | 대구 | 73 | 0 | 23 | 50 | 0.37 | 0.49 |
| 77 | 50대 도매업 10~49명 1~3년 울산 | 도매업 | 울산 | 51 | 0 | 1 | 50 | 0.33 | 0.51 |
| 78 | 60대+ 건설업 1~4명 1~3년 대전 | 건설업 | 대전 | 50 | 0 | 0 | 50 | 0.33 | 0.51 |
| 79 | 60대+ 건설업 5~9명 1~3년 부산 | 건설업 | 부산 | 50 | 0 | 0 | 50 | 0.33 | 0.51 |
| 80 | 30대 건설업 5~9명 1년미만 서울 | 건설업 | 서울 | 51 | 1 | 0 | 50 | 0.36 | 0.84 |
| 81 | 60대+ 건설업 50~99명 1~3년 경기 | 건설업 | 경기 | 50 | 0 | 0 | 50 | 0.24 | 0.42 |
| 82 | 40대 건설업 1~4명 10년+ 경남 | 건설업 | 경남 | 51 | 0 | 1 | 50 | 0.34 | 0.61 |
| 83 | 30대 건설업 1~4명 1~3년 대전 | 건설업 | 대전 | 50 | 0 | 0 | 50 | 0.35 | 0.64 |
| 84 | 30대 건설업 1~4명 5~10년 광주 | 건설업 | 광주 | 50 | 0 | 0 | 50 | 0.35 | 0.64 |
| 85 | 30대 건설업 100명+ 3~5년 경기 | 건설업 | 경기 | 13 | 0 | 0 | 13 | 0.28 | 0.41 |
| 86 | 50대 건설업 5~9명 1년미만 경남 | 건설업 | 경남 | 50 | 0 | 0 | 50 | 0.32 | 0.51 |
| 87 | 50대 운수업 5~9명 1~3년 전남 | 운수업 | 전남 | 50 | 0 | 0 | 50 | 0.32 | 0.51 |
| 88 | 30대 운수업 5~9명 1년미만 충남 | 운수업 | 충남 | 50 | 0 | 0 | 50 | 0.34 | 0.51 |
| 89 | 30대 운수업 50~99명 3~5년 부산 | 운수업 | 부산 | 50 | 0 | 0 | 50 | 0.26 | 0.56 |
| 90 | 50대 운수업 5~9명 1~3년 서울 | 운수업 | 서울 | 50 | 0 | 0 | 50 | 0.33 | 0.51 |
| 91 | 30대 운수업 10~49명 5~10년 강원 | 운수업 | 강원 | 50 | 0 | 0 | 50 | 0.34 | 0.64 |
| 92 | 20대 운수업 10~49명 예비 경기 | 운수업 | 경기 | 51 | 1 | 0 | 50 | 0.35 | 0.84 |
| 93 | 20대 운수업 100명+ 예비 부산 | 운수업 | 부산 | 13 | 0 | 0 | 13 | 0.28 | 0.41 |
| 94 | 30대 운수업 1~4명 10년+ 강원 | 운수업 | 강원 | 50 | 0 | 0 | 50 | 0.34 | 0.64 |
| 95 | 40대 운수업 100명+ 5~10년 대구 | 운수업 | 대구 | 13 | 0 | 0 | 13 | 0.27 | 0.39 |
| 96 | 20대 운수업 50~99명 예비 전북 | 운수업 | 전북 | 50 | 0 | 0 | 50 | 0.26 | 0.42 |
| 97 | 50대 숙박업 1~4명 10년+ 대전 | 숙박업 | 대전 | 50 | 0 | 0 | 50 | 0.32 | 0.46 |
| 98 | 40대 숙박업 1~4명 1~3년 경기 | 숙박업 | 경기 | 73 | 1 | 22 | 50 | 0.39 | 0.81 |
| 99 | 20대 숙박업 100명+ 1~3년 부산 | 숙박업 | 부산 | 24 | 1 | 0 | 23 | 0.29 | 0.71 |
| 100 | 60대+ 숙박업 50~99명 3~5년 충북 | 숙박업 | 충북 | 50 | 0 | 0 | 50 | 0.25 | 0.42 |
| 101 | 40대 숙박업 1~4명 1~3년 충남 | 숙박업 | 충남 | 72 | 0 | 22 | 50 | 0.39 | 0.61 |
| 102 | 50대 숙박업 5~9명 3~5년 부산 | 숙박업 | 부산 | 72 | 0 | 22 | 50 | 0.38 | 0.51 |
| 103 | 50대 숙박업 50~99명 3~5년 인천 | 숙박업 | 인천 | 50 | 0 | 0 | 50 | 0.25 | 0.42 |
| 104 | 30대 숙박업 5~9명 5~10년 충남 | 숙박업 | 충남 | 73 | 1 | 22 | 50 | 0.39 | 0.70 |
| 105 | 50대 숙박업 5~9명 3~5년 대전 | 숙박업 | 대전 | 50 | 0 | 0 | 50 | 0.32 | 0.51 |
| 106 | 60대+ 숙박업 5~9명 10년+ 대구 | 숙박업 | 대구 | 72 | 0 | 22 | 50 | 0.37 | 0.49 |
| 107 | 50대 교육서비스업 100명+ 5~10년 서울 | 교육서비스업 | 서울 | 49 | 0 | 2 | 47 | 0.28 | 0.53 |
| 108 | 20대 교육서비스업 10~49명 5~10년 제주 | 교육서비스업 | 제주 | 51 | 0 | 1 | 50 | 0.35 | 0.64 |
| 109 | 30대 교육서비스업 50~99명 1년미만 울산 | 교육서비스업 | 울산 | 54 | 0 | 4 | 50 | 0.31 | 0.44 |
| 110 | 60대+ 교육서비스업 10~49명 5~10년 광주 | 교육서비스업 | 광주 | 52 | 0 | 2 | 50 | 0.33 | 0.53 |
| 111 | 50대 교육서비스업 10~49명 3~5년 세종 | 교육서비스업 | 세종 | 52 | 0 | 2 | 50 | 0.33 | 0.53 |
| 112 | 20대 교육서비스업 50~99명 3~5년 서울 | 교육서비스업 | 서울 | 52 | 1 | 1 | 50 | 0.30 | 0.69 |
| 113 | 50대 교육서비스업 1~4명 예비 대구 | 교육서비스업 | 대구 | 56 | 0 | 6 | 50 | 0.35 | 0.51 |
| 114 | 50대 교육서비스업 1~4명 3~5년 충북 | 교육서비스업 | 충북 | 51 | 0 | 1 | 50 | 0.33 | 0.51 |
| 115 | 40대 교육서비스업 100명+ 3~5년 인천 | 교육서비스업 | 인천 | 52 | 0 | 2 | 50 | 0.28 | 0.52 |
| 116 | 30대 교육서비스업 50~99명 예비 부산 | 교육서비스업 | 부산 | 56 | 0 | 6 | 50 | 0.31 | 0.44 |
| 117 | 30대 보건업 50~99명 1년미만 세종 | 보건업 | 세종 | 50 | 0 | 0 | 50 | 0.32 | 0.42 |
| 118 | 50대 보건업 1~4명 10년+ 경기 | 보건업 | 경기 | 51 | 0 | 1 | 50 | 0.35 | 0.46 |
| 119 | 30대 보건업 50~99명 5~10년 울산 | 보건업 | 울산 | 50 | 0 | 0 | 50 | 0.32 | 0.56 |
| 120 | 20대 보건업 5~9명 1~3년 서울 | 보건업 | 서울 | 51 | 1 | 0 | 50 | 0.36 | 0.84 |
| 121 | 20대 보건업 100명+ 1년미만 전남 | 보건업 | 전남 | 39 | 0 | 0 | 39 | 0.27 | 0.41 |
| 122 | 20대 보건업 1~4명 1년미만 세종 | 보건업 | 세종 | 50 | 0 | 0 | 50 | 0.34 | 0.51 |
| 123 | 60대+ 보건업 50~99명 5~10년 서울 | 보건업 | 서울 | 50 | 0 | 0 | 50 | 0.32 | 0.42 |
| 124 | 20대 보건업 5~9명 10년+ 서울 | 보건업 | 서울 | 51 | 0 | 1 | 50 | 0.33 | 0.64 |
| 125 | 30대 보건업 100명+ 5~10년 울산 | 보건업 | 울산 | 48 | 0 | 0 | 48 | 0.31 | 0.41 |
| 126 | 50대 전문서비스업 100명+ 5~10년 경기 | 전문서비스업 | 경기 | 51 | 0 | 1 | 50 | 0.28 | 0.44 |
| 127 | 40대 전문서비스업 10~49명 5~10년 대전 | 전문서비스업 | 대전 | 51 | 0 | 1 | 50 | 0.35 | 0.61 |
| 128 | 40대 전문서비스업 1~4명 5~10년 전북 | 전문서비스업 | 전북 | 51 | 0 | 1 | 50 | 0.35 | 0.61 |
| 129 | 40대 전문서비스업 10~49명 예비 세종 | 전문서비스업 | 세종 | 50 | 0 | 0 | 50 | 0.36 | 0.51 |
| 130 | 50대 전문서비스업 5~9명 3~5년 서울 | 전문서비스업 | 서울 | 52 | 0 | 2 | 50 | 0.34 | 0.51 |
| 131 | 60대+ 전문서비스업 1~4명 예비 경기 | 전문서비스업 | 경기 | 51 | 0 | 1 | 50 | 0.35 | 0.51 |
| 132 | 40대 전문서비스업 1~4명 3~5년 전북 | 전문서비스업 | 전북 | 52 | 0 | 2 | 50 | 0.36 | 0.61 |
| 133 | 50대 전문서비스업 1~4명 3~5년 경기 | 전문서비스업 | 경기 | 52 | 0 | 2 | 50 | 0.34 | 0.51 |
| 134 | 50대 예술/스포츠 100명+ 예비 충북 | 예술/스포츠 | 충북 | 29 | 0 | 0 | 29 | 0.27 | 0.40 |
| 135 | 50대 예술/스포츠 100명+ 5~10년 충남 | 예술/스포츠 | 충남 | 29 | 0 | 0 | 29 | 0.27 | 0.40 |
| 136 | 30대 예술/스포츠 50~99명 1년미만 대구 | 예술/스포츠 | 대구 | 51 | 1 | 0 | 50 | 0.29 | 0.70 |
| 137 | 50대 예술/스포츠 50~99명 10년+ 대구 | 예술/스포츠 | 대구 | 50 | 0 | 0 | 50 | 0.25 | 0.40 |
| 138 | 50대 예술/스포츠 50~99명 1년미만 경기 | 예술/스포츠 | 경기 | 50 | 0 | 0 | 50 | 0.26 | 0.42 |
| 139 | 30대 예술/스포츠 1~4명 5~10년 경남 | 예술/스포츠 | 경남 | 72 | 0 | 22 | 50 | 0.39 | 0.64 |
| 140 | 30대 예술/스포츠 10~49명 1~3년 대전 | 예술/스포츠 | 대전 | 51 | 1 | 0 | 50 | 0.35 | 0.70 |
| 141 | 30대 예술/스포츠 10~49명 3~5년 경기 | 예술/스포츠 | 경기 | 52 | 2 | 0 | 50 | 0.36 | 0.77 |
| 142 | 50대 기타서비스업 1~4명 10년+ 충북 | 기타서비스업 | 충북 | 72 | 0 | 22 | 50 | 0.37 | 0.49 |
| 143 | 50대 기타서비스업 1~4명 10년+ 전북 | 기타서비스업 | 전북 | 72 | 0 | 22 | 50 | 0.37 | 0.49 |
| 144 | 20대 기타서비스업 10~49명 5~10년 세종 | 기타서비스업 | 세종 | 51 | 1 | 0 | 50 | 0.34 | 0.71 |
| 145 | 50대 기타서비스업 100명+ 5~10년 서울 | 기타서비스업 | 서울 | 30 | 0 | 0 | 30 | 0.27 | 0.40 |
| 146 | 40대 기타서비스업 10~49명 예비 경북 | 기타서비스업 | 경북 | 50 | 0 | 0 | 50 | 0.34 | 0.51 |
| 147 | 40대 기타서비스업 1~4명 예비 경북 | 기타서비스업 | 경북 | 50 | 0 | 0 | 50 | 0.34 | 0.51 |
| 148 | 30대 기타서비스업 100명+ 10년+ 충북 | 기타서비스업 | 충북 | 29 | 0 | 0 | 29 | 0.27 | 0.37 |
| 149 | 40대 기타서비스업 50~99명 10년+ 강원 | 기타서비스업 | 강원 | 50 | 0 | 0 | 50 | 0.27 | 0.54 |
| 150 | 60대+ 기타서비스업 1~4명 1년미만 서울 | 기타서비스업 | 서울 | 50 | 0 | 0 | 50 | 0.33 | 0.51 |
| 151 | 50대 기타서비스업 10~49명 예비 광주 | 기타서비스업 | 광주 | 50 | 0 | 0 | 50 | 0.32 | 0.51 |
| 152 | 40대 기타서비스업 50~99명 1~3년 경북 | 기타서비스업 | 경북 | 50 | 0 | 0 | 50 | 0.27 | 0.54 |
| 153 | 20대 기타서비스업 100명+ 3~5년 서울 | 기타서비스업 | 서울 | 32 | 1 | 0 | 31 | 0.28 | 0.71 |
| 154 | 20대 기타서비스업 5~9명 1~3년 전남 | 기타서비스업 | 전남 | 73 | 1 | 22 | 50 | 0.39 | 0.71 |
| 155 | 60대+ 기타서비스업 5~9명 5~10년 제주 | 기타서비스업 | 제주 | 72 | 0 | 22 | 50 | 0.38 | 0.51 |
| 156 | 40대 기타서비스업 5~9명 5~10년 인천 | 기타서비스업 | 인천 | 73 | 1 | 22 | 50 | 0.39 | 0.69 |
| 157 | 60대+ 기타서비스업 5~9명 3~5년 서울 | 기타서비스업 | 서울 | 50 | 0 | 0 | 50 | 0.32 | 0.51 |
| 158 | 60대+ 기타서비스업 10~49명 5~10년 대전 | 기타서비스업 | 대전 | 50 | 0 | 0 | 50 | 0.33 | 0.51 |
| 159 | 60대+ 기타서비스업 10~49명 5~10년 제주 | 기타서비스업 | 제주 | 50 | 0 | 0 | 50 | 0.33 | 0.51 |
| 160 | 20대 기타서비스업 100명+ 1~3년 서울 | 기타서비스업 | 서울 | 32 | 1 | 0 | 31 | 0.28 | 0.71 |
| 161 | 50대 기타서비스업 1~4명 5~10년 인천 | 기타서비스업 | 인천 | 73 | 1 | 22 | 50 | 0.38 | 0.69 |
| 162 | 20대 기타서비스업 100명+ 1~3년 경기 | 기타서비스업 | 경기 | 31 | 1 | 0 | 30 | 0.28 | 0.71 |
| 163 | 40대 기타서비스업 100명+ 10년+ 전남 | 기타서비스업 | 전남 | 29 | 0 | 0 | 29 | 0.27 | 0.40 |
| 164 | 60대+ 기타서비스업 50~99명 1년미만 경기 | 기타서비스업 | 경기 | 50 | 0 | 0 | 50 | 0.26 | 0.42 |
| 165 | 30대 기타서비스업 10~49명 10년+ 인천 | 기타서비스업 | 인천 | 50 | 0 | 0 | 50 | 0.33 | 0.64 |
| 166 | 30대 기타서비스업 1~4명 5~10년 서울 | 기타서비스업 | 서울 | 72 | 0 | 22 | 50 | 0.39 | 0.64 |
| 167 | 50대 기타서비스업 100명+ 1~3년 전북 | 기타서비스업 | 전북 | 29 | 0 | 0 | 29 | 0.27 | 0.40 |
| 168 | 20대 기타서비스업 10~49명 3~5년 경기 | 기타서비스업 | 경기 | 52 | 2 | 0 | 50 | 0.35 | 0.77 |
| 169 | 30대 기타서비스업 50~99명 10년+ 경남 | 기타서비스업 | 경남 | 50 | 0 | 0 | 50 | 0.27 | 0.56 |
| 170 | 20대 기타서비스업 5~9명 10년+ 인천 | 기타서비스업 | 인천 | 73 | 1 | 22 | 50 | 0.39 | 0.69 |
| 171 | 20대 기타서비스업 10~49명 3~5년 전북 | 기타서비스업 | 전북 | 51 | 1 | 0 | 50 | 0.35 | 0.71 |
| 172 | 30대 기타서비스업 5~9명 5~10년 서울 | 기타서비스업 | 서울 | 73 | 1 | 22 | 50 | 0.40 | 0.70 |
| 173 | 40대 기타서비스업 100명+ 3~5년 광주 | 기타서비스업 | 광주 | 30 | 0 | 0 | 30 | 0.27 | 0.40 |
| 174 | 40대 기타서비스업 5~9명 3~5년 울산 | 기타서비스업 | 울산 | 72 | 0 | 22 | 50 | 0.39 | 0.61 |
| 175 | 30대 기타서비스업 100명+ 1~3년 서울 | 기타서비스업 | 서울 | 32 | 1 | 0 | 31 | 0.29 | 0.70 |
| 176 | 30대 기타서비스업 50~99명 5~10년 강원 | 기타서비스업 | 강원 | 51 | 1 | 0 | 50 | 0.28 | 0.70 |
| 177 | 60대+ 기타서비스업 5~9명 1년미만 제주 | 기타서비스업 | 제주 | 50 | 0 | 0 | 50 | 0.33 | 0.51 |
| 178 | 20대 기타서비스업 10~49명 예비 경북 | 기타서비스업 | 경북 | 51 | 1 | 0 | 50 | 0.34 | 0.71 |
| 179 | 40대 기타서비스업 100명+ 5~10년 제주 | 기타서비스업 | 제주 | 30 | 0 | 0 | 30 | 0.27 | 0.40 |
| 180 | 50대 기타서비스업 50~99명 3~5년 서울 | 기타서비스업 | 서울 | 50 | 0 | 0 | 50 | 0.26 | 0.42 |
| 181 | 20대 기타서비스업 1~4명 10년+ 경기 | 기타서비스업 | 경기 | 72 | 0 | 22 | 50 | 0.38 | 0.64 |
| 182 | 30대 기타서비스업 1~4명 10년+ 경북 | 기타서비스업 | 경북 | 50 | 0 | 0 | 50 | 0.33 | 0.64 |
| 183 | 60대+ 기타서비스업 100명+ 1년미만 울산 | 기타서비스업 | 울산 | 29 | 0 | 0 | 29 | 0.27 | 0.40 |
| 184 | 40대 기타서비스업 1~4명 5~10년 광주 | 기타서비스업 | 광주 | 50 | 0 | 0 | 50 | 0.34 | 0.61 |
| 185 | 40대 기타서비스업 1~4명 1~3년 서울 | 기타서비스업 | 서울 | 73 | 1 | 22 | 50 | 0.40 | 0.81 |
| 186 | 30대 기타서비스업 5~9명 3~5년 광주 | 기타서비스업 | 광주 | 73 | 1 | 22 | 50 | 0.40 | 0.70 |
| 187 | 60대+ 기타서비스업 100명+ 10년+ 경북 | 기타서비스업 | 경북 | 29 | 0 | 0 | 29 | 0.27 | 0.40 |
| 188 | 50대 기타서비스업 1~4명 5~10년 대구 | 기타서비스업 | 대구 | 72 | 0 | 22 | 50 | 0.38 | 0.51 |
| 189 | 20대 기타서비스업 5~9명 예비 대구 | 기타서비스업 | 대구 | 51 | 1 | 0 | 50 | 0.34 | 0.71 |
| 190 | 40대 기타서비스업 10~49명 1~3년 인천 | 기타서비스업 | 인천 | 51 | 1 | 0 | 50 | 0.35 | 0.81 |
| 191 | 40대 기타서비스업 5~9명 10년+ 경기 | 기타서비스업 | 경기 | 72 | 0 | 22 | 50 | 0.38 | 0.61 |
| 192 | 30대 도매업 10~49명 1~3년 부산 (보충) | 도매업 | 부산 | 52 | 1 | 1 | 50 | 0.35 | 0.70 |
| 193 | 50대 제조업 5~9명 예비 인천 (보충) | 제조업 | 인천 | 51 | 0 | 1 | 50 | 0.35 | 0.51 |
| 194 | 20대 건설업 1~4명 예비 경기 (보충) | 건설업 | 경기 | 51 | 1 | 0 | 50 | 0.36 | 0.84 |
| 195 | 30대 운수업 1~4명 1년미만 강원 (보충) | 운수업 | 강원 | 50 | 0 | 0 | 50 | 0.35 | 0.51 |
| 196 | 20대 숙박업 5~9명 3~5년 경기 (보충) | 숙박업 | 경기 | 74 | 2 | 22 | 50 | 0.40 | 0.77 |
| 197 | 40대 정보통신업 50~99명 예비 세종 (보충) | 정보통신업 | 세종 | 51 | 0 | 1 | 50 | 0.29 | 0.44 |
| 198 | 60대+ 전문서비스업 5~9명 1년미만 경기 (보충) | 전문서비스업 | 경기 | 50 | 0 | 0 | 50 | 0.34 | 0.51 |
| 199 | 20대 교육서비스업 1~4명 예비 경기 (보충) | 교육서비스업 | 경기 | 57 | 1 | 6 | 50 | 0.37 | 0.84 |
