# Matching Algorithm 800-Case Enterprise Audit

> Audit date: 2026-02-16T13:09:21.540Z
> Duration: 0.9s
> Total supports in DB: 6364
> Cases: 400 personal + 400 business = 800
> Matcher version: v4 (dual-track)

## Executive Summary

| Track | Grade | Score | Key Issues |
|-------|-------|-------|------------|
| Personal (400) | **A** | 100/100 | None |
| Business (400) | **A** | 100/100 | None |
| **Overall** | **A** | **100/100** | |

### Monetization Readiness

**READY with caveats** -- Algorithm performs at acceptable levels but has notable weaknesses that should be addressed.

## Red Flags

| # | Severity | Flag | Value | Threshold | Detail |
|---|----------|------|-------|-----------|--------|
| 1 | CRITICAL | NULL_BUSINESSAGE (CONF>=0.3) | 99.2% | <80% | businessAge (conf>=0.3) is 99.2% NULL -- dimension is useless |
| 2 | HIGH | NULL_REGIONS (CONF>=0.3) | 99.0% | <80% | regions (conf>=0.3) is 99.0% NULL |
| 3 | HIGH | NULL_EMPLOYEE (CONF>=0.3) | 97.7% | <80% | employee (conf>=0.3) is 97.7% NULL |
| 4 | HIGH | NULL_REVENUE (CONF>=0.3) | 98.4% | <80% | revenue (conf>=0.3) is 98.4% NULL |
| 5 | HIGH | NULL_HOUSEHOLDTYPES (CONF>=0.3) | 93.3% | <80% | householdTypes (conf>=0.3) is 93.3% NULL |
| 6 | HIGH | NULL_INCOMELEVELS (CONF>=0.3) | 92.2% | <80% | incomeLevels (conf>=0.3) is 92.2% NULL |
| 7 | HIGH | NULL_EMPLOYMENTSTATUS (CONF>=0.3) | 93.9% | <80% | employmentStatus (conf>=0.3) is 93.9% NULL |
| 8 | MEDIUM | NULL_FOUNDERAGE (CONF>=0.3) | 89.7% | <80% | founderAge (conf>=0.3) is 89.7% NULL |
| 9 | MEDIUM | NULL_AGE (CONF>=0.3) | 80.3% | <80% | age (conf>=0.3) is 80.3% NULL |

## Data Quality Analysis

### Service Type Distribution
| Type | Count | % |
|------|-------|---|
| personal | 5272 | 82.8% |
| business | 677 | 10.6% |
| both | 415 | 6.5% |

### Business Dimension NULL Rates

> Fields populated out of all supports. "Effective" = confidence >= 0.3 AND data present.

| Dimension | Raw Populated | % | Effective (conf>=0.3) | % |
|-----------|--------------|---|----------------------|---|
| targetRegions | 66 | 1.0% | 66 | 1.0% |
| targetBusinessTypes | 1918 | 30.1% | 1918 | 30.1% |
| targetEmployeeMin | 33 | 0.5% | 148 | 2.3% |
| targetEmployeeMax | 124 | 1.9% | 148 | 2.3% |
| targetRevenueMin | 0 | 0.0% | 101 | 1.6% |
| targetRevenueMax | 101 | 1.6% | 101 | 1.6% |
| targetBusinessAgeMin | 6 | 0.1% | 49 | 0.8% |
| targetBusinessAgeMax | 43 | 0.7% | 49 | 0.8% |
| targetFounderAgeMin | 472 | 7.4% | 656 | 10.3% |
| targetFounderAgeMax | 224 | 3.5% | 656 | 10.3% |

### Personal Dimension NULL Rates

