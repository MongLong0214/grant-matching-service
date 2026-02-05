#!/usr/bin/env tsx

/**
 * Matching Accuracy Verification Script
 *
 * Verifies that the matching engine produces CORRECT results for all 11,050 input
 * combinations. Not just "does the API respond" but "are the matched supports
 * actually correct for this input?"
 *
 * Phase 1: Fetch supports + build local scoring engine (replicating matching-v2.ts)
 * Phase 2: Local full verification (all 11,050 combos) - pure computation, no API
 * Phase 3: API spot-check (100 random combos vs local calculation)
 * Phase 4: Comprehensive summary
 *
 * Run with: npx tsx scripts/verify-matching-accuracy.ts
 */

// ---------------------------------------------------------------------------
// Constants (mirrored from src/constants/index.ts)
// ---------------------------------------------------------------------------

const BUSINESS_TYPES = [
  "음식점업", "소매업", "도매업", "제조업", "건설업", "운수업", "숙박업",
  "정보통신업", "전문서비스업", "교육서비스업", "보건업", "예술/스포츠", "기타서비스업",
]

const REGIONS = [
  "서울", "부산", "대구", "인천", "광주", "대전", "울산", "세종",
  "경기", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주",
]

const EMPLOYEE_COUNTS = [2, 7, 30, 75, 150]
const ANNUAL_REVENUES = [50_000_000, 300_000_000, 750_000_000, 3_000_000_000, 10_000_000_000]
const BUSINESS_START_DATES = ["2025-06-01", "2018-01-01"]

const API_BASE = "http://localhost:3000"
const SPOT_CHECK_COUNT = 100
const SPOT_CHECK_BATCH_SIZE = 10

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Support {
  id: string
  title: string
  organization: string
  category: string
  targetRegions: string[] | null
  targetBusinessTypes: string[] | null
  targetEmployeeMin: number | null
  targetEmployeeMax: number | null
  targetRevenueMin: number | null
  targetRevenueMax: number | null
  targetBusinessAgeMin: number | null
  targetBusinessAgeMax: number | null
  isActive: boolean
  [key: string]: unknown
}

interface Breakdown {
  region: number
  businessType: number
  employee: number
  revenue: number
  businessAge: number
}

type MatchTier = "exact" | "likely" | "related"

interface ScoredResult {
  supportId: string
  score: number
  tier: MatchTier
  breakdown: Breakdown
}

interface InputCombo {
  businessType: string
  region: string
  employeeCount: number
  annualRevenue: number
  businessStartDate: string
}

interface Anomaly {
  type: string
  combo: InputCombo
  supportId: string
  supportTitle: string
  detail: string
}

// ---------------------------------------------------------------------------
// Scoring functions (exact replica of src/lib/matching-v2.ts)
// ---------------------------------------------------------------------------

const TIER_THRESHOLDS = { exact: 0.7, likely: 0.4, related: 0.15 } as const
const WEIGHTS = {
  region: 0.25,
  businessType: 0.25,
  employee: 0.20,
  revenue: 0.15,
  businessAge: 0.15,
} as const

function calculateBusinessAgeMonths(startDateString: string): number {
  const startDate = new Date(startDateString)
  const now = new Date()
  const months =
    (now.getFullYear() - startDate.getFullYear()) * 12 +
    (now.getMonth() - startDate.getMonth())
  return Math.max(0, months)
}

function scoreRegion(support: Support, userRegion: string): number {
  if (!support.targetRegions || support.targetRegions.length === 0) return 1.0
  return support.targetRegions.includes(userRegion) ? 1.0 : 0.0
}

function scoreBusinessType(support: Support, userType: string): number {
  if (!support.targetBusinessTypes || support.targetBusinessTypes.length === 0) return 1.0
  return support.targetBusinessTypes.includes(userType) ? 1.0 : 0.0
}

