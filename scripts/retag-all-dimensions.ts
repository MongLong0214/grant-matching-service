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
  const v = t.slice(e + 1).trim()
  if (!process.env[k]) process.env[k] = v
}

import { extractEligibility } from '../src/lib/extraction/index'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

interface SupportRow {
  id: string
  title: string
  raw_eligibility_text: string | null
  raw_preference_text: string | null
  raw_exclusion_text: string | null
  target_regions: string[] | null
  target_business_types: string[] | null
  target_employee_min: number | null
  target_employee_max: number | null
  target_revenue_min: number | null
  target_revenue_max: number | null
  target_business_age_min: number | null
  target_business_age_max: number | null
  target_founder_age_min: number | null
  target_founder_age_max: number | null
  target_age_min: number | null
  target_age_max: number | null
  target_household_types: string[] | null
  target_income_levels: string[] | null
  target_employment_status: string[] | null
  benefit_categories: string[] | null
  extraction_confidence: Record<string, number> | null
}

interface UpdatePayload {
  id: string
  target_regions: string[]
  target_business_types: string[]
  target_employee_min: number | null
  target_employee_max: number | null
  target_revenue_min: number | null
  target_revenue_max: number | null
  target_business_age_min: number | null
  target_business_age_max: number | null
  target_founder_age_min: number | null
  target_founder_age_max: number | null
  target_age_min: number | null
  target_age_max: number | null
  target_household_types: string[]
  target_income_levels: string[]
  target_employment_status: string[]
  benefit_categories: string[]
  extraction_confidence: Record<string, number>
}

function arraysEqual(a: unknown[] | null, b: unknown[]): boolean {
  if (!a && b.length === 0) return true
  if (!a) return false
  if (a.length !== b.length) return false
  const sa = [...a].sort()
  const sb = [...b].sort()
  return sa.every((v, i) => v === sb[i])
}

function numsEqual(a: number | null, b: number | null): boolean {
  return a === b
}