| Dimension | Raw Populated | % | Effective (conf>=0.3) | % |
|-----------|--------------|---|----------------------|---|
| targetRegions | 66 | 1.0% | 66 | 1.0% |
| targetAgeMin | 1425 | 22.4% | 1256 | 19.7% |
| targetAgeMax | 974 | 15.3% | 1256 | 19.7% |
| targetHouseholdTypes | 586 | 9.2% | 429 | 6.7% |
| targetIncomeLevels | 680 | 10.7% | 495 | 7.8% |
| targetEmploymentStatus | 409 | 6.4% | 386 | 6.1% |
| benefitCategories | 2941 | 46.2% | 6364 | 100.0% |

## Personal Track (400 cases)

**Grade: A (100/100)**

### Summary Statistics

| Metric | Total | Tailored | Recommended | Exploratory |
|--------|-------|----------|-------------|-------------|
| Mean | 23.6 | 12.4 | 10.3 | 0.8 |
| Median | 21.0 | 11.0 | 6.0 | 0.0 |
| Std Dev | 15.8 | 6.8 | 10.3 | 2.9 |
| Min | 0 | 0 | 0 | 0 |
| Max | 67 | 20 | 30 | 17 |
| P10 | 6 | 4 | 1 | 0 |
| P90 | 50 | 20 | 30 | 1 |

| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| Empty results | 2 (0.5%) | <5% | PASS |
| Over-match (100+) | 0 (0.0%) | <10% | PASS |
| Avg score | 0.573 | | |
| Score std dev | 0.0379 | >0.05 | WARN |
| Avg knockout | 26.1% | <30% | PASS |
| Avg coverage factor | 0.668 | | |

### By Region

### By Region (Personal)

| Region | Cases | Avg Matches | Avg Tailored | Avg Score | Empty |
|--------|-------|-------------|-------------|-----------|-------|
| 광주 | 20 | 29.9 | 14.2 | 0.561 | 0 |
| 경남 | 24 | 28.6 | 15.9 | 0.585 | 0 |
| 울산 | 14 | 27.5 | 13.2 | 0.485 | 2 |
| 부산 | 31 | 27.5 | 14.5 | 0.573 | 0 |
| 경북 | 12 | 27.4 | 13.5 | 0.572 | 0 |
| 전남 | 14 | 26.5 | 14.6 | 0.584 | 0 |
| 충북 | 16 | 25.4 | 12.3 | 0.571 | 0 |
| 대구 | 23 | 25.2 | 13.0 | 0.574 | 0 |
| 강원 | 13 | 25.0 | 11.2 | 0.560 | 0 |
| 세종 | 16 | 24.3 | 11.3 | 0.560 | 0 |
| 대전 | 18 | 23.3 | 10.9 | 0.560 | 0 |
| 전북 | 14 | 23.1 | 12.9 | 0.578 | 0 |
| 서울 | 72 | 21.0 | 12.2 | 0.578 | 0 |
| 제주 | 15 | 20.9 | 12.5 | 0.585 | 0 |
| 인천 | 24 | 20.2 | 11.3 | 0.568 | 0 |
| 경기 | 60 | 19.9 | 10.8 | 0.571 | 0 |
| 충남 | 14 | 18.1 | 9.1 | 0.570 | 0 |

### By Age Group (Personal)

| Age | Cases | Avg Matches | Avg Tailored | Avg Score |
|-----|-------|-------------|-------------|-----------|
| 10대 | 66 | 40.0 | 17.1 | 0.540 |
| 20대 | 69 | 18.7 | 13.3 | 0.596 |
| 30대 | 67 | 21.0 | 12.3 | 0.574 |
| 40대 | 66 | 10.8 | 6.8 | 0.560 |
| 50대 | 66 | 21.8 | 9.1 | 0.542 |
| 60대이상 | 66 | 29.3 | 16.0 | 0.605 |

### By Income Level (Personal)

| Income | Cases | Avg Matches | Avg Tailored |
|--------|-------|-------------|-------------|
| 기초생활 | 80 | 30.9 | 15.0 |
| 차상위 | 79 | 30.0 | 15.3 |
| 중위50이하 | 79 | 22.3 | 14.0 |
| 중위100이하 | 83 | 22.5 | 9.8 |
| 중위100초과 | 79 | 12.0 | 8.1 |

