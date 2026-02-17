/**
 * region_scope 도입 효과 검증
 * - 지역 FP(False Positive) 비율 측정
 * - region_scope 분포별 매칭 결과 분석
 * - 500 personal + 500 business = 1000 cases
 */
import { readFileSync } from 'fs'

const envFile = readFileSync('.env.local', 'utf-8')
for (const l of envFile.split('\n')) {
  const t = l.trim()
  if (!t || t.startsWith('#')) continue
  const e = t.indexOf('=')
  if (e === -1) continue
  const k = t.slice(0, e).trim()
  let v = t.slice(e + 1).trim()
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1)
  if (!process.env[k]) process.env[k] = v
}

import { createClient } from '@supabase/supabase-js'
import { mapSupportRow } from '../src/lib/supabase/mappers'
import { matchSupportsV4 } from '../src/lib/matching-v4/index'
import type { UserInput, Support } from '../src/types'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

const REGIONS = ['서울','부산','대구','인천','광주','대전','울산','세종','경기','강원','충북','충남','전북','전남','경북','경남','제주']
const AGE_GROUPS = ['10대','20대','30대','40대','50대','60대이상']
const GENDERS = ['남성','여성']
const HOUSEHOLD_TYPES = ['1인가구','부부','한부모','다자녀','다문화','일반']
const INCOME_LEVELS = ['기초생활','차상위','중위50이하','중위100이하','중위100초과']
const EMPLOYMENT_STATUS = ['재직자','자영업자','구직자','학생','무직/은퇴']
const BUSINESS_TYPES = ['제조업','도매 및 소매업','정보통신업','숙박 및 음식점업','건설업','운수 및 창고업','전문, 과학 및 기술 서비스업','교육 서비스업','보건업 및 사회복지 서비스업','기타']

function pick<T>(arr: readonly T[]): T { return arr[Math.floor(Math.random() * arr.length)] }
function randInt(min: number, max: number): number { return Math.floor(Math.random() * (max - min + 1)) + min }

function generatePersonal(): UserInput {
  return {
    userType: 'personal',
    region: pick(REGIONS),
    ageGroup: pick(AGE_GROUPS),
    gender: pick(GENDERS),
    householdType: pick(HOUSEHOLD_TYPES),
    incomeLevel: pick(INCOME_LEVELS),
    employmentStatus: pick(EMPLOYMENT_STATUS),
    interestCategories: [],
  }
}

function generateBusiness(): UserInput {
  return {
    userType: 'business',
    region: pick(REGIONS),
    businessType: pick(BUSINESS_TYPES),
    employeeCount: randInt(1, 50),
    annualRevenue: randInt(50_000_000, 5_000_000_000),
    businessAge: randInt(1, 120),
    founderAge: randInt(25, 65),
  }
}

/** 지역 FP 판정: regional scope인데 사용자 지역과 불일치하면 FP */
function isRegionFP(support: Support, userRegion: string): boolean {
  if (support.regionScope === 'national') return false
  if (support.regionScope === 'unknown') return false
  // regional + 지역 불일치 = FP
  const regions = support.targetRegions ?? []
  if (regions.length > 0 && !regions.includes(userRegion)) return true
  return false
}

/** org/title에서 타지역 키워드 감지 (unknown scope에서의 FP 추정) */
function hasOtherRegionKeyword(support: Support, userRegion: string): boolean {
  const text = `${support.title} ${support.organization}`
  const otherRegions = REGIONS.filter(r => r !== userRegion)
  // 짧은 지역명 (2글자)은 더 엄격하게 판정
  for (const r of otherRegions) {
    if (text.includes(r + '시') || text.includes(r + '도') || text.includes(r + '광역시') || text.includes(r + '특별')) {
      return true
    }
    // 경기/경북/경남/전북/전남/충북/충남/강원/제주는 지역명 자체로 충분
    if (['경기','경북','경남','전북','전남','충북','충남','강원','제주'].includes(r) && text.includes(r)) {
      return true
    }
  }
  return false
}

