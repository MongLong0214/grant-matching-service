#!/usr/bin/env tsx

/**
 * Exhaustive API Testing Script
 *
 * Tests ALL valid combinations of the diagnose API:
 * - 13 business types × 17 regions × 5 employee counts × 5 revenue options × 2 dates = 11,050 tests
 * - Plus invalid input validation tests
 *
 * Run with: npx tsx scripts/test-all-combinations.ts
 */

const API_URL = 'http://localhost:3000/api/diagnose'
const BATCH_SIZE = 50
const PROGRESS_INTERVAL = 500

// Constants matching src/constants/index.ts
const BUSINESS_TYPES = [
  "음식점업", "소매업", "도매업", "제조업", "건설업", "운수업", "숙박업",
  "정보통신업", "전문서비스업", "교육서비스업", "보건업", "예술/스포츠", "기타서비스업"
]

const REGIONS = [
  "서울", "부산", "대구", "인천", "광주", "대전", "울산", "세종",
  "경기", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주"
]

const EMPLOYEE_COUNTS = [2, 7, 30, 75, 150]
const ANNUAL_REVENUES = [50_000_000, 300_000_000, 750_000_000, 3_000_000_000, 10_000_000_000]
const BUSINESS_START_DATES = ["2025-06-01", "2018-01-01"]

interface TestResult {
  success: boolean
  duration: number
  matchedCount?: number
  tiers?: { exact: number; likely: number; related: number }
  error?: string
  input?: any
}

interface Stats {
  total: number
  successes: number
  failures: number
  minDuration: number
  maxDuration: number
  totalDuration: number
  minMatched: number
  maxMatched: number
  totalMatched: number
  totalExact: number
  totalLikely: number
  totalRelated: number
  failedInputs: Array<{ input: any; error: string }>
}

async function testSingleCombination(
  businessType: string,
  region: string,
  employeeCount: number,
  annualRevenue: number,
  businessStartDate: string
): Promise<TestResult> {
  const startTime = Date.now()

  const input = {
    businessType,
    region,
    employeeCount,
    annualRevenue,
    businessStartDate
  }

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input)
    })

    const data = await response.json()
    const duration = Date.now() - startTime

    if (!response.ok || !data.success) {
      return {
        success: false,
        duration,
        error: data.error || `HTTP ${response.status}`,
        input
      }
    }

    return {
      success: true,
      duration,
      matchedCount: data.data?.matchedCount || 0,
      tiers: data.data?.tiers || { exact: 0, likely: 0, related: 0 }
    }
  } catch (error) {
    const duration = Date.now() - startTime
    return {
      success: false,
      duration,
      error: error instanceof Error ? error.message : 'Unknown error',
      input
    }
  }
}

async function testBatch(combinations: any[]): Promise<TestResult[]> {
  return Promise.all(
    combinations.map(([bt, r, ec, ar, bsd]) =>
      testSingleCombination(bt, r, ec, ar, bsd)
    )
  )
}

