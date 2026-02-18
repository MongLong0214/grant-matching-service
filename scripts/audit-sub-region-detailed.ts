/**
 * 구/군 단위 매칭 상세 검증
 * - 실제 프로필로 매칭하여 구 단위 정책이 제대로 추천되는지 확인
 * - 시 단위 + 구 단위 정책의 정밀 분석
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
import { REGION_DISTRICTS } from '../src/constants/index'

type SupportRow = Database['public']['Tables']['supports']['Row']

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

// 테스트 프로필 정의 (실제 유저 시나리오)
const TEST_PROFILES: Array<{ label: string; input: UserInput }> = [
  // 개인 - 구 단위 테스트
  { label: '서울 강남구 20대 여성 학생', input: { userType: 'personal', region: '서울', subRegion: '강남구', ageGroup: '20대', gender: '여성', householdType: '1인', incomeLevel: '중위50이하', employmentStatus: '학생', interestCategories: ['교육','취업'] }},
  { label: '서울 강남구 20대 여성 학생 (구 미선택)', input: { userType: 'personal', region: '서울', ageGroup: '20대', gender: '여성', householdType: '1인', incomeLevel: '중위50이하', employmentStatus: '학생', interestCategories: ['교육','취업'] }},
  { label: '경기 고양시 30대 남성 재직자', input: { userType: 'personal', region: '경기', subRegion: '고양시', ageGroup: '30대', gender: '남성', householdType: '신혼부부', incomeLevel: '중위100이하', employmentStatus: '재직자', interestCategories: ['주거','육아'] }},
  { label: '경기 수원시 40대 여성 자영업', input: { userType: 'personal', region: '경기', subRegion: '수원시', ageGroup: '40대', gender: '여성', householdType: '다자녀', incomeLevel: '중위100이하', employmentStatus: '자영업', interestCategories: ['생활','교육'] }},
  { label: '부산 해운대구 50대 남성 구직자', input: { userType: 'personal', region: '부산', subRegion: '해운대구', ageGroup: '50대', gender: '남성', householdType: '일반', incomeLevel: '중위50이하', employmentStatus: '구직자', interestCategories: ['취업','건강'] }},
  { label: '인천 부평구 60대이상 여성 은퇴', input: { userType: 'personal', region: '인천', subRegion: '부평구', ageGroup: '60대이상', gender: '여성', householdType: '1인', incomeLevel: '기초생활', employmentStatus: '은퇴', interestCategories: ['건강','생활'] }},
  { label: '대구 수성구 20대 남성 학생', input: { userType: 'personal', region: '대구', subRegion: '수성구', ageGroup: '20대', gender: '남성', householdType: '일반', incomeLevel: '중위100이하', employmentStatus: '학생', interestCategories: ['교육','문화'] }},
  { label: '광주 광산구 30대 여성 한부모', input: { userType: 'personal', region: '광주', subRegion: '광산구', ageGroup: '30대', gender: '여성', householdType: '한부모', incomeLevel: '차상위', employmentStatus: '구직자', interestCategories: ['육아','생활'] }},
  // 사업자 - 구 단위 테스트
  { label: '서울 강남구 IT기업 5명', input: { userType: 'business', region: '서울', subRegion: '강남구', businessType: '정보통신업', employeeCount: 5, annualRevenue: 300_000_000, businessAge: 24, founderAge: 35 }},
  { label: '서울 강남구 IT기업 5명 (구 미선택)', input: { userType: 'business', region: '서울', businessType: '정보통신업', employeeCount: 5, annualRevenue: 300_000_000, businessAge: 24, founderAge: 35 }},
  { label: '경기 성남시 제조업 30명', input: { userType: 'business', region: '경기', subRegion: '성남시', businessType: '제조업', employeeCount: 30, annualRevenue: 3_000_000_000, businessAge: 84, founderAge: 55 }},
  { label: '부산 사상구 음식점 2명', input: { userType: 'business', region: '부산', subRegion: '사상구', businessType: '음식점업', employeeCount: 2, annualRevenue: 50_000_000, businessAge: 6, founderAge: 45 }},
  { label: '충북 청주시 전문서비스 10명', input: { userType: 'business', region: '충북', subRegion: '청주시', businessType: '전문서비스업', employeeCount: 10, annualRevenue: 750_000_000, businessAge: 48, founderAge: 45 }},
  { label: '전북 전주시 소매업 3명 예비창업', input: { userType: 'business', region: '전북', subRegion: '전주시', businessType: '소매업', employeeCount: 3, annualRevenue: 50_000_000, businessAge: -1, founderAge: 25 }},
]

async function main() {
  // supports 로드
  const allRows: SupportRow[] = []
  let from = 0
  while (true) {
    const { data, error } = await sb.from('supports').select('*').eq('is_active', true).range(from, from + 999)
    if (error) throw error
    if (!data?.length) break
    allRows.push(...(data as SupportRow[]))
    if (data.length < 1000) break
    from += 1000
  }
  const supports = allRows.map(r => mapSupportRow(r))
  console.log(`${supports.length}건 로드\n`)

  // 구/군 단위 데이터 현황
  const subRegionSupports = supports.filter(s => s.targetSubRegions?.length)
  console.log(`=== 구/군 단위 정책 현황 ===`)
  console.log(`전체: ${supports.length}건, 구/군 지정: ${subRegionSupports.length}건 (${(subRegionSupports.length / supports.length * 100).toFixed(1)}%)\n`)

  // 테스트
  console.log(`${'='.repeat(70)}`)
  console.log(`=== 실제 유저 시나리오 매칭 검증 (${TEST_PROFILES.length}건) ===`)
  console.log(`${'='.repeat(70)}\n`)

  let totalFP = 0
  let totalCorrectRegion = 0
  let totalResults = 0
  let subRegionMatchCount = 0
  let subRegionMissCount = 0

  for (const { label, input } of TEST_PROFILES) {
    const result = matchSupportsV4(supports, input)
    console.log(`\n--- ${label} ---`)
    console.log(`  tailored: ${result.tailored.length} | recommended: ${result.recommended.length} | exploratory: ${result.exploratory.length} | knockout: ${result.knockedOut}`)

    // 지역 FP 체크
    let fpCount = 0
    let regionCorrect = 0
    let subMatched = 0
    let subMissed = 0

    for (const s of result.all) {
      totalResults++
      const regions = s.support.targetRegions ?? []
      const subRegions = s.support.targetSubRegions ?? []
      const scope = s.support.regionScope

      // 지역 FP: regional인데 유저 지역과 불일치
      if (scope === 'regional' && regions.length > 0 && !regions.includes(input.region)) {
        fpCount++
        totalFP++
        console.log(`  ❌ FP: "${s.support.title}" (${regions.join(',')}) ≠ ${input.region}`)
      } else {
        regionCorrect++
        totalCorrectRegion++
      }

      // 구/군 매칭 확인
      if (subRegions.length > 0 && input.subRegion) {
        if (subRegions.includes(input.subRegion)) {
          subMatched++
          subRegionMatchCount++
        }
      }
    }

    // 상위 5건 출력
    console.log(`  FP: ${fpCount}건 | 지역 정확: ${regionCorrect}건`)
    console.log(`  구/군 매칭 supports: ${subMatched}건`)
    console.log(`  Top 5 tailored:`)
    for (const s of result.tailored.slice(0, 5)) {
      const regions = s.support.targetRegions?.join(',') || '전국/불명'
      const subs = s.support.targetSubRegions?.join(',') || '-'
      const scope = s.support.regionScope
      console.log(`    [${scope}] ${s.score.toFixed(3)} "${s.support.title.slice(0, 40)}" (${regions}/${subs}) [${s.support.source}]`)
    }

    // 구 단위 supports 중 결과에 포함되지 않은 것 확인
    if (input.subRegion) {
      const existingSubRegionSupports = supports.filter(s => {
        if (!s.targetSubRegions?.includes(input.subRegion!)) return false
        if (!s.targetRegions?.includes(input.region)) return false
        // service_type 필터
        if (input.userType === 'personal' && s.serviceType === 'business') return false
        if (input.userType === 'business' && s.serviceType === 'personal') return false
        return true
      })

      const matchedIds = new Set(result.all.map(r => r.support.id))
      const missed = existingSubRegionSupports.filter(s => !matchedIds.has(s.id))
      subMissed = missed.length
      subRegionMissCount += subMissed
      console.log(`  DB에 ${input.subRegion} 정책: ${existingSubRegionSupports.length}건, 매칭 결과에 포함: ${existingSubRegionSupports.length - subMissed}건, 미포함: ${subMissed}건`)
      if (missed.length > 0 && missed.length <= 3) {
        for (const m of missed.slice(0, 3)) {
          console.log(`    ⚠ 미포함: "${m.title.slice(0, 50)}" (score가 임계값 미달)`)
        }
      }
    }
  }

  // 종합
  console.log(`\n${'='.repeat(70)}`)
  console.log(`=== 종합 결과 ===`)
  console.log(`${'='.repeat(70)}`)
  console.log(`총 결과: ${totalResults}건`)
  console.log(`지역 FP: ${totalFP}건 (${(totalFP / totalResults * 100).toFixed(4)}%) ${totalFP === 0 ? '✅' : '❌'}`)
  console.log(`구/군 매칭 포함: ${subRegionMatchCount}건`)
  console.log(`구/군 매칭 미포함 (score 미달): ${subRegionMissCount}건`)

  // 구 미선택 vs 선택 비교
  console.log(`\n--- 구 선택 vs 미선택 비교 ---`)
  const comparisonPairs = [
    { withLabel: '서울 강남구 20대 여성 학생', withoutLabel: '서울 강남구 20대 여성 학생 (구 미선택)' },
    { withLabel: '서울 강남구 IT기업 5명', withoutLabel: '서울 강남구 IT기업 5명 (구 미선택)' },
  ]
  for (const pair of comparisonPairs) {
    const withProfile = TEST_PROFILES.find(p => p.label === pair.withLabel)!
    const withoutProfile = TEST_PROFILES.find(p => p.label === pair.withoutLabel)!
    const withResult = matchSupportsV4(supports, withProfile.input)
    const withoutResult = matchSupportsV4(supports, withoutProfile.input)

    const withSubCount = withResult.all.filter(r => r.support.targetSubRegions?.includes(withProfile.input.subRegion!)).length
    const withoutSubCount = withoutResult.all.filter(r => r.support.targetSubRegions?.includes(withProfile.input.subRegion!)).length

    console.log(`  ${pair.withLabel}:`)
    console.log(`    구 선택:   tailored ${withResult.tailored.length} | recommended ${withResult.recommended.length} | 강남구 정책 ${withSubCount}건`)
    console.log(`    구 미선택: tailored ${withoutResult.tailored.length} | recommended ${withoutResult.recommended.length} | 강남구 정책 ${withoutSubCount}건`)

    // 구 선택 시에만 나타나는 결과
    const withIds = new Set(withResult.all.map(r => r.support.id))
    const withoutIds = new Set(withoutResult.all.map(r => r.support.id))
    const onlyWith = withResult.all.filter(r => !withoutIds.has(r.support.id))
    const onlyWithout = withoutResult.all.filter(r => !withIds.has(r.support.id))
    console.log(`    구 선택 시에만 추천: ${onlyWith.length}건, 미선택 시에만 추천: ${onlyWithout.length}건`)
  }
}

main().catch(console.error)