function scoreEmployee(support: Support, userCount: number): number {
  const min = support.targetEmployeeMin
  const max = support.targetEmployeeMax

  if (min === null && max === null) return 1.0

  // Both bounds
  if (min !== null && max !== null) {
    if (userCount >= min && userCount <= max) return 1.0
    const range = max - min
    if (range > 0) {
      if (userCount < min) {
        const dist = (min - userCount) / range
        return Math.max(0, 1 - dist)
      }
      if (userCount > max) {
        const dist = (userCount - max) / range
        return Math.max(0, 1 - dist)
      }
    }
    return 0.0
  }

  // Only max
  if (max !== null) {
    if (userCount <= max) return 1.0
    const overRatio = (userCount - max) / max
    return Math.max(0, 1 - overRatio)
  }

  // Only min
  if (min !== null) {
    if (userCount >= min) return 1.0
    const underRatio = (min - userCount) / min
    return Math.max(0, 1 - underRatio)
  }

  return 1.0
}

function scoreRevenue(support: Support, userRevenue: number): number {
  const min = support.targetRevenueMin
  const max = support.targetRevenueMax

  if (min === null && max === null) return 1.0

  if (min !== null && max !== null) {
    if (userRevenue >= min && userRevenue <= max) return 1.0
    const range = max - min
    if (range > 0) {
      if (userRevenue < min) {
        const dist = (min - userRevenue) / range
        return Math.max(0, 1 - dist)
      }
      if (userRevenue > max) {
        const dist = (userRevenue - max) / range
        return Math.max(0, 1 - dist)
      }
    }
    return 0.0
  }

  if (max !== null) {
    if (userRevenue <= max) return 1.0
    const overRatio = (userRevenue - max) / max
    return Math.max(0, 1 - overRatio)
  }

  if (min !== null) {
    if (userRevenue >= min) return 1.0
    const underRatio = (min - userRevenue) / min
    return Math.max(0, 1 - underRatio)
  }

  return 1.0
}

function scoreBusinessAge(support: Support, userAgeMonths: number): number {
  const min = support.targetBusinessAgeMin
  const max = support.targetBusinessAgeMax

  if (min === null && max === null) return 1.0

  if (min !== null && max !== null) {
    if (userAgeMonths >= min && userAgeMonths <= max) return 1.0
    const range = max - min
    if (range > 0) {
      if (userAgeMonths < min) {
        const dist = (min - userAgeMonths) / range
        return Math.max(0, 1 - dist)
      }
      if (userAgeMonths > max) {
        const dist = (userAgeMonths - max) / range
        return Math.max(0, 1 - dist)
      }
    }
    return 0.0
  }

  if (max !== null) {
    if (userAgeMonths <= max) return 1.0
    const overRatio = (userAgeMonths - max) / Math.max(max, 12)
    return Math.max(0, 1 - overRatio)
  }

  if (min !== null) {
    if (userAgeMonths >= min) return 1.0
    const underRatio = (min - userAgeMonths) / Math.max(min, 12)
    return Math.max(0, 1 - underRatio)
  }

  return 1.0
}

function getTier(score: number): MatchTier | null {
  if (score >= TIER_THRESHOLDS.exact) return "exact"
  if (score >= TIER_THRESHOLDS.likely) return "likely"
  if (score >= TIER_THRESHOLDS.related) return "related"
  return null
}

function scoreSupport(support: Support, input: InputCombo): ScoredResult | null {
  const businessAgeMonths = calculateBusinessAgeMonths(input.businessStartDate)

  const breakdown: Breakdown = {
    region: scoreRegion(support, input.region),
    businessType: scoreBusinessType(support, input.businessType),
    employee: scoreEmployee(support, input.employeeCount),
    revenue: scoreRevenue(support, input.annualRevenue),
    businessAge: scoreBusinessAge(support, businessAgeMonths),
  }

  const score =
    breakdown.region * WEIGHTS.region +
    breakdown.businessType * WEIGHTS.businessType +
    breakdown.employee * WEIGHTS.employee +
    breakdown.revenue * WEIGHTS.revenue +
    breakdown.businessAge * WEIGHTS.businessAge

  const tier = getTier(score)
  if (!tier) return null

  return { supportId: support.id, score, tier, breakdown }
}

// ---------------------------------------------------------------------------
// Phase 1: Fetch all supports
// ---------------------------------------------------------------------------