### By Household Type (Personal)

| Household | Cases | Avg Matches | Avg Tailored |
|-----------|-------|-------------|-------------|
| 1인 | 69 | 25.8 | 14.3 |
| 신혼부부 | 67 | 22.3 | 15.5 |
| 영유아 | 65 | 18.0 | 9.5 |
| 다자녀 | 66 | 22.4 | 11.0 |
| 한부모 | 65 | 38.5 | 15.7 |
| 일반 | 68 | 14.7 | 8.6 |

## Business Track (400 cases)

**Grade: A (100/100)**

### Summary Statistics

| Metric | Total | Tailored | Recommended | Exploratory |
|--------|-------|----------|-------------|-------------|
| Mean | 42.7 | 3.4 | 32.0 | 7.3 |
| Median | 49.0 | 1.0 | 42.0 | 2.0 |
| Std Dev | 16.0 | 6.8 | 17.9 | 14.7 |
| Min | 0 | 0 | 0 | 0 |
| Max | 65 | 20 | 50 | 46 |
| P10 | 4 | 0 | 2 | 0 |
| P90 | 52 | 20 | 49 | 42 |

| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| Empty results | 7 (1.8%) | <5% | PASS |
| Over-match (100+) | 0 (0.0%) | <10% | PASS |
| Avg score | 0.478 | | |
| Score std dev | 0.0601 | >0.05 | PASS |
| Avg knockout | 7.7% | <30% | PASS |
| Avg coverage factor | 0.686 | | |

### By Business Type

| Type | Cases | Avg Matches | Avg Tailored | Avg Score | Empty |
|------|-------|-------------|-------------|-----------|-------|
| 제조업 | 36 | 47.7 | 0.4 | 0.466 | 0 |
| 음식점업 | 41 | 46.6 | 10.2 | 0.497 | 0 |
| 교육서비스업 | 26 | 46.4 | 2.7 | 0.449 | 0 |
| 기타서비스업 | 70 | 45.9 | 8.2 | 0.492 | 0 |
| 보건업 | 21 | 42.8 | 0.3 | 0.492 | 0 |
| 정보통신업 | 36 | 42.5 | 0.4 | 0.462 | 0 |
| 운수업 | 22 | 41.1 | 0.3 | 0.427 | 2 |
| 소매업 | 31 | 40.9 | 7.3 | 0.497 | 0 |
| 전문서비스업 | 26 | 40.2 | 1.2 | 0.493 | 0 |
| 숙박업 | 22 | 38.2 | 0.2 | 0.428 | 2 |
| 예술/스포츠 | 21 | 37.1 | 0.2 | 0.479 | 0 |
| 건설업 | 27 | 37.0 | 0.3 | 0.454 | 0 |
| 도매업 | 21 | 35.9 | 0.1 | 0.387 | 3 |

### By Region (Business)

| Region | Cases | Avg Matches | Avg Tailored | Empty |
|--------|-------|-------------|-------------|-------|
| 인천 | 27 | 48.2 | 4.4 | 0 |
| 광주 | 17 | 48.0 | 3.6 | 0 |
| 경북 | 18 | 47.2 | 5.9 | 0 |
| 대구 | 26 | 45.6 | 2.9 | 1 |
| 제주 | 18 | 44.6 | 2.5 | 0 |
| 경기 | 57 | 43.1 | 3.3 | 2 |
| 전북 | 15 | 42.7 | 4.3 | 0 |
| 울산 | 15 | 42.7 | 5.7 | 0 |
| 충남 | 13 | 42.5 | 1.6 | 0 |
| 전남 | 14 | 42.2 | 1.6 | 0 |
| 강원 | 15 | 42.2 | 3.2 | 1 |
| 충북 | 13 | 41.8 | 2.2 | 0 |
| 경남 | 23 | 41.5 | 3.2 | 1 |
| 부산 | 31 | 40.3 | 2.5 | 1 |
| 서울 | 69 | 39.9 | 4.4 | 1 |
| 세종 | 14 | 39.0 | 3.0 | 0 |
| 대전 | 15 | 36.3 | 0.7 | 0 |