async function main() {
  console.log('=== Region Scope Audit (1000 Cases) ===\n')

  // 모든 supports 로드
  const PAGE_SIZE = 1000
  const allRows: unknown[] = []
  let from = 0
  while (true) {
    const { data, error } = await supabase.from('supports').select('*').eq('is_active', true).range(from, from + PAGE_SIZE - 1)
    if (error) throw error
    if (!data || data.length === 0) break
    allRows.push(...data)
    if (data.length < PAGE_SIZE) break
    from += PAGE_SIZE
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supports = allRows.map((r) => mapSupportRow(r as any))
  console.log(`Loaded ${supports.length} supports`)

  // region_scope 분포
  const scopeDist = { national: 0, regional: 0, unknown: 0 }
  for (const s of supports) {
    const scope = (s.regionScope ?? 'unknown') as keyof typeof scopeDist
    if (scope in scopeDist) scopeDist[scope]++
  }
  console.log(`Region scope distribution:`)
  console.log(`  national:  ${scopeDist.national} (${(scopeDist.national / supports.length * 100).toFixed(1)}%)`)
  console.log(`  regional:  ${scopeDist.regional} (${(scopeDist.regional / supports.length * 100).toFixed(1)}%)`)
  console.log(`  unknown:   ${scopeDist.unknown} (${(scopeDist.unknown / supports.length * 100).toFixed(1)}%)`)

  // 프로필 생성
  const profiles: UserInput[] = []
  for (let i = 0; i < 500; i++) profiles.push(generatePersonal())
  for (let i = 0; i < 500; i++) profiles.push(generateBusiness())

  // 매칭 + 분석
  let totalFP = 0
  let totalSuspicious = 0
  let totalTailored = 0
  let totalRecommended = 0
  let totalExploratory = 0
  let totalKnockout = 0
  let totalZeroMatch = 0

  const tierScopeDist = {
    tailored: { national: 0, regional: 0, unknown: 0 },
    recommended: { national: 0, regional: 0, unknown: 0 },
    exploratory: { national: 0, regional: 0, unknown: 0 },
  }

  for (let i = 0; i < profiles.length; i++) {
    if ((i + 1) % 200 === 0) console.log(`  Processed ${i + 1}/1000...`)
    const input = profiles[i]
    const result = matchSupportsV4(supports, input)

    totalTailored += result.tailored.length
    totalRecommended += result.recommended.length
    totalExploratory += result.exploratory.length
    totalKnockout += result.knockedOut
    if (result.totalCount === 0) totalZeroMatch++

    const userRegion = input.region

    for (const s of result.all) {
      // tier별 scope 분포
      const scope = (s.support.regionScope ?? 'unknown') as keyof typeof scopeDist
      const tier = s.tier as keyof typeof tierScopeDist
      if (tier in tierScopeDist && scope in tierScopeDist[tier]) {
        tierScopeDist[tier][scope]++
      }

      // FP 판정 (regional에서 지역 불일치)
      if (isRegionFP(s.support, userRegion)) totalFP++

      // unknown에서 타지역 의심
      if (scope === 'unknown' && s.tier !== 'exploratory') {
        if (hasOtherRegionKeyword(s.support, userRegion)) totalSuspicious++
      }
    }
  }

  console.log(`\n======================================`)
  console.log(`=== Region Scope Audit Results ===`)
  console.log(`======================================`)

  console.log(`\n--- 매칭 통계 (1000 profiles) ---`)
  console.log(`  Total tailored:     ${totalTailored} (avg ${(totalTailored / 1000).toFixed(1)}/user)`)
  console.log(`  Total recommended:  ${totalRecommended} (avg ${(totalRecommended / 1000).toFixed(1)}/user)`)
  console.log(`  Total exploratory:  ${totalExploratory} (avg ${(totalExploratory / 1000).toFixed(1)}/user)`)
  console.log(`  Avg knockout:       ${(totalKnockout / 1000).toFixed(0)}/user`)
  console.log(`  Zero-match users:   ${totalZeroMatch}`)

  console.log(`\n--- 지역 FP (False Positive) ---`)
  console.log(`  Regional scope FP:     ${totalFP} (regional인데 사용자 지역과 불일치)`)
  console.log(`  Unknown suspicious:    ${totalSuspicious} (unknown인데 tailored/recommended에 타지역 키워드)`)
  console.log(`  FP rate (regional):    ${(totalFP / (totalTailored + totalRecommended + totalExploratory) * 100).toFixed(2)}%`)

  console.log(`\n--- Tier별 region_scope 분포 ---`)
  for (const tier of ['tailored', 'recommended', 'exploratory'] as const) {
    const d = tierScopeDist[tier]
    const total = d.national + d.regional + d.unknown
    if (total === 0) continue
    console.log(`  ${tier}: national ${d.national} (${(d.national / total * 100).toFixed(1)}%) | regional ${d.regional} (${(d.regional / total * 100).toFixed(1)}%) | unknown ${d.unknown} (${(d.unknown / total * 100).toFixed(1)}%)`)
  }

  // 등급 판정
  const fpRate = totalFP / (totalTailored + totalRecommended + totalExploratory) * 100
  const unknownInTopRatio = (tierScopeDist.tailored.unknown + tierScopeDist.recommended.unknown) /
    (tierScopeDist.tailored.national + tierScopeDist.tailored.regional + tierScopeDist.tailored.unknown +
     tierScopeDist.recommended.national + tierScopeDist.recommended.regional + tierScopeDist.recommended.unknown) * 100

  console.log(`\n--- 핵심 지표 ---`)
  console.log(`  Region FP Rate:           ${fpRate.toFixed(2)}% ${fpRate < 1 ? '✅ PASS' : fpRate < 5 ? '⚠️ WARN' : '❌ FAIL'}`)
  console.log(`  Unknown in Top Tier Rate: ${unknownInTopRatio.toFixed(1)}% ${unknownInTopRatio < 30 ? '✅' : unknownInTopRatio < 50 ? '⚠️' : '❌'}`)
  console.log(`  Zero-Match Rate:          ${(totalZeroMatch / 1000 * 100).toFixed(1)}% ${totalZeroMatch === 0 ? '✅ PASS' : '⚠️'}`)

  const grade = fpRate < 1 && totalZeroMatch === 0 ? 'A' :
    fpRate < 3 && totalZeroMatch <= 10 ? 'B' :
    fpRate < 5 ? 'C' : 'F'
  console.log(`\n  종합 등급: ${grade}`)
}

main().catch(console.error)