async function fetchAllSupports(): Promise<Support[]> {
  console.log("--- Phase 1: Fetching all supports ---\n")

  const allSupports: Support[] = []
  let page = 1
  const perPage = 100

  while (true) {
    const url = `${API_BASE}/api/supports?page=${page}&perPage=${perPage}&activeOnly=true`
    const res = await fetch(url)
    if (!res.ok) {
      throw new Error(`Failed to fetch supports page ${page}: HTTP ${res.status}`)
    }
    const json = await res.json()
    if (!json.success) {
      throw new Error(`Supports API error: ${json.error}`)
    }

    const supports: Support[] = json.data
    allSupports.push(...supports)

    const totalPages = json.metadata.totalPages
    console.log(`  Fetched page ${page}/${totalPages} (${supports.length} supports)`)

    if (page >= totalPages) break
    page++
  }

  console.log(`\n  Total supports fetched: ${allSupports.length}\n`)
  return allSupports
}

// ---------------------------------------------------------------------------
// Phase 2: Local full verification
// ---------------------------------------------------------------------------

interface LocalVerificationResult {
  totalAssignments: number
  tierCounts: { exact: number; likely: number; related: number; excluded: number }
  anomalies: Anomaly[]
  semanticChecks: {
    exactWithBothZero: number
    regionScoreIncorrect: number
    typeScoreIncorrect: number
    scoreMathError: number
    tierAssignmentError: number
  }
  regionDistribution: Map<string, { exact: number; likely: number; related: number; count: number }>
  typeDistribution: Map<string, { exact: number; likely: number; related: number; count: number }>
}

