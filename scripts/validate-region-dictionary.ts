/**
 * Region Dictionary Validation Script
 *
 * Validates CITY_TO_REGION mapping against REGION_DISTRICTS,
 * cross-checks with live DB data, and reports completeness/accuracy grades.
 *
 * Usage: npx tsx scripts/validate-region-dictionary.ts
 */

import { createClient } from '@supabase/supabase-js'
import { REGION_DISTRICTS } from '../src/constants/index'
import { REGION_VARIANTS, CTPV_TO_REGION, extractRegionsWithDistricts } from '../src/lib/extraction/region-dictionary'
import * as fs from 'fs'
import * as path from 'path'

// .env.local 수동 파싱 (dotenv 없이)
function loadEnvFile(filePath: string): void {
  if (!fs.existsSync(filePath)) return
  const content = fs.readFileSync(filePath, 'utf-8')
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue
    const key = trimmed.slice(0, eqIdx).trim()
    let value = trimmed.slice(eqIdx + 1).trim()
    // 따옴표 strip
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    if (!process.env[key]) {
      process.env[key] = value
    }
  }
}

loadEnvFile(path.resolve(process.cwd(), '.env.local'))

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
if (!supabaseUrl || !supabaseKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}
const supabase = createClient(supabaseUrl, supabaseKey)

// CTPV_TO_REGION에서 REGION_VARIANTS 값을 제외하여 CITY_TO_REGION 복원
// CTPV_TO_REGION = REGION_VARIANTS의 모든 변형 + CITY_TO_REGION의 모든 항목
const variantValues = new Set<string>()
for (const variants of Object.values(REGION_VARIANTS)) {
  for (const v of variants) variantValues.add(v)
}
const CITY_TO_REGION: Record<string, string> = {}
for (const [key, region] of Object.entries(CTPV_TO_REGION)) {
  if (!variantValues.has(key)) {
    CITY_TO_REGION[key] = region
  }
}

// 여러 도시에 존재하는 모호한 구/군 목록
const AMBIGUOUS_DISTRICTS = new Set([
  '중구', '동구', '서구', '남구', '북구', '강서구',
])

// 시/군/구 패턴 (한글 2~5글자 + 시/구/군)
const REGION_PATTERN = /[가-힣]{1,5}[시구군]/g

interface CheckResult {
  grade: string
  score: number
  summary: string
  details: string[]
}

// ============================================================
// CHECK 1: CITY_TO_REGION completeness vs REGION_DISTRICTS
// ============================================================
function checkCompleteness(): CheckResult {
  const details: string[] = []
  let totalDistricts = 0
  let covered = 0
  let ambiguousExcluded = 0
  const missing: { region: string; district: string }[] = []

  for (const [region, districts] of Object.entries(REGION_DISTRICTS)) {
    for (const district of districts) {
      totalDistricts++

      if (CITY_TO_REGION[district] === region) {
        covered++
      } else if (AMBIGUOUS_DISTRICTS.has(district)) {
        ambiguousExcluded++
        // 확인: 실제로 여러 시도에 걸쳐 있는지
        const matchingRegions = Object.entries(REGION_DISTRICTS)
          .filter(([, ds]) => ds.includes(district))
          .map(([r]) => r)
        if (matchingRegions.length <= 1) {
          details.push(`WARNING: ${district} is marked ambiguous but only exists in ${matchingRegions.join(',')}`)
          missing.push({ region, district })
        }
      } else {
        missing.push({ region, district })
      }
    }
  }

  // CITY_TO_REGION에 있지만 REGION_DISTRICTS에 없는 항목 (단축형 제외)
  const extraEntries: string[] = []
  for (const [city, region] of Object.entries(CITY_TO_REGION)) {
    // 단축형(시 없는 버전)은 OK
    if (!city.endsWith('시') && !city.endsWith('구') && !city.endsWith('군')) continue
    const districts = REGION_DISTRICTS[region]
    if (!districts || !districts.includes(city)) {
      extraEntries.push(`${city} -> ${region} (not in REGION_DISTRICTS)`)
    }
  }

  details.push(`Total districts in REGION_DISTRICTS: ${totalDistricts}`)
  details.push(`Covered in CITY_TO_REGION: ${covered}`)
  details.push(`Intentionally excluded (ambiguous): ${ambiguousExcluded}`)
  details.push(`Missing from CITY_TO_REGION: ${missing.length}`)

  if (missing.length > 0) {
    details.push('')
    details.push('--- Missing entries ---')
    for (const m of missing) {
      details.push(`  ${m.region}: ${m.district}`)
    }
  }

  if (extraEntries.length > 0) {
    details.push('')
    details.push('--- Extra entries in CITY_TO_REGION (not in REGION_DISTRICTS) ---')
    for (const e of extraEntries) {
      details.push(`  ${e}`)
    }
  }

  // 단축형 카운트 (시 빼고 매핑한 것들)
  const shortForms = Object.keys(CITY_TO_REGION).filter(k =>
    !k.endsWith('시') && !k.endsWith('구') && !k.endsWith('군')
  )
  details.push(`\nShorthand entries (e.g. "수원" -> 경기): ${shortForms.length}`)

  // REGION_VARIANTS 커버리지
  const allRegionKeys = Object.keys(REGION_DISTRICTS)
  const variantKeys = Object.keys(REGION_VARIANTS)
  const missingVariants = allRegionKeys.filter(k => !variantKeys.includes(k))
  if (missingVariants.length > 0) {
    details.push(`\nREGION_VARIANTS missing for: ${missingVariants.join(', ')}`)
  } else {
    details.push(`\nREGION_VARIANTS covers all ${allRegionKeys.length} regions`)
  }

  const coverageRate = (covered + ambiguousExcluded) / totalDistricts
  const score = Math.round(coverageRate * 100)
  const grade = score >= 95 ? 'A' : score >= 85 ? 'B' : score >= 70 ? 'C' : 'D'

  return {
    grade,
    score,
    summary: `${covered}/${totalDistricts} covered, ${ambiguousExcluded} ambiguous excluded, ${missing.length} missing`,
    details,
  }
}