async function main() {
  console.log('=== Retag All Dimensions ===')
  console.log('Loading all active supports...')

  const PAGE_SIZE = 1000
  const allRows: SupportRow[] = []
  let from = 0

  while (true) {
    const { data, error } = await supabase
      .from('supports')
      .select('id, title, raw_eligibility_text, raw_preference_text, raw_exclusion_text, target_regions, target_business_types, target_employee_min, target_employee_max, target_revenue_min, target_revenue_max, target_business_age_min, target_business_age_max, target_founder_age_min, target_founder_age_max, target_age_min, target_age_max, target_household_types, target_income_levels, target_employment_status, benefit_categories, extraction_confidence')
      .eq('is_active', true)
      .range(from, from + PAGE_SIZE - 1)

    if (error) throw error
    if (!data || data.length === 0) break
    allRows.push(...(data as SupportRow[]))
    if (data.length < PAGE_SIZE) break
    from += PAGE_SIZE
  }

  console.log(`Loaded ${allRows.length} supports`)

  const updates: UpdatePayload[] = []
  let changedCount = 0

  for (const row of allRows) {
    const texts = [row.raw_eligibility_text, row.raw_preference_text, row.raw_exclusion_text].filter(Boolean) as string[]
    const result = extractEligibility(texts, row.title)

    // 변경 여부 확인
    const changed =
      !arraysEqual(row.target_regions, result.regions) ||
      !arraysEqual(row.target_business_types, result.businessTypes) ||
      !numsEqual(row.target_employee_min, result.employeeMin) ||
      !numsEqual(row.target_employee_max, result.employeeMax) ||
      !numsEqual(row.target_revenue_min, result.revenueMin) ||
      !numsEqual(row.target_revenue_max, result.revenueMax) ||
      !numsEqual(row.target_business_age_min, result.businessAgeMinMonths) ||
      !numsEqual(row.target_business_age_max, result.businessAgeMaxMonths) ||
      !numsEqual(row.target_founder_age_min, result.founderAgeMin) ||
      !numsEqual(row.target_founder_age_max, result.founderAgeMax) ||
      !numsEqual(row.target_age_min, result.ageMin) ||
      !numsEqual(row.target_age_max, result.ageMax) ||
      !arraysEqual(row.target_household_types, result.householdTypes) ||
      !arraysEqual(row.target_income_levels, result.incomeLevels) ||
      !arraysEqual(row.target_employment_status, result.employmentStatus) ||
      !arraysEqual(row.benefit_categories, result.benefitCategories)

    if (changed) {
      updates.push({
        id: row.id,
        target_regions: result.regions,
        target_business_types: result.businessTypes,
        target_employee_min: result.employeeMin,
        target_employee_max: result.employeeMax,
        target_revenue_min: result.revenueMin,
        target_revenue_max: result.revenueMax,
        target_business_age_min: result.businessAgeMinMonths,
        target_business_age_max: result.businessAgeMaxMonths,
        target_founder_age_min: result.founderAgeMin,
        target_founder_age_max: result.founderAgeMax,
        target_age_min: result.ageMin,
        target_age_max: result.ageMax,
        target_household_types: result.householdTypes,
        target_income_levels: result.incomeLevels,
        target_employment_status: result.employmentStatus,
        benefit_categories: result.benefitCategories,
        extraction_confidence: result.confidence as unknown as Record<string, number>,
      })
      changedCount++
    }
  }

  console.log(`\nFound ${changedCount} supports with changed extraction data out of ${allRows.length} total`)

  // 배치 업데이트
  const BATCH_SIZE = 50
  let updated = 0

  for (let i = 0; i < updates.length; i += BATCH_SIZE) {
    const batch = updates.slice(i, i + BATCH_SIZE)
    await Promise.all(
      batch.map(u => {
        const { id, ...payload } = u
        return supabase.from('supports').update(payload).eq('id', id)
      })
    )
    updated += batch.length
    if (updated % 200 === 0 || updated === updates.length) {
      console.log(`  Updated ${updated}/${updates.length}`)
    }
  }

  console.log(`\nDone: ${updated} supports updated`)

  // 통계 출력
  const stats = {
    regionsChanged: 0,
    businessTypesChanged: 0,
    employeeChanged: 0,
    revenueChanged: 0,
    businessAgeChanged: 0,
    founderAgeChanged: 0,
    ageChanged: 0,
    householdChanged: 0,
    incomeChanged: 0,
    employmentChanged: 0,
    categoriesChanged: 0,
  }

  for (let i = 0; i < updates.length; i++) {
    const row = allRows.find(r => r.id === updates[i].id)!
    const u = updates[i]
    if (!arraysEqual(row.target_regions, u.target_regions)) stats.regionsChanged++
    if (!arraysEqual(row.target_business_types, u.target_business_types)) stats.businessTypesChanged++
    if (!numsEqual(row.target_employee_min, u.target_employee_min) || !numsEqual(row.target_employee_max, u.target_employee_max)) stats.employeeChanged++
    if (!numsEqual(row.target_revenue_min, u.target_revenue_min) || !numsEqual(row.target_revenue_max, u.target_revenue_max)) stats.revenueChanged++
    if (!numsEqual(row.target_business_age_min, u.target_business_age_min) || !numsEqual(row.target_business_age_max, u.target_business_age_max)) stats.businessAgeChanged++
    if (!numsEqual(row.target_founder_age_min, u.target_founder_age_min) || !numsEqual(row.target_founder_age_max, u.target_founder_age_max)) stats.founderAgeChanged++
    if (!numsEqual(row.target_age_min, u.target_age_min) || !numsEqual(row.target_age_max, u.target_age_max)) stats.ageChanged++
    if (!arraysEqual(row.target_household_types, u.target_household_types)) stats.householdChanged++
    if (!arraysEqual(row.target_income_levels, u.target_income_levels)) stats.incomeChanged++
    if (!arraysEqual(row.target_employment_status, u.target_employment_status)) stats.employmentChanged++
    if (!arraysEqual(row.benefit_categories, u.benefit_categories)) stats.categoriesChanged++
  }

  console.log('\n=== Change Statistics ===')
  console.log(`  Regions:          ${stats.regionsChanged}`)
  console.log(`  Business Types:   ${stats.businessTypesChanged}`)
  console.log(`  Employee:         ${stats.employeeChanged}`)
  console.log(`  Revenue:          ${stats.revenueChanged}`)
  console.log(`  Business Age:     ${stats.businessAgeChanged}`)
  console.log(`  Founder Age:      ${stats.founderAgeChanged}`)
  console.log(`  Age:              ${stats.ageChanged}`)
  console.log(`  Household:        ${stats.householdChanged}`)
  console.log(`  Income:           ${stats.incomeChanged}`)
  console.log(`  Employment:       ${stats.employmentChanged}`)
  console.log(`  Categories:       ${stats.categoriesChanged}`)
}

main().catch(console.error)
