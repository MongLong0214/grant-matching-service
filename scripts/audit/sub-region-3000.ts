/**
 * 구/군 단위 매칭 전수조사 (3000 cases)
 * - 1500 personal + 1500 business
 * - Type A (50%): sub-region 일치 검증
 * - Type B (30%): sub-region 영향 없음 검증
 * - Type C (20%): sub-region 미선택 fallback 검증
 */
import { readFileSync } from 'fs'

// env 로딩
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
import type { Support } from '../../src/types'
import type { Database } from '../../src/lib/supabase/types'
import { mapSupportRow } from '../../src/lib/supabase/mappers'
import { REGIONS, REGION_DISTRICTS } from '../../src/constants/index'
import { generateProfiles } from './profile-generators'
import type { SubRegionStats } from './profile-generators'
import { createEmptyMetrics, createEmptyCounters, analyzeProfile } from './scoring-helpers'
import { printDataOverview, printTypeResults, printGradeReport } from './report-printer'

type SupportRow = Database['public']['Tables']['supports']['Row']

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseKey) { console.error('Missing SUPABASE env vars'); process.exit(1) }
  const supabase = createClient(supabaseUrl, supabaseKey)

  // supports 로드
  console.log('Loading supports...')
  const allSupports: Support[] = []
  let offset = 0
  while (true) {
    const { data, error } = await supabase.from('supports')
      .select('id, title, organization, category, start_date, end_date, detail_url, target_regions, target_sub_regions, target_business_types, target_employee_min, target_employee_max, target_revenue_min, target_revenue_max, target_business_age_min, target_business_age_max, target_founder_age_min, target_founder_age_max, target_age_min, target_age_max, target_household_types, target_income_levels, target_employment_status, benefit_categories, amount, is_active, created_at, updated_at, source, raw_eligibility_text, raw_exclusion_text, raw_preference_text, extraction_confidence, external_id, service_type, region_scope')
      .eq('is_active', true).range(offset, offset + 999)
    if (error) { console.error('DB error:', error); process.exit(1) }
    if (!data?.length) break
    for (const row of data) allSupports.push(mapSupportRow(row as SupportRow))
    offset += 1000
    if (data.length < 1000) break
  }
  console.log(`Loaded ${allSupports.length} active supports`)

  // 데이터 분석 + 프로필 생성 준비
  const subRegionSupports = allSupports.filter(s => s.targetSubRegions?.length)
  const comboMap = new Map<string, SubRegionStats>()
  const regionSubRegionCount = new Map<string, number>()
  for (const s of subRegionSupports) {
    for (const region of s.targetRegions ?? []) {
      regionSubRegionCount.set(region, (regionSubRegionCount.get(region) ?? 0) + 1)
      for (const sub of s.targetSubRegions ?? []) {
        const key = `${region}|${sub}`
        const ex = comboMap.get(key)
        if (ex) ex.count++
        else comboMap.set(key, { region, subRegion: sub, count: 1 })
      }
    }
  }
  const sortedRegions = [...regionSubRegionCount.entries()].sort((a, b) => b[1] - a[1])
  const sortedCombos = [...comboMap.values()].sort((a, b) => b.count - a.count)
  const validCombos = sortedCombos.filter(c => REGION_DISTRICTS[c.region]?.includes(c.subRegion))
  const regionsWithDistricts = [...REGIONS].filter(r => REGION_DISTRICTS[r].length > 0)
  const noSubRegionCombos: Array<{ region: string; subRegion: string }> = []
  for (const region of regionsWithDistricts) {
    for (const district of REGION_DISTRICTS[region]) {
      if (!comboMap.has(`${region}|${district}`)) noSubRegionCombos.push({ region, subRegion: district })
    }
  }

  // 프로필 생성 + 매칭
  const personalProfiles = generateProfiles(2500, 'personal', validCombos, noSubRegionCombos)
  const businessProfiles = generateProfiles(2500, 'business', validCombos, noSubRegionCombos)
  const allProfiles = [...personalProfiles, ...businessProfiles]
  console.log(`Generated ${allProfiles.length} profiles`)

  const metrics: Record<string, ReturnType<typeof createEmptyMetrics>> = {}
  for (const key of ['personal-A','personal-B','personal-C','business-A','business-B','business-C'])
    metrics[key] = createEmptyMetrics()
  const g = createEmptyCounters()

  let processed = 0
  for (const profile of allProfiles) {
    processed++
    if (processed % 500 === 0) console.log(`  Processed ${processed}/${allProfiles.length}...`)
    const key = `${profile.userType}-${profile.profileType}`
    analyzeProfile(profile, allSupports, metrics[key], g, processed)
  }

  // 리포트 출력
  console.log('\n' + '='.repeat(70))
  console.log('=== 구/군 단위 매칭 전수조사 (5000 cases) ===')
  console.log('='.repeat(70))
  printDataOverview(allSupports, subRegionSupports, sortedRegions as [string, number][], sortedCombos)
  printTypeResults(metrics)
  printGradeReport(metrics, g, allSupports, allProfiles.length)
  console.log('\n' + '='.repeat(70))
}

main().catch(err => { console.error('Fatal error:', err); process.exit(1) })