// ============================================================
// CHECK 2: DB cross-check - empty target_regions with leaked region names
// ============================================================
async function checkDBLeaks(): Promise<CheckResult> {
  const details: string[] = []
  const BATCH = 1000

  // 전체 active supports 수
  const { count: totalCount } = await supabase
    .from('supports')
    .select('id', { count: 'exact', head: true })
    .eq('is_active', true)
  details.push(`Total active supports: ${totalCount}`)

  // target_regions가 빈 배열이거나 null인 supports 카운트
  // Supabase에서 빈 배열 비교가 까다로우므로 클라이언트에서 필터
  let emptyRegionCount = 0
  let processedCount = 0
  const leakCounts: Record<string, number> = {}
  const ambiguousLeakCounts: Record<string, number> = {}
  let offset = 0

  while (true) {
    const { data, error } = await supabase
      .from('supports')
      .select('id, title, raw_eligibility_text, target_regions')
      .eq('is_active', true)
      .range(offset, offset + BATCH - 1)

    if (error) {
      details.push(`DB error at offset ${offset}: ${error.message}`)
      break
    }
    if (!data || data.length === 0) break

    for (const row of data) {
      processedCount++
      const regions = row.target_regions as string[] | null
      const isEmpty = !regions || regions.length === 0

      if (!isEmpty) continue
      emptyRegionCount++

      // title + raw_eligibility_text에서 지역명 패턴 검색
      const searchText = `${row.title || ''} ${row.raw_eligibility_text || ''}`
      const matches = searchText.match(REGION_PATTERN)
      if (!matches) continue

      for (const m of matches) {
        // CITY_TO_REGION이나 REGION_DISTRICTS에 유효한 지역명인지 확인
        const isValid = CITY_TO_REGION[m] || Object.values(REGION_DISTRICTS).some(ds => ds.includes(m))
        if (!isValid) continue

        if (AMBIGUOUS_DISTRICTS.has(m)) {
          ambiguousLeakCounts[m] = (ambiguousLeakCounts[m] || 0) + 1
        } else {
          leakCounts[m] = (leakCounts[m] || 0) + 1
        }
      }
    }

    offset += BATCH
  }

  details.push(`Processed: ${processedCount}`)
  details.push(`Empty target_regions: ${emptyRegionCount} (${((emptyRegionCount / processedCount) * 100).toFixed(1)}%)`)

  // 상위 20개 leaked region names
  const sortedLeaks = Object.entries(leakCounts).sort((a, b) => b[1] - a[1])
  const sortedAmbiguous = Object.entries(ambiguousLeakCounts).sort((a, b) => b[1] - a[1])

  const totalLeaks = sortedLeaks.reduce((sum, [, c]) => sum + c, 0)
  const totalAmbiguous = sortedAmbiguous.reduce((sum, [, c]) => sum + c, 0)

  details.push(`\nNon-ambiguous leaked region mentions: ${totalLeaks}`)
  details.push(`Ambiguous leaked region mentions: ${totalAmbiguous}`)

  if (sortedLeaks.length > 0) {
    details.push('\n--- Top 20 Non-Ambiguous Leaked Regions ---')
    for (const [name, count] of sortedLeaks.slice(0, 20)) {
      const parentRegion = CITY_TO_REGION[name] || '?'
      details.push(`  ${name} (${parentRegion}): ${count}`)
    }
  }

  if (sortedAmbiguous.length > 0) {
    details.push('\n--- Ambiguous Leaked Regions ---')
    for (const [name, count] of sortedAmbiguous) {
      const cities = Object.entries(REGION_DISTRICTS)
        .filter(([, ds]) => ds.includes(name))
        .map(([r]) => r)
      details.push(`  ${name} (exists in: ${cities.join(',')}): ${count}`)
    }
  }

  // 점수: leaked non-ambiguous가 적을수록 좋음
  // 전체 empty 중 leak이 있는 비율
  const leakRate = totalLeaks / Math.max(emptyRegionCount, 1)
  const score = Math.max(0, Math.round((1 - leakRate) * 100))
  const grade = score >= 95 ? 'A' : score >= 85 ? 'B' : score >= 70 ? 'C' : 'D'

  return {
    grade,
    score,
    summary: `${emptyRegionCount} empty, ${totalLeaks} non-ambiguous leaks, ${totalAmbiguous} ambiguous leaks`,
    details,
  }
}