function runLocalVerification(supports: Support[]): LocalVerificationResult {
  console.log("--- Phase 2: Local Full Verification (11,050 combinations) ---\n")

  const result: LocalVerificationResult = {
    totalAssignments: 0,
    tierCounts: { exact: 0, likely: 0, related: 0, excluded: 0 },
    anomalies: [],
    semanticChecks: {
      exactWithBothZero: 0,
      regionScoreIncorrect: 0,
      typeScoreIncorrect: 0,
      scoreMathError: 0,
      tierAssignmentError: 0,
    },
    regionDistribution: new Map(),
    typeDistribution: new Map(),
  }

  // Initialize distribution maps
  for (const r of REGIONS) {
    result.regionDistribution.set(r, { exact: 0, likely: 0, related: 0, count: 0 })
  }
  for (const t of BUSINESS_TYPES) {
    result.typeDistribution.set(t, { exact: 0, likely: 0, related: 0, count: 0 })
  }

  let comboIndex = 0
  const totalCombos = BUSINESS_TYPES.length * REGIONS.length * EMPLOYEE_COUNTS.length *
    ANNUAL_REVENUES.length * BUSINESS_START_DATES.length

  for (const businessType of BUSINESS_TYPES) {
    for (const region of REGIONS) {
      for (const employeeCount of EMPLOYEE_COUNTS) {
        for (const annualRevenue of ANNUAL_REVENUES) {
          for (const businessStartDate of BUSINESS_START_DATES) {
            comboIndex++
            const input: InputCombo = { businessType, region, employeeCount, annualRevenue, businessStartDate }

            const regionDist = result.regionDistribution.get(region)!
            const typeDist = result.typeDistribution.get(businessType)!
            regionDist.count++
            typeDist.count++

            for (const support of supports) {
              const scored = scoreSupport(support, input)

              if (!scored) {
                result.tierCounts.excluded++
                result.totalAssignments++
                continue
              }

              result.totalAssignments++

              // Count tier
              if (scored.tier === "exact") {
                result.tierCounts.exact++
                regionDist.exact++
                typeDist.exact++
              } else if (scored.tier === "likely") {
                result.tierCounts.likely++
                regionDist.likely++
                typeDist.likely++
              } else if (scored.tier === "related") {
                result.tierCounts.related++
                regionDist.related++
                typeDist.related++
              }

              // --- Semantic Check 1: No exact match with both region=0 AND type=0 ---
              if (
                scored.tier === "exact" &&
                scored.breakdown.region === 0.0 &&
                scored.breakdown.businessType === 0.0
              ) {
                result.semanticChecks.exactWithBothZero++
                result.anomalies.push({
                  type: "FALSE_POSITIVE_EXACT",
                  combo: input,
                  supportId: support.id,
                  supportTitle: support.title,
                  detail: `Exact tier (score=${scored.score.toFixed(4)}) but region=0 AND type=0. ` +
                    `Breakdown: emp=${scored.breakdown.employee.toFixed(2)}, ` +
                    `rev=${scored.breakdown.revenue.toFixed(2)}, ` +
                    `age=${scored.breakdown.businessAge.toFixed(2)}`,
                })
              }

              // --- Semantic Check 2: Region score correctness ---
              if (support.targetRegions && support.targetRegions.length > 0) {
                const expectedRegionScore = support.targetRegions.includes(region) ? 1.0 : 0.0
                if (Math.abs(scored.breakdown.region - expectedRegionScore) > 0.001) {
                  result.semanticChecks.regionScoreIncorrect++
                  result.anomalies.push({
                    type: "FALSE_HIGH_REGION",
                    combo: input,
                    supportId: support.id,
                    supportTitle: support.title,
                    detail: `Region score=${scored.breakdown.region} but expected ${expectedRegionScore}. ` +
                      `targetRegions=${JSON.stringify(support.targetRegions)}, input=${region}`,
                  })
                }
              }

              // --- Semantic Check 3: BusinessType score correctness ---
              if (support.targetBusinessTypes && support.targetBusinessTypes.length > 0) {
                const expectedTypeScore = support.targetBusinessTypes.includes(businessType) ? 1.0 : 0.0
                if (Math.abs(scored.breakdown.businessType - expectedTypeScore) > 0.001) {
                  result.semanticChecks.typeScoreIncorrect++
                  result.anomalies.push({
                    type: "FALSE_HIGH_TYPE",
                    combo: input,
                    supportId: support.id,
                    supportTitle: support.title,
                    detail: `BusinessType score=${scored.breakdown.businessType} but expected ${expectedTypeScore}. ` +
                      `targetBusinessTypes=${JSON.stringify(support.targetBusinessTypes)}, input=${businessType}`,
                  })
                }
              }

              // --- Semantic Check 4: Score math verification ---
              const expectedScore =
                scored.breakdown.region * WEIGHTS.region +
                scored.breakdown.businessType * WEIGHTS.businessType +
                scored.breakdown.employee * WEIGHTS.employee +
                scored.breakdown.revenue * WEIGHTS.revenue +
                scored.breakdown.businessAge * WEIGHTS.businessAge

              if (Math.abs(scored.score - expectedScore) > 0.001) {
                result.semanticChecks.scoreMathError++
                result.anomalies.push({
                  type: "SCORE_MATH_ERROR",
                  combo: input,
                  supportId: support.id,
                  supportTitle: support.title,
                  detail: `Calculated score=${scored.score.toFixed(6)} but expected ` +
                    `${expectedScore.toFixed(6)} from breakdown sum`,
                })
              }

              // --- Semantic Check 5: Tier assignment matches thresholds ---
              const expectedTier = getTier(scored.score)
              if (expectedTier !== scored.tier) {
                result.semanticChecks.tierAssignmentError++
                result.anomalies.push({
                  type: "TIER_ASSIGNMENT_ERROR",
                  combo: input,
                  supportId: support.id,
                  supportTitle: support.title,
                  detail: `Tier=${scored.tier} but score=${scored.score.toFixed(4)} should be tier=${expectedTier}`,
                })
              }
            }

            // Progress
            if (comboIndex % 1000 === 0) {
              const pct = ((comboIndex / totalCombos) * 100).toFixed(1)
              process.stdout.write(`  Progress: ${comboIndex.toLocaleString()}/${totalCombos.toLocaleString()} (${pct}%)\r`)
            }
          }
        }
      }
    }
  }

  console.log(`  Progress: ${totalCombos.toLocaleString()}/${totalCombos.toLocaleString()} (100.0%)`)
  console.log(`  Local verification complete.\n`)

  return result
}

// ---------------------------------------------------------------------------
// Phase 3: API spot-check
// ---------------------------------------------------------------------------

interface SpotCheckResult {
  total: number
  agreements: number
  scoreDiscrepancies: number
  maxScoreDiff: number
  tierDiscrepancies: number
  missingFromApi: number
  extraInApi: number
  errors: string[]
}