### By Employee Size (Business)

| Size | Cases | Avg Matches | Avg Tailored |
|------|-------|-------------|-------------|
| 1~4명 | 104 | 48.8 | 6.7 |
| 5~9명 | 94 | 49.0 | 5.8 |
| 50~99명 | 59 | 51.0 | 0.8 |
| 10~49명 | 87 | 47.3 | 0.6 |
| 100명+ | 56 | 4.6 | 0.5 |

### By Business Age

| Age | Cases | Avg Matches | Avg Tailored |
|-----|-------|-------------|-------------|
| 예비창업 | 77 | 41.7 | 4.0 |
| 5~10년 | 56 | 45.0 | 3.0 |
| 3~5년 | 75 | 43.6 | 4.3 |
| 10년+ | 46 | 39.0 | 2.6 |
| 1~3년 | 78 | 41.6 | 2.6 |
| 1년미만 | 68 | 44.6 | 3.7 |

## Top 10 Most Critical Issues

| # | Priority | Issue | Files |
|---|----------|-------|-------|
| 2 | P0-CRITICAL | 9 dimensions have >80% NULL data | `src/lib/extraction/index.ts (extraction pipeline)` |
| 8 | P2-MEDIUM | Interest category bonus is additive (+0.10) | `src/lib/matching-v4/index.ts (scorePipeline` |
| 9 | P2-MEDIUM | Knockout requires confidence >= 0.7, but most data has low confidence | `src/lib/matching-v4/dimensions.ts (isKnockedOutBusiness` |
| 10 | P2-MEDIUM | Organization diversity cap (maxPerOrg=3) may hide relevant results | `src/lib/matching-v4/index.ts (enforceOrgDiversity)` |

### Issue #2: 9 dimensions have >80% NULL data

Most dimensions that the algorithm relies on have no usable data. The algorithm effectively scores based on 1-2 active dimensions for most supports, making results generic and indistinguishable.

**Files**: `src/lib/extraction/index.ts (extraction pipeline), src/lib/extraction/*.ts`

### Issue #8: Interest category bonus is additive (+0.10)

The +0.10 flat bonus can cross tier thresholds artificially. A support scoring 0.55 (recommended) gets bumped to 0.65 (tailored) just because it has matching benefit category, regardless of eligibility fit.

**Files**: `src/lib/matching-v4/index.ts (scorePipeline, interest bonus)`

### Issue #9: Knockout requires confidence >= 0.7, but most data has low confidence

The knockout filter only activates when extraction confidence >= 0.7. With most dimensions having confidence < 0.3, knockouts rarely fire, allowing irrelevant supports through.

**Files**: `src/lib/matching-v4/dimensions.ts (isKnockedOutBusiness, isKnockedOutPersonal)`

### Issue #10: Organization diversity cap (maxPerOrg=3) may hide relevant results

If a single organization (e.g., "중소벤처기업부") has many relevant programs, only 3 per tier are shown. This is good for diversity but may hide the best matches.

**Files**: `src/lib/matching-v4/index.ts (enforceOrgDiversity)`

## Recommended Code Changes

### Change 1: Relax hasSpecificMatch demotion (HIGH IMPACT)

```typescript
// src/lib/matching-v4/index.ts, scoreSupport function
// BEFORE:
if (!result.hasSpecificMatch && (tier === 'tailored' || tier === 'recommended')) tier = 'exploratory'

// AFTER: Demote by 1 tier instead of straight to exploratory
if (!result.hasSpecificMatch && tier === 'tailored') tier = 'recommended'
// Do NOT demote recommended -> exploratory (allow recommended without specific match)
```

### Change 2: Raise coverage factor floor (MEDIUM IMPACT)