// ============================================================
// CHECK 3: title 시/군/구 mentions vs target_regions accuracy
// ============================================================
async function checkAccuracy(): Promise<CheckResult> {
  const details: string[] = []
  const SAMPLE_SIZE = 500
  const BATCH = 250

  let checked = 0
  let matches = 0
  let mismatches = 0
  const mismatchExamples: { id: string; title: string; mentioned: string; expected: string; actual: string[] }[] = []
  let offset = 0

  while (checked < SAMPLE_SIZE) {
    const batchSize = Math.min(BATCH, SAMPLE_SIZE - checked + 200) // 여유분
    const { data, error } = await supabase
      .from('supports')
      .select('id, title, target_regions')
      .eq('is_active', true)
      .not('target_regions', 'eq', '{}')
      .range(offset, offset + batchSize - 1)

    if (error) {
      details.push(`DB error at offset ${offset}: ${error.message}`)
      break
    }
    if (!data || data.length === 0) break

    for (const row of data) {
      if (checked >= SAMPLE_SIZE) break

      const title = row.title || ''
      const targetRegions = (row.target_regions || []) as string[]
      if (targetRegions.length === 0) continue

      // 제목에서 시/군/구 찾기
      const titleMatches = title.match(REGION_PATTERN)
      if (!titleMatches) continue

      checked++

      let hasAnyMismatch = false
      for (const mention of titleMatches) {
        // CITY_TO_REGION에서 기대 시도 찾기
        const expectedRegion = CITY_TO_REGION[mention]
        if (!expectedRegion) continue // 모호한 구이거나 CITY_TO_REGION에 없으면 skip

        if (targetRegions.includes(expectedRegion)) {
          matches++
        } else {
          mismatches++
          hasAnyMismatch = true
          if (mismatchExamples.length < 30) {
            mismatchExamples.push({
              id: row.id,
              title,
              mentioned: mention,
              expected: expectedRegion,
              actual: targetRegions,
            })
          }
        }
      }

      if (!hasAnyMismatch && titleMatches.some(m => CITY_TO_REGION[m])) {
        // 제목 내 모든 유효 mention이 target_regions에 일치
      }
    }

    offset += batchSize
  }

  const totalChecks = matches + mismatches
  details.push(`Supports with title region mentions sampled: ${checked}`)
  details.push(`Region mention checks: ${totalChecks}`)
  details.push(`Matches: ${matches}`)
  details.push(`Mismatches: ${mismatches}`)

  if (mismatchExamples.length > 0) {
    details.push('\n--- Mismatch Examples ---')
    for (const ex of mismatchExamples) {
      details.push(`  [${ex.id.slice(0, 8)}] "${ex.title.slice(0, 60)}"`)
      details.push(`    Title mentions: ${ex.mentioned} -> expected ${ex.expected}, actual target_regions: [${ex.actual.join(',')}]`)
    }
  }

  const accuracy = totalChecks > 0 ? matches / totalChecks : 1
  const score = Math.round(accuracy * 100)
  const grade = score >= 95 ? 'A' : score >= 85 ? 'B' : score >= 70 ? 'C' : 'D'

  return {
    grade,
    score,
    summary: `${matches}/${totalChecks} accurate (${score}%)`,
    details,
  }
}