function pickRandomCombos(count: number): InputCombo[] {
  const allCombos: InputCombo[] = []
  for (const businessType of BUSINESS_TYPES) {
    for (const region of REGIONS) {
      for (const employeeCount of EMPLOYEE_COUNTS) {
        for (const annualRevenue of ANNUAL_REVENUES) {
          for (const businessStartDate of BUSINESS_START_DATES) {
            allCombos.push({ businessType, region, employeeCount, annualRevenue, businessStartDate })
          }
        }
      }
    }
  }

  // Fisher-Yates shuffle and take first `count`
  for (let i = allCombos.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[allCombos[i], allCombos[j]] = [allCombos[j], allCombos[i]]
  }
  return allCombos.slice(0, count)
}

async function runSpotCheck(supports: Support[]): Promise<SpotCheckResult> {
  console.log(`--- Phase 3: API Spot-Check (${SPOT_CHECK_COUNT} random samples) ---\n`)

  const combos = pickRandomCombos(SPOT_CHECK_COUNT)
  const result: SpotCheckResult = {
    total: SPOT_CHECK_COUNT,
    agreements: 0,
    scoreDiscrepancies: 0,
    maxScoreDiff: 0,
    tierDiscrepancies: 0,
    missingFromApi: 0,
    extraInApi: 0,
    errors: [],
  }

  for (let batchStart = 0; batchStart < combos.length; batchStart += SPOT_CHECK_BATCH_SIZE) {
    const batch = combos.slice(batchStart, batchStart + SPOT_CHECK_BATCH_SIZE)

    const batchResults = await Promise.all(
      batch.map(async (input) => {
        try {
          const res = await fetch(`${API_BASE}/api/diagnose`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(input),
          })
          const json = await res.json()
          if (!json.success) {
            return { input, error: json.error || `HTTP ${res.status}`, apiScored: null }
          }
          return { input, error: null, apiScored: json.data.scored as Array<{ supportId: string; score: number; tier: string; breakdown: Breakdown }> }
        } catch (err) {
          return { input, error: err instanceof Error ? err.message : "Unknown", apiScored: null }
        }
      })
    )

    for (const { input, error, apiScored } of batchResults) {
      if (error || !apiScored) {
        result.errors.push(`[${input.region}/${input.businessType}] ${error}`)
        continue
      }

      // Compute local scores
      const localScored: ScoredResult[] = []
      for (const support of supports) {
        const s = scoreSupport(support, input)
        if (s) localScored.push(s)
      }

      // Build maps for comparison
      const localMap = new Map<string, ScoredResult>()
      for (const s of localScored) localMap.set(s.supportId, s)

      const apiMap = new Map<string, { supportId: string; score: number; tier: string; breakdown: Breakdown }>()
      for (const s of apiScored) apiMap.set(s.supportId, s)

      let comboMatch = true

      // Check all API results exist locally
      for (const [id, apiEntry] of apiMap) {
        const localEntry = localMap.get(id)
        if (!localEntry) {
          result.extraInApi++
          comboMatch = false
          continue
        }

        // API rounds score: Math.round(score * 100) / 100
        const localRounded = Math.round(localEntry.score * 100) / 100
        const scoreDiff = Math.abs(localRounded - apiEntry.score)

        if (scoreDiff > 0.01) {
          result.scoreDiscrepancies++
          result.maxScoreDiff = Math.max(result.maxScoreDiff, scoreDiff)
          comboMatch = false
        }

        if (localEntry.tier !== apiEntry.tier) {
          result.tierDiscrepancies++
          comboMatch = false
        }
      }

      // Check all local results exist in API
      for (const [id] of localMap) {
        if (!apiMap.has(id)) {
          result.missingFromApi++
          comboMatch = false
        }
      }

      if (comboMatch) result.agreements++
    }

    const done = Math.min(batchStart + SPOT_CHECK_BATCH_SIZE, combos.length)
    process.stdout.write(`  Spot-checked: ${done}/${SPOT_CHECK_COUNT}\r`)
  }

  console.log(`  Spot-checked: ${SPOT_CHECK_COUNT}/${SPOT_CHECK_COUNT}`)
  console.log(`  Spot-check complete.\n`)

  return result
}

