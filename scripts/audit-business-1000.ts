/**
 * 사업자 트랙 1000케이스 매칭 결과 전수조사 스크립트
 *
 * 목적: 1000가지 사업자 입력 조합으로 매칭 알고리즘을 실행하여
 *       모든 케이스에서 유의미한 추천이 뜨는지 검증.
 *       특히 지역 매칭 정확도를 집중 검증.
 *
 * 실행: npx tsx scripts/audit-business-1000.ts
 */

import { readFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '../src/lib/supabase/types'

// .env.local 수동 파싱 (dotenv 의존성 없이)
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

import { mapSupportRows } from '../src/lib/supabase/mappers'
import { matchSupportsV4 } from '../src/lib/matching-v4/index'
import type { Support, DiagnoseFormData, UserInput } from '../src/types/index'

// ─── 입력 차원 정의 ─────────────────────────────────────────

const REGIONS = [
  '서울', '부산', '대구', '인천', '광주', '대전', '울산', '세종',
  '경기', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주',
] as const // 17개

const BUSINESS_TYPES = [
  '음식점업', '소매업', '제조업', '정보통신업', '건설업',
  '운수업', '숙박업', '교육서비스업', '부동산업', '전문과학기술서비스업',
] as const // 10개

const EMPLOYEE_COUNTS = [0, 1, 3, 5, 10, 20, 50, 100, 200, 300] as const // 10개
const REVENUES = [0, 5000, 10000, 30000, 50000, 100000, 300000, 500000, 1000000, 3000000] as const // 만원 단위 (0, 0.5억, 1억, 3억, 5억, 10억, 30억, 50억, 100억, 300억)
const BUSINESS_AGES = [0, 1, 2, 3, 5, 7, 10, 15, 20, 30] as const // 10개
const FOUNDER_AGES = [20, 25, 30, 35, 40, 45, 50, 55, 60, 65] as const // 10개

// ─── 케이스 생성 (17 x 10 기본 + 나머지 차원 순환 = 1000) ─────

interface TestCase {
  idx: number
  region: string
  businessType: string
  employeeCount: number
  annualRevenue: number
  businessAge: number
  founderAge: number
}

function generateCases(): TestCase[] {
  const cases: TestCase[] = []
  let idx = 0
  // 17 regions x 10 business types = 170 기본 조합
  // 나머지 4차원(employee, revenue, age, founderAge)은 순환
  for (let r = 0; r < REGIONS.length; r++) {
    for (let b = 0; b < BUSINESS_TYPES.length; b++) {
      const cycleIdx = r * BUSINESS_TYPES.length + b
      cases.push({
        idx: idx++,
        region: REGIONS[r],
        businessType: BUSINESS_TYPES[b],
        employeeCount: EMPLOYEE_COUNTS[cycleIdx % EMPLOYEE_COUNTS.length],
        annualRevenue: REVENUES[cycleIdx % REVENUES.length],
        businessAge: BUSINESS_AGES[cycleIdx % BUSINESS_AGES.length],
        founderAge: FOUNDER_AGES[cycleIdx % FOUNDER_AGES.length],
      })
    }
  }

  // 170 기본 + 830 추가 = 1000
  // 추가 케이스: 극단값 + 교차 조합으로 나머지 차원 커버
  const additionalNeeded = 1000 - cases.length
  for (let i = 0; i < additionalNeeded; i++) {
    cases.push({
      idx: idx++,
      region: REGIONS[i % REGIONS.length],
      businessType: BUSINESS_TYPES[(i + 3) % BUSINESS_TYPES.length],
      employeeCount: EMPLOYEE_COUNTS[(i + 5) % EMPLOYEE_COUNTS.length],
      annualRevenue: REVENUES[(i + 7) % REVENUES.length],
      businessAge: BUSINESS_AGES[(i + 2) % BUSINESS_AGES.length],
      founderAge: FOUNDER_AGES[(i + 4) % FOUNDER_AGES.length],
    })
  }

  return cases
}

// ─── 검증 로직 ───────────────────────────────────────────────

type Verdict = 'PASS' | 'FAIL' | 'WARNING'

interface CaseResult {
  case: TestCase
  verdict: Verdict
  reasons: string[]
  tailoredCount: number
  recommendedCount: number
  exploratoryCount: number
  totalCount: number
  knockedOut: number
  filteredByServiceType: number
  totalAnalyzed: number
  // 정확도 검증
  regionMismatches: { supportId: string; supportTitle: string; supportRegions: string[] }[]
  businessTypeMismatches: { supportId: string; supportTitle: string; supportTypes: string[] }[]
  employeeRangeFails: { supportId: string; supportTitle: string; maxEmployee: number | null }[]
}

function isLargeEnterprise(c: TestCase): boolean {
  return c.employeeCount >= 200 && c.annualRevenue >= 1000000 // 200+ 직원, 100억+
}

function verifyCase(c: TestCase, supports: Support[]): CaseResult {
  const userInput: UserInput = {
    userType: 'business',
    businessType: c.businessType,
    region: c.region,
    employeeCount: c.employeeCount,
    annualRevenue: c.annualRevenue,
    businessAge: c.businessAge,
    founderAge: c.founderAge,
  }

  const result = matchSupportsV4(supports, userInput)

  const reasons: string[] = []
  let verdict: Verdict = 'PASS'

  // 지역 정확도 검증: tailored 결과 중 지역 명시 support의 지역이 입력 지역과 불일치
  const regionMismatches: CaseResult['regionMismatches'] = []
  for (const scored of result.tailored) {
    const s = scored.support
    if (s.targetRegions && s.targetRegions.length > 0) {
      if (!s.targetRegions.includes(c.region)) {
        regionMismatches.push({
          supportId: s.id,
          supportTitle: s.title,
          supportRegions: s.targetRegions,
        })
      }
    }
  }

  // 업종 정확도 검증
  const businessTypeMismatches: CaseResult['businessTypeMismatches'] = []
  for (const scored of result.tailored) {
    const s = scored.support
    if (s.targetBusinessTypes && s.targetBusinessTypes.length > 0) {
      // 업종 확장 매칭 고려 (BUSINESS_TYPE_ALIASES)
      const expanded = expandUserBusinessType(c.businessType)
      const hasMatch = s.targetBusinessTypes.some(t => expanded.includes(t))
      if (!hasMatch) {
        businessTypeMismatches.push({
          supportId: s.id,
          supportTitle: s.title,
          supportTypes: s.targetBusinessTypes,
        })
      }
    }
  }

  // 직원수 범위 초과 검증: all 결과에서 확인
  const employeeRangeFails: CaseResult['employeeRangeFails'] = []
  for (const scored of result.tailored) {
    const s = scored.support
    if (s.targetEmployeeMax !== null && c.employeeCount > s.targetEmployeeMax) {
      employeeRangeFails.push({
        supportId: s.id,
        supportTitle: s.title,
        maxEmployee: s.targetEmployeeMax,
      })
    }
  }

  // FAIL 조건
  if (result.totalCount === 0) {
    if (isLargeEnterprise(c)) {
      verdict = 'WARNING'
      reasons.push('대기업 케이스: 추천 결과 없음 (중소기업 대상 서비스 위주)')
    } else {
      verdict = 'FAIL'
      reasons.push('추천 결과 없음 (total=0)')
    }
  }

  if (regionMismatches.length > 0) {
    verdict = 'FAIL'
    reasons.push(`지역 오매칭 ${regionMismatches.length}건: ${regionMismatches.map(m => `[${m.supportTitle}] 지원지역=${m.supportRegions.join(',')} vs 입력=${c.region}`).join('; ')}`)
  }

  if (businessTypeMismatches.length > 0) {
    // 업종 불일치는 부분매칭일 수 있으므로 WARNING
    if (verdict !== 'FAIL') verdict = 'WARNING'
    reasons.push(`업종 불일치 의심 ${businessTypeMismatches.length}건`)
  }

  if (employeeRangeFails.length > 0) {
    verdict = 'FAIL'
    reasons.push(`직원수 범위 초과 매칭 ${employeeRangeFails.length}건: ${employeeRangeFails.map(m => `[${m.supportTitle}] max=${m.maxEmployee} vs 입력=${c.employeeCount}`).join('; ')}`)
  }

  // WARNING 조건 (FAIL이 아닌 경우에만)
  if (verdict === 'PASS') {
    if (result.tailored.length < 3) {
      verdict = 'WARNING'
      reasons.push(`tailored < 3 (${result.tailored.length}건)`)
    }
    if (result.totalCount < 10) {
      verdict = 'WARNING'
      reasons.push(`total < 10 (${result.totalCount}건)`)
    }
    if (isLargeEnterprise(c) && result.totalCount < 5) {
      verdict = 'WARNING'
      reasons.push(`대기업 케이스: total < 5 (${result.totalCount}건)`)
    }
  }

  return {
    case: c,
    verdict,
    reasons,
    tailoredCount: result.tailored.length,
    recommendedCount: result.recommended.length,
    exploratoryCount: result.exploratory.length,
    totalCount: result.totalCount,
    knockedOut: result.knockedOut,
    filteredByServiceType: result.filteredByServiceType,
    totalAnalyzed: result.totalAnalyzed,
    regionMismatches,
    businessTypeMismatches,
    employeeRangeFails,
  }
}

// 업종 확장 (matching-v4/scores.ts의 BUSINESS_TYPE_ALIASES 미러링)
const BUSINESS_TYPE_ALIASES: Record<string, string[]> = {
  '도매 및 소매업': ['도매업', '소매업', '도매 및 소매업'],
  '숙박 및 음식점업': ['숙박업', '음식점업', '숙박 및 음식점업'],
  '운수 및 창고업': ['운수업', '운수 및 창고업'],
  '전문, 과학 및 기술 서비스업': ['전문서비스업', '전문, 과학 및 기술 서비스업'],
  '교육 서비스업': ['교육서비스업', '교육 서비스업'],
  '보건업 및 사회복지 서비스업': ['보건업', '보건업 및 사회복지 서비스업'],
  '기타': ['기타서비스업', '기타', '예술/스포츠'],
}

function expandUserBusinessType(userType: string): string[] {
  // 역방향 매칭도 필요: 사용자가 '소매업'이면 '도매 및 소매업'도 매칭
  const result = [userType]
  for (const [parent, aliases] of Object.entries(BUSINESS_TYPE_ALIASES)) {
    if (aliases.includes(userType)) {
      result.push(parent, ...aliases)
    }
    if (parent === userType) {
      result.push(...aliases)
    }
  }
  return [...new Set(result)]
}

// ─── 통계 유틸 ───────────────────────────────────────────────

function avg(arr: number[]): string {
  if (arr.length === 0) return '0.0'
  return (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1)
}

function groupStats(results: CaseResult[], keyFn: (r: CaseResult) => string): Record<string, {
  avgTotal: string
  avgTailored: string
  failCount: number
  warnCount: number
  count: number
}> {
  const groups: Record<string, CaseResult[]> = {}
  for (const r of results) {
    const key = keyFn(r)
    if (!groups[key]) groups[key] = []
    groups[key].push(r)
  }
  const stats: Record<string, { avgTotal: string; avgTailored: string; failCount: number; warnCount: number; count: number }> = {}
  for (const [key, group] of Object.entries(groups)) {
    stats[key] = {
      avgTotal: avg(group.map(r => r.totalCount)),
      avgTailored: avg(group.map(r => r.tailoredCount)),
      failCount: group.filter(r => r.verdict === 'FAIL').length,
      warnCount: group.filter(r => r.verdict === 'WARNING').length,
      count: group.length,
    }
  }
  return stats
}

// ─── 메인 ────────────────────────────────────────────────────

async function loadAllSupports(): Promise<Support[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL 및 SUPABASE_SERVICE_ROLE_KEY 환경변수가 필요합니다')
  }
  const supabase = createClient<Database>(supabaseUrl, supabaseKey)

  const allRows: Database['public']['Tables']['supports']['Row'][] = []
  const PAGE_SIZE = 1000
  let offset = 0

  while (true) {
    const { data, error } = await supabase
      .from('supports')
      .select('*')
      .eq('is_active', true)
      .range(offset, offset + PAGE_SIZE - 1)

    if (error) throw new Error(`Supabase 쿼리 실패: ${error.message}`)
    if (!data || data.length === 0) break
    allRows.push(...data)
    if (data.length < PAGE_SIZE) break
    offset += PAGE_SIZE
  }

  return mapSupportRows(allRows)
}