// ============================================================
// CHECK 4: Sub-region validation (target_sub_regions vs target_regions)
// ============================================================
async function checkSubRegions(): Promise<CheckResult> {
  const details: string[] = []
  const BATCH = 1000

  let totalWithSubRegions = 0
  let validPairs = 0
  let orphanSubRegions = 0
  let invalidSubRegions = 0
  const orphanExamples: { id: string; subRegion: string; targetRegions: string[] }[] = []
  const invalidExamples: { id: string; subRegion: string; parentRegion: string; validDistricts: string[] }[] = []
  let offset = 0

  while (true) {
    const { data, error } = await supabase
      .from('supports')
      .select('id, title, target_regions, target_sub_regions')
      .eq('is_active', true)
      .not('target_sub_regions', 'eq', '{}')
      .range(offset, offset + BATCH - 1)

    if (error) {
      details.push(`DB error at offset ${offset}: ${error.message}`)
      break
    }
    if (!data || data.length === 0) break

    for (const row of data) {
      const subRegions = (row.target_sub_regions || []) as string[]
      const targetRegions = (row.target_regions || []) as string[]
      if (subRegions.length === 0) continue

      totalWithSubRegions++

      for (const sub of subRegions) {
        // sub-region의 부모 시도 찾기
        const expectedParent = CITY_TO_REGION[sub]

        if (!expectedParent) {
          // CITY_TO_REGION에 없는 sub-region -> REGION_DISTRICTS에서 직접 찾기
          let found = false
          for (const [region, districts] of Object.entries(REGION_DISTRICTS)) {
            if (districts.includes(sub)) {
              if (targetRegions.includes(region)) {
                validPairs++
                found = true
              } else {
                orphanSubRegions++
                if (orphanExamples.length < 20) {
                  orphanExamples.push({ id: row.id, subRegion: sub, targetRegions })
                }
                found = true
              }
              break
            }
          }
          if (!found) {
            invalidSubRegions++
            if (invalidExamples.length < 20) {
              invalidExamples.push({
                id: row.id,
                subRegion: sub,
                parentRegion: '(unknown)',
                validDistricts: [],
              })
            }
          }
          continue
        }

        if (targetRegions.includes(expectedParent)) {
          // sub-region이 해당 시도의 유효 구/군인지 확인
          const validDistricts = REGION_DISTRICTS[expectedParent] || []
          if (validDistricts.includes(sub)) {
            validPairs++
          } else {
            // CITY_TO_REGION에는 있지만 REGION_DISTRICTS에는 없는 항목 (단축형 등)
            // 단축형은 유효로 처리
            if (sub.endsWith('시') || sub.endsWith('구') || sub.endsWith('군')) {
              invalidSubRegions++
              if (invalidExamples.length < 20) {
                invalidExamples.push({
                  id: row.id,
                  subRegion: sub,
                  parentRegion: expectedParent,
                  validDistricts: validDistricts.slice(0, 5),
                })
              }
            } else {
              validPairs++ // 단축형 (e.g. "수원")
            }
          }
        } else {
          orphanSubRegions++
          if (orphanExamples.length < 20) {
            orphanExamples.push({ id: row.id, subRegion: sub, targetRegions })
          }
        }
      }
    }

    offset += BATCH
  }

  details.push(`Supports with target_sub_regions: ${totalWithSubRegions}`)
  details.push(`Valid sub-region -> region pairs: ${validPairs}`)
  details.push(`Orphan sub-regions (no matching parent): ${orphanSubRegions}`)
  details.push(`Invalid sub-regions (not in REGION_DISTRICTS): ${invalidSubRegions}`)

  if (orphanExamples.length > 0) {
    details.push('\n--- Orphan Sub-Region Examples ---')
    for (const ex of orphanExamples) {
      details.push(`  [${ex.id.slice(0, 8)}] sub: ${ex.subRegion}, target_regions: [${ex.targetRegions.join(',')}]`)
    }
  }

  if (invalidExamples.length > 0) {
    details.push('\n--- Invalid Sub-Region Examples ---')
    for (const ex of invalidExamples) {
      details.push(`  [${ex.id.slice(0, 8)}] sub: ${ex.subRegion}, parent: ${ex.parentRegion}`)
    }
  }

  const totalChecked = validPairs + orphanSubRegions + invalidSubRegions
  const validRate = totalChecked > 0 ? validPairs / totalChecked : 1
  const score = Math.round(validRate * 100)
  const grade = score >= 95 ? 'A' : score >= 85 ? 'B' : score >= 70 ? 'C' : 'D'

  return {
    grade,
    score,
    summary: `${validPairs}/${totalChecked} valid (${score}%), ${orphanSubRegions} orphans, ${invalidSubRegions} invalid`,
    details,
  }
}