// ---------------------------------------------------------------------------
// Phase 4: Comprehensive summary
// ---------------------------------------------------------------------------

function printSummary(
  supports: Support[],
  localResult: LocalVerificationResult,
  spotResult: SpotCheckResult,
) {
  const withRegions = supports.filter(s => s.targetRegions && s.targetRegions.length > 0).length
  const withTypes = supports.filter(s => s.targetBusinessTypes && s.targetBusinessTypes.length > 0).length
  const withEmpRange = supports.filter(s => s.targetEmployeeMin !== null || s.targetEmployeeMax !== null).length
  const withRevRange = supports.filter(s => s.targetRevenueMin !== null || s.targetRevenueMax !== null).length
  const withAgeRange = supports.filter(s => s.targetBusinessAgeMin !== null || s.targetBusinessAgeMax !== null).length
  const withNoRestrictions = supports.filter(s =>
    (!s.targetRegions || s.targetRegions.length === 0) &&
    (!s.targetBusinessTypes || s.targetBusinessTypes.length === 0) &&
    s.targetEmployeeMin === null && s.targetEmployeeMax === null &&
    s.targetRevenueMin === null && s.targetRevenueMax === null &&
    s.targetBusinessAgeMin === null && s.targetBusinessAgeMax === null
  ).length

  const totalAnomalies =
    localResult.semanticChecks.exactWithBothZero +
    localResult.semanticChecks.regionScoreIncorrect +
    localResult.semanticChecks.typeScoreIncorrect +
    localResult.semanticChecks.scoreMathError +
    localResult.semanticChecks.tierAssignmentError

  const check = (count: number) => count === 0 ? "OK" : "FAIL"

  console.log("=== MATCHING ACCURACY VERIFICATION ===\n")
  console.log(`Supports analyzed: ${supports.length} (${withRegions} with region restrictions, ${withTypes} with type restrictions)\n`)

  console.log("--- Support Data Quality ---")
  console.log(`Supports with targetRegions: ${withRegions}/${supports.length}`)
  console.log(`Supports with targetBusinessTypes: ${withTypes}/${supports.length}`)
  console.log(`Supports with employeeRange: ${withEmpRange}/${supports.length}`)
  console.log(`Supports with revenueRange: ${withRevRange}/${supports.length}`)
  console.log(`Supports with businessAgeRange: ${withAgeRange}/${supports.length}`)
  console.log(`Supports with NO restrictions at all: ${withNoRestrictions} (these match everyone)\n`)

  const totalCombos = BUSINESS_TYPES.length * REGIONS.length * EMPLOYEE_COUNTS.length *
    ANNUAL_REVENUES.length * BUSINESS_START_DATES.length
  console.log(`--- Local Verification (${totalCombos.toLocaleString()} combinations) ---`)
  console.log(`Total match assignments: ${localResult.totalAssignments.toLocaleString()}`)
  console.log(`  Exact tier: ${localResult.tierCounts.exact.toLocaleString()}`)
  console.log(`  Likely tier: ${localResult.tierCounts.likely.toLocaleString()}`)
  console.log(`  Related tier: ${localResult.tierCounts.related.toLocaleString()}`)
  console.log(`  Below threshold (excluded): ${localResult.tierCounts.excluded.toLocaleString()}\n`)

  console.log("Semantic checks:")
  console.log(`  ${check(localResult.semanticChecks.exactWithBothZero)} No exact match with both region=0 AND type=0: ${localResult.semanticChecks.exactWithBothZero} violations`)
  console.log(`  ${check(localResult.semanticChecks.regionScoreIncorrect)} Region score correct for all restricted supports: ${localResult.semanticChecks.regionScoreIncorrect} violations`)
  console.log(`  ${check(localResult.semanticChecks.typeScoreIncorrect)} BusinessType score correct for all restricted supports: ${localResult.semanticChecks.typeScoreIncorrect} violations`)
  console.log(`  ${check(localResult.semanticChecks.scoreMathError)} Score math verified (weight sum correct): ${localResult.semanticChecks.scoreMathError} violations`)
  console.log(`  ${check(localResult.semanticChecks.tierAssignmentError)} Tier assignment matches score thresholds: ${localResult.semanticChecks.tierAssignmentError} violations`)

  if (localResult.anomalies.length > 0) {
    console.log(`\nAnomaly details (first 20):`)
    for (const a of localResult.anomalies.slice(0, 20)) {
      const comboStr = `${a.combo.region}/${a.combo.businessType}/emp=${a.combo.employeeCount}/rev=${a.combo.annualRevenue}/date=${a.combo.businessStartDate}`
      console.log(`  [${comboStr}] support "${a.supportTitle}" (${a.supportId}): ${a.detail}`)
    }
    if (localResult.anomalies.length > 20) {
      console.log(`  ... and ${localResult.anomalies.length - 20} more anomalies`)
    }
  }

  console.log(`\n--- API Spot-Check (${SPOT_CHECK_COUNT} random samples) ---`)
  console.log(`API vs Local agreement: ${spotResult.agreements}/${spotResult.total}`)
  console.log(`Score discrepancies: ${spotResult.scoreDiscrepancies} (max diff: ${spotResult.maxScoreDiff.toFixed(4)})`)
  console.log(`Tier discrepancies: ${spotResult.tierDiscrepancies}`)
  console.log(`Missing from API: ${spotResult.missingFromApi}`)
  console.log(`Extra in API: ${spotResult.extraInApi}`)
  if (spotResult.errors.length > 0) {
    console.log(`API errors: ${spotResult.errors.length}`)
    for (const e of spotResult.errors.slice(0, 5)) {
      console.log(`  ${e}`)
    }
  }

  // Per-region distribution
  console.log("\n--- Per-Region Match Distribution ---")
  const totalCombosPerRegion = (BUSINESS_TYPES.length * EMPLOYEE_COUNTS.length *
    ANNUAL_REVENUES.length * BUSINESS_START_DATES.length)
  for (const region of REGIONS) {
    const d = localResult.regionDistribution.get(region)!
    const avgExact = (d.exact / totalCombosPerRegion).toFixed(1)
    const avgLikely = (d.likely / totalCombosPerRegion).toFixed(1)
    const avgRelated = (d.related / totalCombosPerRegion).toFixed(1)
    console.log(`${region}: avg ${avgExact} exact, ${avgLikely} likely, ${avgRelated} related`)
  }

  // Per-businessType distribution
  console.log("\n--- Per-BusinessType Match Distribution ---")
  const totalCombosPerType = (REGIONS.length * EMPLOYEE_COUNTS.length *
    ANNUAL_REVENUES.length * BUSINESS_START_DATES.length)
  for (const type of BUSINESS_TYPES) {
    const d = localResult.typeDistribution.get(type)!
    const avgExact = (d.exact / totalCombosPerType).toFixed(1)
    const avgLikely = (d.likely / totalCombosPerType).toFixed(1)
    const avgRelated = (d.related / totalCombosPerType).toFixed(1)
    console.log(`${type}: avg ${avgExact} exact, ${avgLikely} likely, ${avgRelated} related`)
  }

  const spotAnomalies = spotResult.scoreDiscrepancies + spotResult.tierDiscrepancies +
    spotResult.missingFromApi + spotResult.extraInApi + spotResult.errors.length
  const totalIssues = totalAnomalies + spotAnomalies
  const verdict = totalIssues === 0 ? "PASS" : "FAIL"
  console.log(`\n=== VERDICT: ${verdict} (${totalIssues} anomalies found) ===`)

  return totalIssues
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const startTime = Date.now()

  console.log("============================================================")
  console.log("  MATCHING ACCURACY VERIFICATION")
  console.log("  Verifying correctness of ALL 11,050 input combinations")
  console.log("============================================================\n")

  // Phase 1
  const supports = await fetchAllSupports()

  // Phase 2
  const localResult = runLocalVerification(supports)

  // Phase 3
  const spotResult = await runSpotCheck(supports)

  // Phase 4
  console.log("")
  const totalIssues = printSummary(supports, localResult, spotResult)

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
  console.log(`\nTotal execution time: ${elapsed}s`)

  if (totalIssues > 0) {
    process.exit(1)
  }
}

main().catch((err) => {
  console.error("Fatal error:", err)
  process.exit(1)
})