```typescript
// src/lib/matching-v4/index.ts, scorePipeline function
// BEFORE:
const coverageFactor = 0.1 + 0.9 * (totalActiveWeight / 1.0)

// AFTER: Higher floor prevents scores from being crushed
const coverageFactor = 0.3 + 0.7 * (totalActiveWeight / 1.0)
```

### Change 3: Make interest bonus multiplicative (LOW IMPACT)

```typescript
// src/lib/matching-v4/index.ts, scorePipeline function
// BEFORE:
if (hasInterestBonus) finalScore = Math.min(1.0, finalScore + 0.10)

// AFTER: Proportional bonus prevents artificial tier jumps
if (hasInterestBonus) finalScore = Math.min(1.0, finalScore * 1.12)
```

### Change 4: Lower tier thresholds (MEDIUM IMPACT)

```typescript
// src/lib/matching-v4/index.ts
// BEFORE:
const TIER_THRESHOLDS = { tailored: 0.65, recommended: 0.40, exploratory: 0.20 }

// AFTER: Account for low data coverage
const TIER_THRESHOLDS = { tailored: 0.55, recommended: 0.35, exploratory: 0.15 }
```

### Change 5: Minimum 2 active dimensions for scoring (LOW IMPACT)

```typescript
// src/lib/matching-v4/index.ts, scorePipeline function
// BEFORE:
if (activeDims.length < 1) return null

// AFTER: Require at least 2 dimensions for meaningful scoring
if (activeDims.length < 2) return null
```

## Full 800-Case Results (Compact)

### Match Count Distribution

| Range | Personal | Business | Total |
|-------|----------|----------|-------|
| 0~0 | 2 (0.5%) | 7 (1.8%) | 9 |
| 1~4 | 18 (4.5%) | 34 (8.5%) | 52 |
| 5~9 | 76 (19.0%) | 7 (1.8%) | 83 |
| 10~19 | 82 (20.5%) | 8 (2.0%) | 90 |
| 20~29 | 100 (25.0%) | 0 (0.0%) | 100 |
| 30~49 | 81 (20.3%) | 157 (39.3%) | 238 |
| 50~99 | 41 (10.3%) | 187 (46.8%) | 228 |
| 100+ | 0 (0.0%) | 0 (0.0%) | 0 |

### Problem Cases (Top 30)

| # | Track | Label | Total | T/R/E | KO% | Avg Score | Problem |
|---|-------|-------|-------|-------|-----|-----------|---------|
| 1 | personal | P187: 40대 여성 울산 일반 중위100초과 무직 | 0 | 0/0/0 | 31.8% | 0.000 | EMPTY |
| 2 | personal | P359: 40대 여성 울산 영유아 중위100초과 무직 | 0 | 0/0/0 | 31.8% | 0.000 | EMPTY |
| 3 | business | 도매업 100명+ 50억이상 경기 | 0 | 0/0/0 | 9.2% | 0.000 | EMPTY |
| 4 | business | B158: 60대+ 도매업 100명+ 3~5년 경남 | 0 | 0/0/0 | 9.2% | 0.000 | EMPTY |
| 5 | business | B159: 60대+ 도매업 100명+ 5~10년 대구 | 0 | 0/0/0 | 9.2% | 0.000 | EMPTY |
| 6 | business | B197: 60대+ 운수업 100명+ 1~3년 서울 | 0 | 0/0/0 | 9.0% | 0.000 | EMPTY |
| 7 | business | B206: 60대+ 운수업 100명+ 1~3년 강원 | 0 | 0/0/0 | 9.1% | 0.000 | EMPTY |
| 8 | business | B226: 60대+ 숙박업 100명+ 1~3년 경기 | 0 | 0/0/0 | 9.2% | 0.000 | EMPTY |
| 9 | business | B387: (보충) 숙박업 부산 | 0 | 0/0/0 | 9.2% | 0.000 | EMPTY |

---

*Generated by audit-matching-800.ts on 2026-02-16T13:09:21.542Z*
*Duration: 0.9s | 800 cases against 6364 supports*