// ============================================================
// MAIN
// ============================================================
async function main() {
  console.log('='.repeat(70))
  console.log('  Region Dictionary Validation Report')
  console.log('  ' + new Date().toISOString())
  console.log('='.repeat(70))

  // Check 1: Completeness
  console.log('\n' + '='.repeat(70))
  console.log('  CHECK 1: CITY_TO_REGION Completeness vs REGION_DISTRICTS')
  console.log('='.repeat(70))
  const c1 = checkCompleteness()
  for (const d of c1.details) console.log(d)
  console.log(`\n  GRADE: ${c1.grade} (${c1.score}%) - ${c1.summary}`)

  // Check 2: DB leaks
  console.log('\n' + '='.repeat(70))
  console.log('  CHECK 2: DB Cross-Check - Empty Regions with Leaked Names')
  console.log('='.repeat(70))
  const c2 = await checkDBLeaks()
  for (const d of c2.details) console.log(d)
  console.log(`\n  GRADE: ${c2.grade} (${c2.score}%) - ${c2.summary}`)

  // Check 3: Title accuracy
  console.log('\n' + '='.repeat(70))
  console.log('  CHECK 3: Title Region Accuracy (sample 500)')
  console.log('='.repeat(70))
  const c3 = await checkAccuracy()
  for (const d of c3.details) console.log(d)
  console.log(`\n  GRADE: ${c3.grade} (${c3.score}%) - ${c3.summary}`)

  // Check 4: Sub-region validation
  console.log('\n' + '='.repeat(70))
  console.log('  CHECK 4: Sub-Region Validation')
  console.log('='.repeat(70))
  const c4 = await checkSubRegions()
  for (const d of c4.details) console.log(d)
  console.log(`\n  GRADE: ${c4.grade} (${c4.score}%) - ${c4.summary}`)

  // Summary
  console.log('\n' + '='.repeat(70))
  console.log('  OVERALL SUMMARY')
  console.log('='.repeat(70))
  const checks = [
    { name: 'Completeness', ...c1 },
    { name: 'DB Leak Detection', ...c2 },
    { name: 'Title Accuracy', ...c3 },
    { name: 'Sub-Region Validity', ...c4 },
  ]

  const avgScore = Math.round(checks.reduce((s, c) => s + c.score, 0) / checks.length)
  const overallGrade = avgScore >= 95 ? 'A' : avgScore >= 85 ? 'B' : avgScore >= 70 ? 'C' : 'D'

  for (const c of checks) {
    console.log(`  ${c.grade} (${c.score}%) | ${c.name}: ${c.summary}`)
  }
  console.log(`\n  OVERALL: ${overallGrade} (${avgScore}%)`)
  console.log('='.repeat(70))
}

main().catch(e => {
  console.error('Fatal error:', e)
  process.exit(1)
})
