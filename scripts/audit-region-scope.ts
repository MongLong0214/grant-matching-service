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
import type { Database } from '../src/lib/supabase/types'

type SupportRow = Database['public']['Tables']['supports']['Row']

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

const REGIONS = ['서울','부산','대구','인천','광주','대전','울산','세종','경기','강원','충북','충남','전북','전남','경북','경남','제주']
const AGE_GROUPS = ['10대','20대','30대','40대','50대','60대이상']
const GENDERS = ['남성','여성']
const HOUSEHOLD_TYPES = ['1인','신혼부부','영유아','다자녀','한부모','일반']
const INCOME_LEVELS = ['기초생활','차상위','중위50이하','중위100이하','중위100초과']
const EMPLOYMENT_STATUS = ['재직자','구직자','학생','자영업','무직','은퇴']
const BUSINESS_TYPES = ['제조업','도매 및 소매업','정보통신업','숙박 및 음식점업','건설업','운수 및 창고업','전문, 과학 및 기술 서비스업','교육 서비스업','보건업 및 사회복지 서비스업','기타']

function pick<T>(arr: readonly T[]): T { return arr[Math.floor(Math.random() * arr.length)] }
function randInt(min: number, max: number): number { return Math.floor(Math.random() * (max - min + 1)) + min }

function generatePersonal(): UserInput {
  return { userType: 'personal', region: pick(REGIONS), ageGroup: pick(AGE_GROUPS), gender: pick(GENDERS), householdType: pick(HOUSEHOLD_TYPES), incomeLevel: pick(INCOME_LEVELS), employmentStatus: pick(EMPLOYMENT_STATUS), interestCategories: [] }
}

function generateBusiness(): UserInput {
  return { userType: 'business', region: pick(REGIONS), businessType: pick(BUSINESS_TYPES), employeeCount: randInt(1, 50), annualRevenue: randInt(50_000_000, 5_000_000_000), businessAge: randInt(1, 120), founderAge: randInt(25, 65) }
}

function isRegionFP(support: Support, userRegion: string): boolean {
  if (support.regionScope !== 'regional') return false
  const regions = support.targetRegions ?? []
  return regions.length > 0 && !regions.includes(userRegion)
}

async function main() {
  console.log('=== Region Scope 감사 (1000 Cases) ===\n')

  // supports 로드
  const allRows: SupportRow[] = []
  let from = 0
  while (true) {
    const { data, error } = await supabase.from('supports').select('*').eq('is_active', true).range(from, from + 999)
    if (error) throw error
    if (!data?.length) break
    allRows.push(...(data as SupportRow[]))
    if (data.length < 1000) break
    from += 1000
  }
  const supports = allRows.map(r => mapSupportRow(r))
  console.log(`${supports.length}건 로드`)

  // region_scope 분포
  const scopeDist = { national: 0, regional: 0, unknown: 0 }
  for (const s of supports) { const scope = (s.regionScope ?? 'unknown') as keyof typeof scopeDist; if (scope in scopeDist) scopeDist[scope]++ }
  console.log(`  national: ${scopeDist.national} (${(scopeDist.national / supports.length * 100).toFixed(1)}%)`)
  console.log(`  regional: ${scopeDist.regional} (${(scopeDist.regional / supports.length * 100).toFixed(1)}%)`)
  console.log(`  unknown:  ${scopeDist.unknown} (${(scopeDist.unknown / supports.length * 100).toFixed(1)}%)`)

  // 프로필 생성 + 매칭
  const profiles: UserInput[] = []
  for (let i = 0; i < 500; i++) profiles.push(generatePersonal())
  for (let i = 0; i < 500; i++) profiles.push(generateBusiness())

  let totalFP = 0, totalTailored = 0, totalRecommended = 0, totalExploratory = 0, totalKnockout = 0, totalZeroMatch = 0
  const tierScope = { tailored: { national: 0, regional: 0, unknown: 0 }, recommended: { national: 0, regional: 0, unknown: 0 }, exploratory: { national: 0, regional: 0, unknown: 0 } }

  for (let i = 0; i < profiles.length; i++) {
    if ((i + 1) % 200 === 0) console.log(`  ${i + 1}/1000 처리...`)
    const input = profiles[i]
    const result = matchSupportsV4(supports, input)
    totalTailored += result.tailored.length; totalRecommended += result.recommended.length
    totalExploratory += result.exploratory.length; totalKnockout += result.knockedOut
    if (result.totalCount === 0) totalZeroMatch++
    for (const s of result.all) {
      const scope = (s.support.regionScope ?? 'unknown') as keyof typeof scopeDist
      const tier = s.tier as keyof typeof tierScope
      if (tier in tierScope && scope in tierScope[tier]) tierScope[tier][scope]++
      if (isRegionFP(s.support, input.region)) totalFP++
    }
  }

  const totalResults = totalTailored + totalRecommended + totalExploratory
  const fpRate = totalResults > 0 ? (totalFP / totalResults * 100) : 0
  const topTotal = tierScope.tailored.national + tierScope.tailored.regional + tierScope.tailored.unknown + tierScope.recommended.national + tierScope.recommended.regional + tierScope.recommended.unknown
  const unknownTop = tierScope.tailored.unknown + tierScope.recommended.unknown
  const unknownTopRatio = topTotal > 0 ? (unknownTop / topTotal * 100) : 0

  console.log(`\n--- 매칭 통계 ---`)
  console.log(`  tailored: ${totalTailored} (${(totalTailored / 1000).toFixed(1)}/user)`)
  console.log(`  recommended: ${totalRecommended} (${(totalRecommended / 1000).toFixed(1)}/user)`)
  console.log(`  exploratory: ${totalExploratory} (${(totalExploratory / 1000).toFixed(1)}/user)`)
  console.log(`  knockout: ${(totalKnockout / 1000).toFixed(0)}/user, zero-match: ${totalZeroMatch}`)
  console.log(`\n--- 지역 FP ---`)
  console.log(`  FP: ${totalFP}건, FP rate: ${fpRate.toFixed(2)}%`)
  console.log(`\n--- Tier별 scope ---`)
  for (const tier of ['tailored', 'recommended', 'exploratory'] as const) {
    const d = tierScope[tier]; const t = d.national + d.regional + d.unknown
    if (t === 0) continue
    console.log(`  ${tier}: national ${(d.national / t * 100).toFixed(1)}% | regional ${(d.regional / t * 100).toFixed(1)}% | unknown ${(d.unknown / t * 100).toFixed(1)}%`)
  }
  console.log(`\n--- 핵심 지표 ---`)
  console.log(`  FP Rate: ${fpRate.toFixed(2)}% ${fpRate < 1 ? '✅' : fpRate < 5 ? '⚠️' : '❌'}`)
  console.log(`  Unknown Top: ${unknownTopRatio.toFixed(1)}% ${unknownTopRatio < 30 ? '✅' : '⚠️'}`)
  console.log(`  Zero-Match: ${(totalZeroMatch / 10).toFixed(1)}% ${totalZeroMatch === 0 ? '✅' : '⚠️'}`)
  const grade = fpRate < 1 && totalZeroMatch === 0 ? 'A' : fpRate < 3 && totalZeroMatch <= 10 ? 'B' : fpRate < 5 ? 'C' : 'F'
  console.log(`\n  종합 등급: ${grade}`)
}

main().catch(console.error)
