/**
 * 지역 추출 전수조사 (Comprehensive Region Audit)
 *
 * 1) 한글 경계 체크 유닛 테스트 (복합어 부분매칭 방지)
 * 2) 전체 DB 레코드 재추출 vs 현재 데이터 비교
 * 3) 17개 시도별 매칭 시뮬레이션
 * 4) 최종 리포트
 */
import { readFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'

const env = readFileSync('.env.local', 'utf-8')
for (const l of env.split('\n')) {
  const t = l.trim()
  if (!t || t.startsWith('#')) continue
  const e = t.indexOf('=')
  if (e === -1) continue
  const k = t.slice(0, e).trim()
  const v = t.slice(e + 1).trim()
  if (!process.env[k]) process.env[k] = v
}

import { extractRegions, REGION_VARIANTS } from '../src/lib/extraction/region-dictionary'
import { extractEligibility } from '../src/lib/extraction/index'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

// ═══════════════════════════════════════════
// PHASE 1: 한글 경계 체크 유닛 테스트
// ═══════════════════════════════════════════
function runBoundaryTests() {
  console.log('═══════════════════════════════════════════')
  console.log('PHASE 1: 한글 경계 체크 유닛 테스트')
  console.log('═══════════════════════════════════════════')

  const testCases: Array<{ text: string; expected: string[]; description: string }> = [
    // 복합어 부분매칭 방지 (FALSE POSITIVE 방지)
    { text: '해운대구 청소년 장학금', expected: ['부산'], description: '"대구" in "해운대구" → 부산만' },
    { text: '달서구 결혼축하금', expected: ['대구'], description: '"서구" in "달서구" → 대구만' },
    { text: '강서구 전세피해지원금', expected: [], description: '"서구" in "강서구" → 비어있음 (모호)' },
    { text: '영주귀국 사할린한인', expected: [], description: '"영주" in "영주귀국" → 비어있음 (복합어)' },
    { text: '경기침체 극복 지원', expected: [], description: '"경기" in "경기침체" → 비어있음 (복합어)' },
    { text: '대전환 시대', expected: [], description: '"대전" in "대전환" → 비어있음 (복합어)' },
    { text: '울산업 진흥', expected: [], description: '"울산" in "울산업" → 비어있음 (복합어)' },

    // 정상 매칭 (TRUE POSITIVE 유지)
    { text: '서울특별시 청년수당', expected: ['서울'], description: '서울특별시 → 서울' },
    { text: '서울 청년수당', expected: ['서울'], description: '서울 (단독) → 서울' },
    { text: '부산광역시 해운대구 지원', expected: ['부산'], description: '부산광역시 해운대구 → 부산' },
    { text: '대구광역시 달서구 지원', expected: ['대구'], description: '대구광역시 달서구 → 대구' },
    { text: '인천광역시 미추홀구', expected: ['인천'], description: '인천광역시 미추홀구 → 인천' },
    { text: '경기도 수원시 지원', expected: ['경기'], description: '경기도 수원시 → 경기' },
    { text: '강원특별자치도 춘천시', expected: ['강원'], description: '강원도 춘천시 → 강원' },
    { text: '제주특별자치도 지원', expected: ['제주'], description: '제주도 → 제주' },
    { text: '전국', expected: [], description: '전국 → 빈 배열 (모든 지역)' },
    { text: '지역 제한 없음', expected: [], description: '제한 없음 → 빈 배열' },

    // 조사/접미사 구분 (한글 조사 뒤에 올 때)
    { text: '서울에서 진행하는 사업', expected: ['서울'], description: '"서울에서" → 서울 (조사)' },
    { text: '부산으로 이동', expected: ['부산'], description: '"부산으로" → 부산 (조사)' },
    { text: '인천의 주민', expected: ['인천'], description: '"인천의" → 인천 (조사)' },

    // 다중 지역
    { text: '서울특별시 및 경기도 거주자', expected: ['서울', '경기'], description: '서울+경기 다중 매칭' },
    { text: '부산광역시·대구광역시', expected: ['부산', '대구'], description: '부산+대구 다중 매칭' },

    // 시/군/구 매핑
    { text: '수원시 거주 소상공인', expected: ['경기'], description: '수원시 → 경기' },
    { text: '마포구 주민 대상', expected: ['서울'], description: '마포구 → 서울' },
    { text: '해운대구 출산지원금', expected: ['부산'], description: '해운대구 → 부산' },
    { text: '수성구 청년 지원', expected: ['대구'], description: '수성구 → 대구' },
    { text: '미추홀구 생활안정', expected: ['인천'], description: '미추홀구 → 인천' },

    // 광주시 충돌 해결
    { text: '광주광역시 지원', expected: ['광주'], description: '광주광역시 → 광주 (광역시)' },
    { text: '광주시 거주자', expected: ['경기'], description: '광주시 → 경기 (경기 광주시)' },
    { text: '광주 지역 복지', expected: ['광주'], description: '광주 (단독) → 광주 (광역시)' },

    // Edge cases: 모호한 구/군 (제거됨)
    { text: '중구 주민', expected: [], description: '중구 → 비어있음 (6개 도시 존재)' },
    { text: '남구 거주자', expected: [], description: '남구 → 비어있음 (4+ 도시 존재)' },
    { text: '북구 지원', expected: [], description: '북구 → 비어있음 (4+ 도시 존재)' },
    { text: '서구 청년', expected: [], description: '서구 → 비어있음 (5개 도시 존재)' },
  ]

  let passed = 0
  let failed = 0
  const failures: string[] = []

  for (const tc of testCases) {
    const result = extractRegions(tc.text)
    const resultSorted = [...result].sort()
    const expectedSorted = [...tc.expected].sort()
    const isPass = JSON.stringify(resultSorted) === JSON.stringify(expectedSorted)

    if (isPass) {
      passed++
    } else {
      failed++
      failures.push(`  FAIL: ${tc.description}\n    input: "${tc.text}"\n    expected: ${JSON.stringify(tc.expected)}\n    got: ${JSON.stringify(result)}`)
    }
  }

  console.log(`\nResults: ${passed}/${testCases.length} passed, ${failed} failed`)
  if (failures.length > 0) {
    console.log('\nFailures:')
    for (const f of failures) console.log(f)
  }

  return { passed, failed, total: testCases.length }
}

// ═══════════════════════════════════════════
// PHASE 2: 전체 DB 레코드 전수조사
// ═══════════════════════════════════════════
async function runFullDbAudit() {
  console.log('\n═══════════════════════════════════════════')
  console.log('PHASE 2: 전체 DB 레코드 전수조사 (6364건)')
  console.log('═══════════════════════════════════════════')

  const PAGE_SIZE = 1000
  const allRows: Array<{
    id: string; title: string; raw_eligibility_text: string | null
    raw_preference_text: string | null; raw_exclusion_text: string | null
    target_regions: string[] | null
  }> = []
  let from = 0

  while (true) {
    const { data, error } = await supabase
      .from('supports')
      .select('id, title, raw_eligibility_text, raw_preference_text, raw_exclusion_text, target_regions')
      .eq('is_active', true)
      .range(from, from + PAGE_SIZE - 1)
    if (error) throw error
    if (!data || data.length === 0) break
    allRows.push(...data)
    if (data.length < PAGE_SIZE) break
    from += PAGE_SIZE
  }

  console.log(`Loaded ${allRows.length} records`)

  let mismatchCount = 0
  let multiRegionCount = 0
  let noRegionCount = 0
  let singleRegionCount = 0
  const mismatches: Array<{ title: string; dbRegions: string[]; extractedRegions: string[] }> = []
  const regionDist: Record<string, number> = {}

  for (const row of allRows) {
    const texts = [row.raw_eligibility_text, row.raw_preference_text, row.raw_exclusion_text].filter(Boolean) as string[]
    const result = extractEligibility(texts, row.title)
    const dbRegions = row.target_regions || []
    const extracted = result.regions

    // DB vs 추출 비교
    const dbSorted = JSON.stringify([...dbRegions].sort())
    const exSorted = JSON.stringify([...extracted].sort())
    if (dbSorted !== exSorted) {
      mismatchCount++
      if (mismatches.length < 10) {
        mismatches.push({ title: row.title, dbRegions, extractedRegions: extracted })
      }
    }

    // 통계
    if (dbRegions.length === 0) noRegionCount++
    else if (dbRegions.length === 1) singleRegionCount++
    else multiRegionCount++

    for (const r of dbRegions) {
      regionDist[r] = (regionDist[r] || 0) + 1
    }
  }

  console.log(`\nDB vs 재추출 불일치: ${mismatchCount}건 (${(mismatchCount / allRows.length * 100).toFixed(2)}%)`)
  console.log(`지역 분포: 없음=${noRegionCount}, 1개=${singleRegionCount}, 2개+=${multiRegionCount}`)

  if (mismatches.length > 0) {
    console.log(`\n불일치 샘플 (최대 10건):`)
    for (const m of mismatches) {
      console.log(`  "${m.title}" DB=${JSON.stringify(m.dbRegions)} vs 추출=${JSON.stringify(m.extractedRegions)}`)
    }
  }

  console.log('\n지역별 레코드 수:')
  for (const [r, c] of Object.entries(regionDist).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${r}: ${c}`)
  }

  return { total: allRows.length, mismatchCount, multiRegionCount, noRegionCount }
}

// ═══════════════════════════════════════════
// PHASE 3: 17개 시도별 매칭 시뮬레이션
// ═══════════════════════════════════════════
async function runRegionMatchSimulation() {
  console.log('\n═══════════════════════════════════════════')
  console.log('PHASE 3: 17개 시도별 매칭 시뮬레이션')
  console.log('═══════════════════════════════════════════')

  const REGIONS = Object.keys(REGION_VARIANTS)

  for (const targetRegion of REGIONS) {
    // 해당 지역 전용 레코드 (target_regions에 targetRegion만 포함)
    const { data, error } = await supabase
      .from('supports')
      .select('id, title, target_regions')
      .eq('is_active', true)
      .contains('target_regions', [targetRegion])
      .limit(500)

    if (error) {
      console.log(`  ${targetRegion}: ERROR - ${error.message}`)
      continue
    }

    // 이 중 다른 지역 레코드가 섞여 있는지 확인
    let correctCount = 0
    let wrongRegionCount = 0
    const wrongExamples: string[] = []

    for (const r of data || []) {
      const regions = r.target_regions || []
      if (regions.length === 1 && regions[0] === targetRegion) {
        correctCount++
      } else if (regions.length > 1) {
        // 다중 지역은 의심 케이스
        wrongRegionCount++
        if (wrongExamples.length < 3) {
          wrongExamples.push(`    "${r.title}" → ${JSON.stringify(regions)}`)
        }
      } else {
        correctCount++
      }
    }

    const total = (data || []).length
    console.log(`  ${targetRegion}: ${total}건 (단일=${correctCount}, 다중=${wrongRegionCount})`)
    for (const ex of wrongExamples) console.log(ex)
  }
}

// ═══════════════════════════════════════════
// PHASE 4: 크로스 오염 검사
// ═══════════════════════════════════════════
async function runCrossContaminationCheck() {
  console.log('\n═══════════════════════════════════════════')
  console.log('PHASE 4: 크로스 오염 검사 (지역 A인데 지역 B에 노출)')
  console.log('═══════════════════════════════════════════')

  // 사용자가 "인천"으로 검색했을 때 인천이 아닌 레코드가 나오는 케이스 확인
  // 매칭 알고리즘: target_regions가 비어있으면 모든 지역 매칭, 있으면 해당 지역만 매칭

  const REGIONS = Object.keys(REGION_VARIANTS)
  let totalCross = 0

  for (const userRegion of REGIONS) {
    // 이 지역으로 검색했을 때 보이는 레코드:
    // 1) target_regions = [] (전국 대상)
    // 2) target_regions에 userRegion 포함

    // 크로스 오염 = target_regions에 userRegion이 포함되어 있지만 실제로는 다른 지역 전용
    // → retag 후에는 발생하지 않아야 함

    const { data } = await supabase
      .from('supports')
      .select('id, title, target_regions')
      .eq('is_active', true)
      .contains('target_regions', [userRegion])
      .limit(500)

    let crossCount = 0
    for (const r of data || []) {
      const regions = r.target_regions || []
      // title에 다른 지역의 시/군/구가 포함된 경우 → 잠재적 크로스 오염
      const titleRegions = extractRegions(r.title)
      if (titleRegions.length > 0 && !titleRegions.includes(userRegion)) {
        crossCount++
        if (crossCount <= 2) {
          console.log(`  [${userRegion}] 의심: "${r.title}" → title에서 추출=${JSON.stringify(titleRegions)}, DB=${JSON.stringify(regions)}`)
        }
      }
    }

    if (crossCount > 0) {
      totalCross += crossCount
    }
  }

  console.log(`\n크로스 오염 의심 총계: ${totalCross}건`)
  return totalCross
}

// ═══════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════
async function main() {
  console.log('🔍 지역 추출 전수조사 시작\n')

  const phase1 = runBoundaryTests()

  const phase2 = await runFullDbAudit()

  await runRegionMatchSimulation()

  const crossCount = await runCrossContaminationCheck()

  // 최종 리포트
  console.log('\n═══════════════════════════════════════════')
  console.log('최종 리포트')
  console.log('═══════════════════════════════════════════')
  console.log(`유닛 테스트: ${phase1.passed}/${phase1.total} passed`)
  console.log(`DB 불일치: ${phase2.mismatchCount}/${phase2.total}건 (${(phase2.mismatchCount / phase2.total * 100).toFixed(2)}%)`)
  console.log(`다중 지역: ${phase2.multiRegionCount}건`)
  console.log(`크로스 오염: ${crossCount}건`)
  console.log(`\n등급: ${phase1.failed === 0 && phase2.mismatchCount === 0 && crossCount === 0 ? 'A (완벽)' : phase1.failed === 0 && crossCount <= 5 ? 'B (양호)' : 'C (개선필요)'}`)
}

main().catch(console.error)
