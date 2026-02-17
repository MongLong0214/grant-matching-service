/**
 * 개인 트랙 1000케이스 매칭 전수조사
 * - 17개 시도 x 6개 연령대 기본 조합에서 나머지 차원 순환하여 1000케이스 생성
 * - matchSupportsV4 실행 후 PASS/FAIL/WARNING 판정
 * - 지역 정확도 심층 검증
 *
 * 실행: npx tsx scripts/audit-personal-1000.ts
 */

import { readFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'
import { mapSupportRows } from '../src/lib/supabase/mappers'
import { matchSupportsV4 } from '../src/lib/matching-v4/index'
import type { Support, UserInput, PersonalFormData } from '../src/types/index'

// .env.local 로드
const envContent = readFileSync('.env.local', 'utf-8')
for (const line of envContent.split('\n')) {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#')) continue
  const eqIdx = trimmed.indexOf('=')
  if (eqIdx === -1) continue
  const key = trimmed.slice(0, eqIdx).trim()
  const val = trimmed.slice(eqIdx + 1).trim()
  if (!process.env[key]) process.env[key] = val
}

// --- 차원 값 정의 ---
const REGIONS = [
  '서울', '부산', '대구', '인천', '광주', '대전', '울산', '세종',
  '경기', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주',
]
const AGE_GROUPS = ['10대', '20대', '30대', '40대', '50대', '60대이상']
const GENDERS = ['남성', '여성']
const HOUSEHOLD_TYPES = ['1인', '신혼부부', '영유아', '다자녀', '한부모', '일반']
const INCOME_LEVELS = ['기초생활', '차상위', '중위50이하', '중위100이하', '중위100초과']
const EMPLOYMENT_STATUSES = ['재직자', '구직자', '학생', '자영업', '무직', '은퇴']
const INTEREST_COMBOS: string[][] = [
  ['주거'], ['육아'], ['교육'], ['취업'], ['건강'], ['생활'], ['문화'],
  ['주거', '육아'], ['교육', '취업', '건강'],
]

// --- 1000개 케이스 생성 ---
interface TestCase {
  index: number
  region: string
  ageGroup: string
  gender: string
  householdType: string
  incomeLevel: string
  employmentStatus: string
  interestCategories: string[]
}

function generateCases(target: number): TestCase[] {
  const cases: TestCase[] = []
  let idx = 0
  // 기본 루프: region(17) x ageGroup(6) = 102 조합을 기반으로 나머지 순환
  let genderIdx = 0
  let householdIdx = 0
  let incomeIdx = 0
  let employmentIdx = 0
  let interestIdx = 0

  while (cases.length < target) {
    for (const region of REGIONS) {
      for (const ageGroup of AGE_GROUPS) {
        if (cases.length >= target) break
        cases.push({
          index: idx++,
          region,
          ageGroup,
          gender: GENDERS[genderIdx % GENDERS.length],
          householdType: HOUSEHOLD_TYPES[householdIdx % HOUSEHOLD_TYPES.length],
          incomeLevel: INCOME_LEVELS[incomeIdx % INCOME_LEVELS.length],
          employmentStatus: EMPLOYMENT_STATUSES[employmentIdx % EMPLOYMENT_STATUSES.length],
          interestCategories: INTEREST_COMBOS[interestIdx % INTEREST_COMBOS.length],
        })
        // 각 차원을 다른 속도로 순환하여 다양한 조합 보장
        genderIdx++
        if (genderIdx % 2 === 0) householdIdx++
        if (genderIdx % 3 === 0) incomeIdx++
        if (genderIdx % 4 === 0) employmentIdx++
        if (genderIdx % 5 === 0) interestIdx++
      }
      if (cases.length >= target) break
    }
  }
  return cases.slice(0, target)
}

// --- 결과 타입 ---
type Verdict = 'PASS' | 'FAIL' | 'WARNING'
interface CaseResult {
  case_: TestCase
  totalCount: number
  tailoredCount: number
  recommendedCount: number
  exploratoryCount: number
  knockedOut: number
  verdict: Verdict
  reasons: string[]
  regionMismatchCount: number
}

// --- Supabase에서 active supports 로드 (1000행 청크) ---
async function loadActiveSupports(): Promise<Support[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const supabase = createClient(supabaseUrl, supabaseKey)

  const allRows: unknown[] = []
  let from = 0
  const chunkSize = 1000

  while (true) {
    const { data, error } = await supabase
      .from('supports')
      .select('*')
      .eq('is_active', true)
      .range(from, from + chunkSize - 1)

    if (error) throw new Error(`Supabase error: ${error.message}`)
    if (!data || data.length === 0) break
    allRows.push(...data)
    if (data.length < chunkSize) break
    from += chunkSize
  }

  return mapSupportRows(allRows as Parameters<typeof mapSupportRows>[0])
}

// --- 지역 정확도 검증 ---
function checkRegionAccuracy(
  tailoredResults: { support: Support }[],
  userRegion: string,
): { mismatchCount: number; details: string[] } {
  let mismatchCount = 0
  const details: string[] = []

  for (const { support } of tailoredResults) {
    const regions = support.targetRegions
    if (!regions || regions.length === 0) continue // 전국 → OK
    if (regions.includes(userRegion)) continue // 포함 → OK
    // 지역 명시인데 유저 미포함 → FAIL
    mismatchCount++
    details.push(`  [지역오매칭] "${support.title}" (${support.id}) regions=[${regions.join(',')}] vs user=${userRegion}`)
  }

  return { mismatchCount, details }
}

// --- 케이스별 판정 ---
function evaluateCase(
  case_: TestCase,
  supports: Support[],
): CaseResult {
  const input: UserInput = {
    userType: 'personal',
    ageGroup: case_.ageGroup,
    gender: case_.gender,
    region: case_.region,
    householdType: case_.householdType,
    incomeLevel: case_.incomeLevel,
    employmentStatus: case_.employmentStatus,
    interestCategories: case_.interestCategories,
  }

  const result = matchSupportsV4(supports, input)
  const reasons: string[] = []
  let verdict: Verdict = 'PASS'

  // FAIL 조건 1: 추천 결과 없음
  if (result.totalCount === 0) {
    verdict = 'FAIL'
    reasons.push(`total=0 (추천 결과 없음, knocked=${result.knockedOut}, filtered=${result.filteredByServiceType})`)
  }

  // 지역 정확도 심층 검증
  const regionCheck = checkRegionAccuracy(result.tailored, case_.region)
  if (regionCheck.mismatchCount > 0) {
    verdict = 'FAIL'
    reasons.push(`지역 오매칭 ${regionCheck.mismatchCount}건`)
    reasons.push(...regionCheck.details)
  }

  // recommended에서도 지역 오매칭 체크 (심각도 낮지만 기록)
  const recRegionCheck = checkRegionAccuracy(result.recommended, case_.region)

  // WARNING 조건
  if (verdict !== 'FAIL') {
    if (result.tailored.length < 3) {
      if (verdict !== 'FAIL') verdict = 'WARNING'
      reasons.push(`tailored=${result.tailored.length} (3개 미만)`)
    }
    if (result.totalCount < 10) {
      if (verdict !== 'FAIL') verdict = 'WARNING'
      reasons.push(`total=${result.totalCount} (10개 미만)`)
    }
    // 해당 지역의 support가 있는데 0건 매칭인 경우
    const regionSupports = supports.filter(s =>
      s.targetRegions && s.targetRegions.length > 0 && s.targetRegions.includes(case_.region)
    )
    if (regionSupports.length > 0 && result.tailored.length === 0 && result.recommended.length === 0) {
      if (verdict !== 'FAIL') verdict = 'WARNING'
      reasons.push(`지역 support ${regionSupports.length}건 있는데 tailored+recommended=0`)
    }
  }

  return {
    case_,
    totalCount: result.totalCount,
    tailoredCount: result.tailored.length,
    recommendedCount: result.recommended.length,
    exploratoryCount: result.exploratory.length,
    knockedOut: result.knockedOut,
    verdict,
    reasons,
    regionMismatchCount: regionCheck.mismatchCount + recRegionCheck.mismatchCount,
  }
}

// --- 통계 계산 헬퍼 ---
function avg(nums: number[]): string {
  if (nums.length === 0) return '0'
  return (nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(1)
}

// --- 메인 실행 ---
async function main() {
  console.log('=== 개인 트랙 1000케이스 전수조사 ===\n')

  // 1. Supports 로드
  console.log('Supabase에서 active supports 로드 중...')
  const supports = await loadActiveSupports()
  console.log(`Total supports loaded: ${supports.length}\n`)

  if (supports.length === 0) {
    console.error('ERROR: supports 테이블이 비어있습니다. sync를 먼저 실행하세요.')
    process.exit(1)
  }

  // 2. 케이스 생성
  const cases = generateCases(1000)
  console.log(`Cases generated: ${cases.length}`)

  // 차원별 분포 확인
  const regionDist = new Map<string, number>()
  const ageDist = new Map<string, number>()
  for (const c of cases) {
    regionDist.set(c.region, (regionDist.get(c.region) ?? 0) + 1)
    ageDist.set(c.ageGroup, (ageDist.get(c.ageGroup) ?? 0) + 1)
  }
  console.log(`Region distribution: ${[...regionDist.entries()].map(([k, v]) => `${k}:${v}`).join(', ')}`)
  console.log(`Age distribution: ${[...ageDist.entries()].map(([k, v]) => `${k}:${v}`).join(', ')}\n`)

  // 3. 매칭 실행
  console.log('매칭 실행 중...')
  const startTime = Date.now()
  const results: CaseResult[] = []
  for (let i = 0; i < cases.length; i++) {
    results.push(evaluateCase(cases[i], supports))
    if ((i + 1) % 200 === 0) {
      console.log(`  ${i + 1}/${cases.length} 완료...`)
    }
  }
  const elapsed = Date.now() - startTime
  console.log(`매칭 완료: ${elapsed}ms (${(elapsed / cases.length).toFixed(1)}ms/case)\n`)

  // 4. 집계
  const passResults = results.filter(r => r.verdict === 'PASS')
  const failResults = results.filter(r => r.verdict === 'FAIL')
  const warnResults = results.filter(r => r.verdict === 'WARNING')

  console.log(`Cases tested: ${results.length}`)
  console.log(`PASS: ${passResults.length}`)
  console.log(`FAIL: ${failResults.length}`)
  console.log(`WARNING: ${warnResults.length}`)

  // 5. FAIL 상세
  if (failResults.length > 0) {
    console.log('\n--- FAIL 상세 ---')
    for (const r of failResults.slice(0, 50)) {
      const c = r.case_
      console.log(`Case #${c.index}: ${c.region}/${c.ageGroup}/${c.gender}/${c.householdType}/${c.incomeLevel}/${c.employmentStatus}/[${c.interestCategories.join(',')}]`)
      console.log(`  -> total=${r.totalCount}, tailored=${r.tailoredCount}, recommended=${r.recommendedCount}, exploratory=${r.exploratoryCount}, knocked=${r.knockedOut}`)
      for (const reason of r.reasons) {
        console.log(`  <- ${reason}`)
      }
    }
    if (failResults.length > 50) {
      console.log(`  ... 외 ${failResults.length - 50}건`)
    }
  }

  // 6. WARNING 상세
  if (warnResults.length > 0) {
    console.log('\n--- WARNING 상세 ---')
    for (const r of warnResults.slice(0, 30)) {
      const c = r.case_
      console.log(`Case #${c.index}: ${c.region}/${c.ageGroup}/${c.gender}/${c.householdType}/${c.incomeLevel}/${c.employmentStatus}/[${c.interestCategories.join(',')}]`)
      console.log(`  -> total=${r.totalCount}, tailored=${r.tailoredCount}, recommended=${r.recommendedCount}, exploratory=${r.exploratoryCount}`)
      for (const reason of r.reasons) {
        console.log(`  <- ${reason}`)
      }
    }
    if (warnResults.length > 30) {
      console.log(`  ... 외 ${warnResults.length - 30}건`)
    }
  }

  // 7. 지역별 통계
  console.log('\n--- 지역별 통계 ---')
  for (const region of REGIONS) {
    const regionResults = results.filter(r => r.case_.region === region)
    const totals = regionResults.map(r => r.totalCount)
    const tailoreds = regionResults.map(r => r.tailoredCount)
    const fails = regionResults.filter(r => r.verdict === 'FAIL').length
    const warns = regionResults.filter(r => r.verdict === 'WARNING').length
    const regionMismatches = regionResults.reduce((sum, r) => sum + r.regionMismatchCount, 0)
    console.log(`${region.padEnd(4)}: cases=${regionResults.length}, avg_total=${avg(totals)}, avg_tailored=${avg(tailoreds)}, fail=${fails}, warn=${warns}, region_mismatch=${regionMismatches}`)
  }

  // 8. 차원별 통계
  console.log('\n--- 연령별 통계 ---')
  for (const age of AGE_GROUPS) {
    const ageResults = results.filter(r => r.case_.ageGroup === age)
    const totals = ageResults.map(r => r.totalCount)
    const tailoreds = ageResults.map(r => r.tailoredCount)
    const fails = ageResults.filter(r => r.verdict === 'FAIL').length
    const warns = ageResults.filter(r => r.verdict === 'WARNING').length
    console.log(`${age.padEnd(8)}: cases=${ageResults.length}, avg_total=${avg(totals)}, avg_tailored=${avg(tailoreds)}, fail=${fails}, warn=${warns}`)
  }

  console.log('\n--- 소득별 통계 ---')
  for (const income of INCOME_LEVELS) {
    const incomeResults = results.filter(r => r.case_.incomeLevel === income)
    const totals = incomeResults.map(r => r.totalCount)
    const tailoreds = incomeResults.map(r => r.tailoredCount)
    const fails = incomeResults.filter(r => r.verdict === 'FAIL').length
    const warns = incomeResults.filter(r => r.verdict === 'WARNING').length
    console.log(`${income.padEnd(10)}: cases=${incomeResults.length}, avg_total=${avg(totals)}, avg_tailored=${avg(tailoreds)}, fail=${fails}, warn=${warns}`)
  }

  console.log('\n--- 취업상태별 통계 ---')
  for (const emp of EMPLOYMENT_STATUSES) {
    const empResults = results.filter(r => r.case_.employmentStatus === emp)
    const totals = empResults.map(r => r.totalCount)
    const tailoreds = empResults.map(r => r.tailoredCount)
    const fails = empResults.filter(r => r.verdict === 'FAIL').length
    const warns = empResults.filter(r => r.verdict === 'WARNING').length
    console.log(`${emp.padEnd(6)}: cases=${empResults.length}, avg_total=${avg(totals)}, avg_tailored=${avg(tailoreds)}, fail=${fails}, warn=${warns}`)
  }

  console.log('\n--- 가구유형별 통계 ---')
  for (const ht of HOUSEHOLD_TYPES) {
    const htResults = results.filter(r => r.case_.householdType === ht)
    const totals = htResults.map(r => r.totalCount)
    const tailoreds = htResults.map(r => r.tailoredCount)
    const fails = htResults.filter(r => r.verdict === 'FAIL').length
    const warns = htResults.filter(r => r.verdict === 'WARNING').length
    console.log(`${ht.padEnd(6)}: cases=${htResults.length}, avg_total=${avg(totals)}, avg_tailored=${avg(tailoreds)}, fail=${fails}, warn=${warns}`)
  }

  console.log('\n--- 관심분야별 통계 ---')
  for (const combo of INTEREST_COMBOS) {
    const label = `[${combo.join(',')}]`
    const comboResults = results.filter(r =>
      r.case_.interestCategories.length === combo.length &&
      combo.every(c => r.case_.interestCategories.includes(c))
    )
    const totals = comboResults.map(r => r.totalCount)
    const tailoreds = comboResults.map(r => r.tailoredCount)
    const fails = comboResults.filter(r => r.verdict === 'FAIL').length
    const warns = comboResults.filter(r => r.verdict === 'WARNING').length
    console.log(`${label.padEnd(16)}: cases=${comboResults.length}, avg_total=${avg(totals)}, avg_tailored=${avg(tailoreds)}, fail=${fails}, warn=${warns}`)
  }

  // 9. 지역 정확도 최종 검증
  const totalRegionMismatches = results.reduce((sum, r) => sum + r.regionMismatchCount, 0)
  const totalRegionChecked = results.reduce((sum, r) => r.tailoredCount + r.recommendedCount + sum, 0)
  console.log('\n--- 지역 정확도 검증 ---')
  console.log(`지역 명시 support 중 잘못 매칭된 건수: ${totalRegionMismatches}/${totalRegionChecked}`)
  if (totalRegionMismatches > 0) {
    console.log('WARNING: 지역 오매칭이 발견되었습니다!')
  } else {
    console.log('OK: 모든 지역 매칭이 정확합니다.')
  }

  // 10. 최종 요약
  console.log('\n=== 최종 요약 ===')
  console.log(`총 supports: ${supports.length}`)
  console.log(`총 케이스: ${results.length}`)
  console.log(`PASS: ${passResults.length} (${(passResults.length / results.length * 100).toFixed(1)}%)`)
  console.log(`FAIL: ${failResults.length} (${(failResults.length / results.length * 100).toFixed(1)}%)`)
  console.log(`WARNING: ${warnResults.length} (${(warnResults.length / results.length * 100).toFixed(1)}%)`)
  console.log(`지역 오매칭: ${totalRegionMismatches}건`)
  console.log(`평균 total: ${avg(results.map(r => r.totalCount))}`)
  console.log(`평균 tailored: ${avg(results.map(r => r.tailoredCount))}`)
  console.log(`평균 knocked out: ${avg(results.map(r => r.knockedOut))}`)

  if (failResults.length > 0) {
    console.log('\n결론: FAIL 케이스 존재 -- 원인 분석 필요')
    process.exit(1)
  } else if (warnResults.length > results.length * 0.3) {
    console.log('\n결론: WARNING 비율 30% 초과 -- 주의 필요')
    process.exit(0)
  } else {
    console.log('\n결론: 전체적으로 양호')
    process.exit(0)
  }
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
