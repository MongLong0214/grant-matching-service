/**
 * 전체 DB 레코드의 모든 추출 차원 재추출 (retag)
 * regions, businessTypes, employee, revenue, businessAge, founderAge,
 * age, householdTypes, incomeLevels, employmentStatus, benefitCategories, confidence
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
  let v = t.slice(e + 1).trim()
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1)
  if (!process.env[k]) process.env[k] = v
}

import { extractEligibility } from '../src/lib/extraction/index'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

interface SupportRow {
  id: string; title: string; organization: string | null
  raw_eligibility_text: string | null; raw_preference_text: string | null; raw_exclusion_text: string | null
  target_regions: string[] | null; target_sub_regions: string[] | null
  target_business_types: string[] | null
  target_employee_min: number | null; target_employee_max: number | null
  target_revenue_min: number | null; target_revenue_max: number | null
  target_business_age_min: number | null; target_business_age_max: number | null
  target_founder_age_min: number | null; target_founder_age_max: number | null
  target_age_min: number | null; target_age_max: number | null
  target_household_types: string[] | null; target_income_levels: string[] | null
  target_employment_status: string[] | null; benefit_categories: string[] | null
  extraction_confidence: Record<string, number> | null; region_scope: string | null
}

interface UpdatePayload {
  id: string; target_regions: string[]; target_sub_regions: string[]
  target_business_types: string[]
  target_employee_min: number | null; target_employee_max: number | null
  target_revenue_min: number | null; target_revenue_max: number | null
  target_business_age_min: number | null; target_business_age_max: number | null
  target_founder_age_min: number | null; target_founder_age_max: number | null
  target_age_min: number | null; target_age_max: number | null
  target_household_types: string[]; target_income_levels: string[]
  target_employment_status: string[]; benefit_categories: string[]
  extraction_confidence: Record<string, number>; region_scope: string
}

function arrEq(a: unknown[] | null, b: unknown[]): boolean {
  if (!a && b.length === 0) return true
  if (!a || a.length !== b.length) return false
  const sa = [...a].sort(), sb = [...b].sort()
  return sa.every((v, i) => v === sb[i])
}

async function main() {
  console.log('=== 전체 차원 재추출 ===')
  const PAGE_SIZE = 1000
  const allRows: SupportRow[] = []
  let from = 0
  while (true) {
    const { data, error } = await supabase.from('supports')
      .select('id, title, organization, raw_eligibility_text, raw_preference_text, raw_exclusion_text, target_regions, target_sub_regions, target_business_types, target_employee_min, target_employee_max, target_revenue_min, target_revenue_max, target_business_age_min, target_business_age_max, target_founder_age_min, target_founder_age_max, target_age_min, target_age_max, target_household_types, target_income_levels, target_employment_status, benefit_categories, extraction_confidence, region_scope')
      .eq('is_active', true).range(from, from + PAGE_SIZE - 1)
    if (error) throw error
    if (!data?.length) break
    allRows.push(...(data as SupportRow[]))
    if (data.length < PAGE_SIZE) break
    from += PAGE_SIZE
  }
  console.log(`${allRows.length}건 로드`)

  const updates: UpdatePayload[] = []
  for (const row of allRows) {
    const texts = [row.raw_eligibility_text, row.raw_preference_text, row.raw_exclusion_text].filter(Boolean) as string[]
    const r = extractEligibility(texts, row.title, row.organization ?? undefined)
    const changed =
      !arrEq(row.target_regions, r.regions) || !arrEq(row.target_sub_regions, r.subRegions) ||
      !arrEq(row.target_business_types, r.businessTypes) ||
      row.target_employee_min !== r.employeeMin || row.target_employee_max !== r.employeeMax ||
      row.target_revenue_min !== r.revenueMin || row.target_revenue_max !== r.revenueMax ||
      row.target_business_age_min !== r.businessAgeMinMonths || row.target_business_age_max !== r.businessAgeMaxMonths ||
      row.target_founder_age_min !== r.founderAgeMin || row.target_founder_age_max !== r.founderAgeMax ||
      row.target_age_min !== r.ageMin || row.target_age_max !== r.ageMax ||
      !arrEq(row.target_household_types, r.householdTypes) || !arrEq(row.target_income_levels, r.incomeLevels) ||
      !arrEq(row.target_employment_status, r.employmentStatus) || !arrEq(row.benefit_categories, r.benefitCategories) ||
      row.region_scope !== r.regionScope
    if (!changed) continue
    updates.push({
      id: row.id, target_regions: r.regions, target_sub_regions: r.subRegions,
      target_business_types: r.businessTypes,
      target_employee_min: r.employeeMin, target_employee_max: r.employeeMax,
      target_revenue_min: r.revenueMin, target_revenue_max: r.revenueMax,
      target_business_age_min: r.businessAgeMinMonths, target_business_age_max: r.businessAgeMaxMonths,
      target_founder_age_min: r.founderAgeMin, target_founder_age_max: r.founderAgeMax,
      target_age_min: r.ageMin, target_age_max: r.ageMax,
      target_household_types: r.householdTypes, target_income_levels: r.incomeLevels,
      target_employment_status: r.employmentStatus, benefit_categories: r.benefitCategories,
      extraction_confidence: r.confidence as unknown as Record<string, number>, region_scope: r.regionScope,
    })
  }
  console.log(`\n변경: ${updates.length}/${allRows.length}건`)

  // 배치 업데이트
  let updated = 0
  for (let i = 0; i < updates.length; i += 50) {
    const batch = updates.slice(i, i + 50)
    await Promise.all(batch.map(u => { const { id, ...p } = u; return supabase.from('supports').update(p).eq('id', id) }))
    updated += batch.length
    if (updated % 200 === 0 || updated === updates.length) console.log(`  업데이트 ${updated}/${updates.length}`)
  }

  // 차원별 변경 통계
  const stats: Record<string, number> = { regions: 0, subRegions: 0, businessTypes: 0, employee: 0, revenue: 0, businessAge: 0, founderAge: 0, age: 0, household: 0, income: 0, employment: 0, categories: 0 }
  for (const u of updates) {
    const row = allRows.find(r => r.id === u.id)!
    if (!arrEq(row.target_regions, u.target_regions)) stats.regions++
    if (!arrEq(row.target_sub_regions, u.target_sub_regions)) stats.subRegions++
    if (!arrEq(row.target_business_types, u.target_business_types)) stats.businessTypes++
    if (row.target_employee_min !== u.target_employee_min || row.target_employee_max !== u.target_employee_max) stats.employee++
    if (row.target_revenue_min !== u.target_revenue_min || row.target_revenue_max !== u.target_revenue_max) stats.revenue++
    if (row.target_business_age_min !== u.target_business_age_min || row.target_business_age_max !== u.target_business_age_max) stats.businessAge++
    if (row.target_founder_age_min !== u.target_founder_age_min || row.target_founder_age_max !== u.target_founder_age_max) stats.founderAge++
    if (row.target_age_min !== u.target_age_min || row.target_age_max !== u.target_age_max) stats.age++
    if (!arrEq(row.target_household_types, u.target_household_types)) stats.household++
    if (!arrEq(row.target_income_levels, u.target_income_levels)) stats.income++
    if (!arrEq(row.target_employment_status, u.target_employment_status)) stats.employment++
    if (!arrEq(row.benefit_categories, u.benefit_categories)) stats.categories++
  }
  console.log('\n=== 변경 통계 ===')
  for (const [k, v] of Object.entries(stats)) console.log(`  ${k}: ${v}`)

  // region_scope 전체 분포
  const scopeCounts = { national: 0, regional: 0, unknown: 0 }
  for (const u of updates) { const s = u.region_scope as keyof typeof scopeCounts; if (s in scopeCounts) scopeCounts[s]++ }
  for (const row of allRows) {
    if (!updates.find(u => u.id === row.id)) { const s = (row.region_scope ?? 'unknown') as keyof typeof scopeCounts; if (s in scopeCounts) scopeCounts[s]++ }
  }
  console.log('\n=== region_scope 분포 ===')
  for (const [k, v] of Object.entries(scopeCounts)) console.log(`  ${k}: ${v}`)
}

main().catch(console.error)