async function testValidationCase(
  description: string,
  input: any,
  expectedError: string
): Promise<{ passed: boolean; description: string; error?: string }> {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: typeof input === 'string' ? input : JSON.stringify(input)
    })

    const data = await response.json()

    if (response.ok || data.success) {
      return {
        passed: false,
        description,
        error: `Expected validation error but got success`
      }
    }

    if (!data.error || !data.error.includes(expectedError)) {
      return {
        passed: false,
        description,
        error: `Expected error containing "${expectedError}" but got "${data.error}"`
      }
    }

    return { passed: true, description }
  } catch (error) {
    return {
      passed: false,
      description,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

async function runValidationTests(): Promise<{
  total: number
  passed: number
  failed: Array<{ description: string; error: string }>
}> {
  console.log('\n=== VALIDATION TESTS ===\n')

  const validBase = {
    businessType: "음식점업",
    region: "서울",
    employeeCount: 2,
    annualRevenue: 50_000_000,
    businessStartDate: "2024-01-15"
  }

  const tests = [
    {
      description: 'Missing businessType',
      input: { ...validBase, businessType: undefined },
      expectedError: '필수 항목'
    },
    {
      description: 'Missing region',
      input: { ...validBase, region: undefined },
      expectedError: '필수 항목'
    },
    {
      description: 'Missing employeeCount',
      input: { ...validBase, employeeCount: undefined },
      expectedError: '필수 항목'
    },
    {
      description: 'Missing annualRevenue',
      input: { ...validBase, annualRevenue: undefined },
      expectedError: '필수 항목'
    },
    {
      description: 'Missing businessStartDate',
      input: { ...validBase, businessStartDate: undefined },
      expectedError: '필수 항목'
    },
    {
      description: 'Invalid businessType',
      input: { ...validBase, businessType: '무효업종' },
      expectedError: '유효하지 않은 업종'
    },
    {
      description: 'Invalid region',
      input: { ...validBase, region: '무효지역' },
      expectedError: '유효하지 않은 지역'
    },
    {
      description: 'Invalid employeeCount',
      input: { ...validBase, employeeCount: 999 },
      expectedError: '유효하지 않은 직원'
    },
    {
      description: 'Invalid annualRevenue',
      input: { ...validBase, annualRevenue: 12345 },
      expectedError: '유효하지 않은 연 매출'
    },
    {
      description: 'Future businessStartDate',
      input: { ...validBase, businessStartDate: '2099-12-31' },
      expectedError: '미래 날짜'
    },
    {
      description: 'Invalid email format',
      input: { ...validBase, email: 'invalid-email' },
      expectedError: '유효하지 않은 이메일'
    },
    {
      description: 'Malformed JSON',
      input: '{ invalid json',
      expectedError: 'JSON'
    },
    {
      description: 'Empty body',
      input: {},
      expectedError: '필수 항목'
    }
  ]

  const results = await Promise.all(
    tests.map(t => testValidationCase(t.description, t.input, t.expectedError))
  )

  const passed = results.filter(r => r.passed).length
  const failed = results.filter(r => !r.passed).map(r => ({
    description: r.description,
    error: r.error || 'Unknown'
  }))

  results.forEach(r => {
    console.log(`  ${r.passed ? '✓' : '✗'} ${r.description}${r.error ? ` - ${r.error}` : ''}`)
  })

  return { total: tests.length, passed, failed }
}

async function main() {
  console.log('=== EXHAUSTIVE DIAGNOSE API TEST ===\n')
  console.log(`Business Types: ${BUSINESS_TYPES.length}`)
  console.log(`Regions: ${REGIONS.length}`)
  console.log(`Employee Options: ${EMPLOYEE_COUNTS.length}`)
  console.log(`Revenue Options: ${ANNUAL_REVENUES.length}`)
  console.log(`Date Variants: ${BUSINESS_START_DATES.length}`)

  const totalCombinations =
    BUSINESS_TYPES.length *
    REGIONS.length *
    EMPLOYEE_COUNTS.length *
    ANNUAL_REVENUES.length *
    BUSINESS_START_DATES.length

  console.log(`\nTotal combinations: ${totalCombinations.toLocaleString()}`)
  console.log(`Batch size: ${BATCH_SIZE}`)
  console.log(`\nGenerating combinations...\n`)

  // Generate all combinations
  const combinations: any[] = []
  for (const bt of BUSINESS_TYPES) {
    for (const r of REGIONS) {
      for (const ec of EMPLOYEE_COUNTS) {
        for (const ar of ANNUAL_REVENUES) {
          for (const bsd of BUSINESS_START_DATES) {
            combinations.push([bt, r, ec, ar, bsd])
          }
        }
      }
    }
  }

  console.log(`Generated ${combinations.length.toLocaleString()} combinations\n`)
  console.log('Starting tests...\n')

  const stats: Stats = {
    total: 0,
    successes: 0,
    failures: 0,
    minDuration: Infinity,
    maxDuration: 0,
    totalDuration: 0,
    minMatched: Infinity,
    maxMatched: 0,
    totalMatched: 0,
    totalExact: 0,
    totalLikely: 0,
    totalRelated: 0,
    failedInputs: []
  }

  const startTime = Date.now()

  // Process in batches
  for (let i = 0; i < combinations.length; i += BATCH_SIZE) {
    const batch = combinations.slice(i, i + BATCH_SIZE)
    const results = await testBatch(batch)

    for (const result of results) {
      stats.total++

      if (result.success) {
        stats.successes++
        stats.totalDuration += result.duration
        stats.minDuration = Math.min(stats.minDuration, result.duration)
        stats.maxDuration = Math.max(stats.maxDuration, result.duration)

        if (result.matchedCount !== undefined) {
          stats.totalMatched += result.matchedCount
          stats.minMatched = Math.min(stats.minMatched, result.matchedCount)
          stats.maxMatched = Math.max(stats.maxMatched, result.matchedCount)
        }

        if (result.tiers) {
          stats.totalExact += result.tiers.exact
          stats.totalLikely += result.tiers.likely
          stats.totalRelated += result.tiers.related
        }
      } else {
        stats.failures++
        if (result.input && result.error) {
          stats.failedInputs.push({ input: result.input, error: result.error })
        }
      }

      // Print progress
      if (stats.total % PROGRESS_INTERVAL === 0) {
        const avgDuration = stats.totalDuration / stats.successes || 0
        console.log(
          `[${stats.total}/${totalCombinations}] ` +
          `${stats.successes} success, ${stats.failures} fail, ` +
          `avg ${Math.round(avgDuration)}ms`
        )
      }
    }
  }

  const totalTime = Date.now() - startTime

  // Run validation tests
  const validationResults = await runValidationTests()

  // Print final summary
  console.log('\n\n=== EXHAUSTIVE TEST RESULTS ===')
  console.log(`\nTotal combinations tested: ${stats.total.toLocaleString()}`)
  console.log(`  Successes: ${stats.successes.toLocaleString()}`)
  console.log(`  Failures: ${stats.failures.toLocaleString()}`)

  console.log('\nResponse times:')
  console.log(`  Min: ${stats.minDuration}ms`)
  console.log(`  Max: ${stats.maxDuration}ms`)
  console.log(`  Avg: ${Math.round(stats.totalDuration / stats.successes)}ms`)

  console.log('\nMatched counts:')
  console.log(`  Min: ${stats.minMatched === Infinity ? 0 : stats.minMatched}`)
  console.log(`  Max: ${stats.maxMatched === 0 ? 0 : stats.maxMatched}`)
  console.log(`  Avg: ${(stats.totalMatched / stats.successes).toFixed(1)}`)

  console.log('\nTier distribution (across all tests):')
  console.log(`  Exact (>=70%): ${stats.totalExact.toLocaleString()} matches`)
  console.log(`  Likely (>=40%): ${stats.totalLikely.toLocaleString()} matches`)
  console.log(`  Related (>=15%): ${stats.totalRelated.toLocaleString()} matches`)

  console.log(`\nValidation tests: ${validationResults.passed}/${validationResults.total} passed`)

  if (validationResults.failed.length > 0) {
    console.log('\nVALIDATION FAILURES:')
    validationResults.failed.forEach(f => {
      console.log(`  - ${f.description}: ${f.error}`)
    })
  }

  if (stats.failedInputs.length > 0) {
    console.log(`\nFAILED INPUTS: (${stats.failedInputs.length})`)
    stats.failedInputs.slice(0, 10).forEach(({ input, error }) => {
      console.log(`  - ${JSON.stringify(input)}: ${error}`)
    })
    if (stats.failedInputs.length > 10) {
      console.log(`  ... and ${stats.failedInputs.length - 10} more`)
    }
  } else {
    console.log('\nFAILED INPUTS: (none)')
  }

  console.log(`\nTotal execution time: ${(totalTime / 1000).toFixed(1)}s`)
  console.log(`Throughput: ${Math.round(stats.total / (totalTime / 1000))} tests/sec`)

  // Exit with error if any test failed
  if (stats.failures > 0 || validationResults.failed.length > 0) {
    process.exit(1)
  }
}

main().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})
