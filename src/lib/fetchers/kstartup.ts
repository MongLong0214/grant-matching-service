import { createClient } from '@supabase/supabase-js'
import { extractEligibility } from '@/lib/extraction'
import { fetchKStartup, mapCategory, parseDate } from './kstartup-helpers'

export { fetchKStartup }

export async function syncKStartup(): Promise<{
  fetched: number
  inserted: number
  updated: number
  skipped: number
  apiCallsUsed: number
}> {
  const apiKey = process.env.DATA_GO_KR_API_KEY
  if (!apiKey) {
    console.log('[K-Startup] DATA_GO_KR_API_KEY not set, skipping sync')
    return { fetched: 0, inserted: 0, updated: 0, skipped: 0, apiCallsUsed: 0 }
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const supabase = createClient(supabaseUrl, serviceKey)

  const { data: syncLog } = await supabase
    .from('sync_logs')
    .insert({ source: 'kstartup', status: 'running' })
    .select()
    .single()
  const logId = syncLog?.id
  let apiCallsUsed = 0

  try {
    const result = await fetchKStartup(apiKey)
    const items = result.items
    apiCallsUsed = result.apiCallsUsed

    let fetched = 0
    let skipped = 0

    for (const item of items) {
      const itemId = item.bizPblancId || item.pblancNm
      if (!itemId) { skipped++; continue }
      const externalId = `kstartup-${itemId}`

      const eligibilityTexts = [
        item.trgtJgCn,
        item.sprtCn,
        item.excptMtr,
        item.prfrCn,
      ].filter(Boolean) as string[]

      const title = item.pblancNm || item.bizPblancNm || ''
      const extraction = extractEligibility(eligibilityTexts, title)

      const record = {
        title,
        organization: item.jrsdInsttNm || item.excInsttNm || '미상',
        category: mapCategory(item.bizPrchPtrnCdNm, item.sprtField),
        start_date: null as string | null,
        end_date: parseDate(item.pblancEndDt || item.rcptEndDt),
        detail_url: item.detailUrl || `https://www.k-startup.go.kr/web/contents/bizpbanc-ongoing.do?schM=view&pbancSn=${itemId}`,
        target_regions: extraction.regions,
        target_business_types: extraction.businessTypes,
        target_employee_min: extraction.employeeMin,
        target_employee_max: extraction.employeeMax,
        target_revenue_min: extraction.revenueMin,
        target_revenue_max: extraction.revenueMax,
        target_business_age_min: extraction.businessAgeMinMonths,
        target_business_age_max: extraction.businessAgeMaxMonths,
        target_founder_age_min: extraction.founderAgeMin,
        target_founder_age_max: extraction.founderAgeMax,
        amount: null as string | null,
        is_active: true,
        source: 'kstartup',
        external_id: externalId,
        raw_eligibility_text: item.trgtJgCn || null,
        raw_exclusion_text: item.excptMtr || null,
        raw_preference_text: item.prfrCn || null,
        extraction_confidence: extraction.confidence,
        service_type: 'business',
        target_age_min: extraction.ageMin,
        target_age_max: extraction.ageMax,
        target_household_types: extraction.householdTypes.length > 0 ? extraction.householdTypes : null,
        target_income_levels: extraction.incomeLevels.length > 0 ? extraction.incomeLevels : null,
        target_employment_status: extraction.employmentStatus.length > 0 ? extraction.employmentStatus : null,
        benefit_categories: extraction.benefitCategories.length > 0 ? extraction.benefitCategories : null,
      }

      const { error } = await supabase
        .from('supports')
        .upsert(record, { onConflict: 'external_id' })

      if (error) { skipped++; continue }
      fetched++
    }

    if (logId) {
      await supabase.from('sync_logs').update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        programs_fetched: fetched,
        programs_inserted: 0,
        programs_updated: 0,
        programs_skipped: skipped,
        api_calls_used: apiCallsUsed,
      }).eq('id', logId)
    }

    return { fetched, inserted: 0, updated: 0, skipped, apiCallsUsed }
  } catch (error) {
    if (logId) {
      await supabase.from('sync_logs').update({
        status: 'failed',
        completed_at: new Date().toISOString(),
        error_message: error instanceof Error ? error.message : 'Unknown error',
        api_calls_used: apiCallsUsed,
      }).eq('id', logId)
    }
    throw error
  }
}