function formatCase(c: TestCase): string {
  const revLabel = c.annualRevenue >= 10000
    ? `${(c.annualRevenue / 10000).toFixed(1)}억`
    : `${c.annualRevenue}만`
  return `${c.region}/${c.businessType}/${c.employeeCount}명/${revLabel}/${c.businessAge}년/${c.founderAge}세`
}

async function main() {
  console.log('=== 사업자 트랙 1000케이스 전수조사 ===\n')

  // 1. 데이터 로드
  console.log('[1/4] Supabase에서 active supports 로드 중...')
  const supports = await loadAllSupports()
  console.log(`Total supports loaded: ${supports.length}\n`)

  // 지원사업 통계 미리보기
  const withRegions = supports.filter(s => s.targetRegions && s.targetRegions.length > 0).length
  const withBusinessTypes = supports.filter(s => s.targetBusinessTypes && s.targetBusinessTypes.length > 0).length
  const withEmployeeRange = supports.filter(s => s.targetEmployeeMin !== null || s.targetEmployeeMax !== null).length
  console.log(`  지역 명시: ${withRegions}/${supports.length}`)
  console.log(`  업종 명시: ${withBusinessTypes}/${supports.length}`)
  console.log(`  직원수 범위: ${withEmployeeRange}/${supports.length}\n`)

  // 2. 케이스 생성
  console.log('[2/4] 1000개 테스트 케이스 생성 중...')
  const cases = generateCases()
  console.log(`Cases generated: ${cases.length}\n`)

  // 3. 매칭 실행
  console.log('[3/4] 매칭 실행 중...')
  const results: CaseResult[] = []
  const startTime = Date.now()

  for (let i = 0; i < cases.length; i++) {
    const r = verifyCase(cases[i], supports)
    results.push(r)
    if ((i + 1) % 100 === 0) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
      console.log(`  ${i + 1}/${cases.length} 완료 (${elapsed}s)`)
    }
  }

  const totalElapsed = ((Date.now() - startTime) / 1000).toFixed(1)
  console.log(`  전체 완료: ${totalElapsed}s\n`)

  // 4. 결과 집계
  console.log('[4/4] 결과 분석 중...\n')

  const passCount = results.filter(r => r.verdict === 'PASS').length
  const failCount = results.filter(r => r.verdict === 'FAIL').length
  const warnCount = results.filter(r => r.verdict === 'WARNING').length

  console.log('='.repeat(60))
  console.log('=== 전체 요약 ===')
  console.log('='.repeat(60))
  console.log(`Total supports loaded: ${supports.length}`)
  console.log(`Cases tested: ${cases.length}`)
  console.log(`PASS: ${passCount}`)
  console.log(`FAIL: ${failCount}`)
  console.log(`WARNING: ${warnCount}`)
  console.log()

  // ─── FAIL 상세 ───

  const fails = results.filter(r => r.verdict === 'FAIL')
  if (fails.length > 0) {
    console.log('='.repeat(60))
    console.log('--- FAIL 상세 ---')
    console.log('='.repeat(60))
    for (const r of fails.slice(0, 50)) { // 최대 50건만 출력
      console.log(`Case #${r.case.idx}: ${formatCase(r.case)}`)
      console.log(`  total=${r.totalCount}, tailored=${r.tailoredCount}, recommended=${r.recommendedCount}, exploratory=${r.exploratoryCount}`)
      console.log(`  knocked_out=${r.knockedOut}, filtered_service_type=${r.filteredByServiceType}`)
      for (const reason of r.reasons) {
        console.log(`  FAIL: ${reason}`)
      }
      console.log()
    }
    if (fails.length > 50) {
      console.log(`... 외 ${fails.length - 50}건 생략\n`)
    }
  }

  // ─── WARNING 상세 ───

  const warns = results.filter(r => r.verdict === 'WARNING')
  if (warns.length > 0) {
    console.log('='.repeat(60))
    console.log('--- WARNING 상세 ---')
    console.log('='.repeat(60))
    for (const r of warns.slice(0, 30)) { // 최대 30건만 출력
      console.log(`Case #${r.case.idx}: ${formatCase(r.case)}`)
      console.log(`  total=${r.totalCount}, tailored=${r.tailoredCount}`)
      for (const reason of r.reasons) {
        console.log(`  WARNING: ${reason}`)
      }
      console.log()
    }
    if (warns.length > 30) {
      console.log(`... 외 ${warns.length - 30}건 생략\n`)
    }
  }

  // ─── 지역별 통계 ───

  console.log('='.repeat(60))
  console.log('--- 지역별 통계 ---')
  console.log('='.repeat(60))
  const regionStats = groupStats(results, r => r.case.region)
  console.log(padRight('지역', 6) + padRight('cases', 6) + padRight('avg_total', 10) + padRight('avg_tailored', 12) + padRight('FAIL', 6) + padRight('WARN', 6))
  console.log('-'.repeat(46))
  for (const region of REGIONS) {
    const s = regionStats[region]
    if (!s) continue
    console.log(padRight(region, 6) + padRight(String(s.count), 6) + padRight(s.avgTotal, 10) + padRight(s.avgTailored, 12) + padRight(String(s.failCount), 6) + padRight(String(s.warnCount), 6))
  }
  console.log()

  // ─── 업종별 통계 ───

  console.log('='.repeat(60))
  console.log('--- 업종별 통계 ---')
  console.log('='.repeat(60))
  const typeStats = groupStats(results, r => r.case.businessType)
  console.log(padRight('업종', 20) + padRight('cases', 6) + padRight('avg_total', 10) + padRight('avg_tailored', 12) + padRight('FAIL', 6) + padRight('WARN', 6))
  console.log('-'.repeat(60))
  for (const bt of BUSINESS_TYPES) {
    const s = typeStats[bt]
    if (!s) continue
    console.log(padRight(bt, 20) + padRight(String(s.count), 6) + padRight(s.avgTotal, 10) + padRight(s.avgTailored, 12) + padRight(String(s.failCount), 6) + padRight(String(s.warnCount), 6))
  }
  console.log()

  // ─── 직원수별 통계 ───

  console.log('='.repeat(60))
  console.log('--- 직원수별 통계 ---')
  console.log('='.repeat(60))
  const empStats = groupStats(results, r => `${r.case.employeeCount}명`)
  console.log(padRight('직원수', 8) + padRight('cases', 6) + padRight('avg_total', 10) + padRight('avg_tailored', 12) + padRight('FAIL', 6) + padRight('WARN', 6))
  console.log('-'.repeat(48))
  for (const e of EMPLOYEE_COUNTS) {
    const key = `${e}명`
    const s = empStats[key]
    if (!s) continue
    console.log(padRight(key, 8) + padRight(String(s.count), 6) + padRight(s.avgTotal, 10) + padRight(s.avgTailored, 12) + padRight(String(s.failCount), 6) + padRight(String(s.warnCount), 6))
  }
  console.log()

  // ─── 매출별 통계 ───

  console.log('='.repeat(60))
  console.log('--- 매출별 통계 ---')
  console.log('='.repeat(60))
  const revStats = groupStats(results, r => {
    const v = r.case.annualRevenue
    return v >= 10000 ? `${(v / 10000).toFixed(1)}억` : `${v}만`
  })
  const revLabels = REVENUES.map(v => v >= 10000 ? `${(v / 10000).toFixed(1)}억` : `${v}만`)
  console.log(padRight('매출', 10) + padRight('cases', 6) + padRight('avg_total', 10) + padRight('avg_tailored', 12) + padRight('FAIL', 6) + padRight('WARN', 6))
  console.log('-'.repeat(50))
  for (const label of revLabels) {
    const s = revStats[label]
    if (!s) continue
    console.log(padRight(label, 10) + padRight(String(s.count), 6) + padRight(s.avgTotal, 10) + padRight(s.avgTailored, 12) + padRight(String(s.failCount), 6) + padRight(String(s.warnCount), 6))
  }
  console.log()

  // ─── 업력별 통계 ───

  console.log('='.repeat(60))
  console.log('--- 업력별 통계 ---')
  console.log('='.repeat(60))
  const ageStats = groupStats(results, r => `${r.case.businessAge}년`)
  console.log(padRight('업력', 8) + padRight('cases', 6) + padRight('avg_total', 10) + padRight('avg_tailored', 12) + padRight('FAIL', 6) + padRight('WARN', 6))
  console.log('-'.repeat(48))
  for (const a of BUSINESS_AGES) {
    const key = `${a}년`
    const s = ageStats[key]
    if (!s) continue
    console.log(padRight(key, 8) + padRight(String(s.count), 6) + padRight(s.avgTotal, 10) + padRight(s.avgTailored, 12) + padRight(String(s.failCount), 6) + padRight(String(s.warnCount), 6))
  }
  console.log()

  // ─── 대표자나이별 통계 ───

  console.log('='.repeat(60))
  console.log('--- 대표자나이별 통계 ---')
  console.log('='.repeat(60))
  const fAgeStats = groupStats(results, r => `${r.case.founderAge}세`)
  console.log(padRight('나이', 8) + padRight('cases', 6) + padRight('avg_total', 10) + padRight('avg_tailored', 12) + padRight('FAIL', 6) + padRight('WARN', 6))
  console.log('-'.repeat(48))
  for (const a of FOUNDER_AGES) {
    const key = `${a}세`
    const s = fAgeStats[key]
    if (!s) continue
    console.log(padRight(key, 8) + padRight(String(s.count), 6) + padRight(s.avgTotal, 10) + padRight(s.avgTailored, 12) + padRight(String(s.failCount), 6) + padRight(String(s.warnCount), 6))
  }
  console.log()

  // ─── 지역 정확도 심층 검증 ───

  console.log('='.repeat(60))
  console.log('--- 지역 정확도 검증 ---')
  console.log('='.repeat(60))
  let totalRegionChecked = 0
  let totalRegionMismatch = 0
  for (const r of results) {
    totalRegionChecked += r.tailoredCount // 각 tailored 항목을 검사
    totalRegionMismatch += r.regionMismatches.length
  }
  console.log(`지역 명시 support 중 잘못 매칭된 건수: ${totalRegionMismatch}/${totalRegionChecked} (tailored 결과 기준)`)
  if (totalRegionMismatch > 0) {
    // 지역별 오매칭 건수
    const regionMismatchMap: Record<string, number> = {}
    for (const r of results) {
      for (const m of r.regionMismatches) {
        const key = `입력=${r.case.region} vs 지원=${m.supportRegions.join(',')}`
        regionMismatchMap[key] = (regionMismatchMap[key] || 0) + 1
      }
    }
    console.log('\n오매칭 패턴:')
    for (const [pattern, count] of Object.entries(regionMismatchMap).sort((a, b) => b[1] - a[1]).slice(0, 20)) {
      console.log(`  ${pattern}: ${count}건`)
    }
  }
  console.log()

  // ─── 업종 정확도 검증 ───

  console.log('='.repeat(60))
  console.log('--- 업종 정확도 검증 ---')
  console.log('='.repeat(60))
  let totalTypeChecked = 0
  let totalTypeMismatch = 0
  for (const r of results) {
    totalTypeChecked += r.tailoredCount
    totalTypeMismatch += r.businessTypeMismatches.length
  }
  console.log(`업종 명시 support 중 불일치 의심 건수: ${totalTypeMismatch}/${totalTypeChecked} (tailored 결과 기준)`)
  if (totalTypeMismatch > 0) {
    const typeMismatchMap: Record<string, number> = {}
    for (const r of results) {
      for (const m of r.businessTypeMismatches) {
        const key = `입력=${r.case.businessType} vs 지원=${m.supportTypes.slice(0, 3).join(',')}`
        typeMismatchMap[key] = (typeMismatchMap[key] || 0) + 1
      }
    }
    console.log('\n불일치 패턴:')
    for (const [pattern, count] of Object.entries(typeMismatchMap).sort((a, b) => b[1] - a[1]).slice(0, 20)) {
      console.log(`  ${pattern}: ${count}건`)
    }
  }
  console.log()

  // ─── 직원수 범위 검증 ───

  console.log('='.repeat(60))
  console.log('--- 직원수 범위 검증 ---')
  console.log('='.repeat(60))
  let totalEmpChecked = 0
  let totalEmpFail = 0
  for (const r of results) {
    totalEmpChecked += r.tailoredCount
    totalEmpFail += r.employeeRangeFails.length
  }
  console.log(`직원수 범위 초과 매칭 건수: ${totalEmpFail}/${totalEmpChecked} (tailored 결과 기준)`)
  if (totalEmpFail > 0) {
    const empFailMap: Record<string, number> = {}
    for (const r of results) {
      for (const m of r.employeeRangeFails) {
        const key = `입력=${r.case.employeeCount}명 vs max=${m.maxEmployee}`
        empFailMap[key] = (empFailMap[key] || 0) + 1
      }
    }
    console.log('\n초과 패턴:')
    for (const [pattern, count] of Object.entries(empFailMap).sort((a, b) => b[1] - a[1]).slice(0, 20)) {
      console.log(`  ${pattern}: ${count}건`)
    }
  }
  console.log()

  // ─── knockout / 서비스타입 필터 통계 ───

  console.log('='.repeat(60))
  console.log('--- knockout / 서비스타입 필터 통계 ---')
  console.log('='.repeat(60))
  const avgKnockout = avg(results.map(r => r.knockedOut))
  const avgFiltered = avg(results.map(r => r.filteredByServiceType))
  console.log(`평균 knockout: ${avgKnockout}개`)
  console.log(`평균 서비스타입 필터: ${avgFiltered}개`)
  console.log(`평균 분석 대상: ${avg(results.map(r => r.totalAnalyzed))}개`)
  console.log()

  // ─── 최종 판정 ───

  console.log('='.repeat(60))
  if (failCount === 0) {
    console.log('AUDIT RESULT: ALL PASS')
  } else {
    console.log(`AUDIT RESULT: ${failCount} FAILURES DETECTED`)
  }
  console.log('='.repeat(60))
}

function padRight(str: string, len: number): string {
  // 한글 문자는 2바이트로 계산
  let displayLen = 0
  for (const ch of str) {
    displayLen += ch.charCodeAt(0) > 127 ? 2 : 1
  }
  const padding = Math.max(0, len - displayLen)
  return str + ' '.repeat(padding)
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
