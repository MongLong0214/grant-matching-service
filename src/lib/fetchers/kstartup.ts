import { extractEligibility } from '@/lib/extraction'
import { fetchKStartup } from './kstartup-helpers'
import {
  createSyncClient, startSyncLog, completeSyncLog, failSyncLog,
  batchUpsertSupports, parseDate, mapCategory,
} from './sync-helpers'

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

  const supabase = createSyncClient()
  const logId = await startSyncLog(supabase, 'kstartup')
  let apiCallsUsed = 0

  try {
    const result = await fetchKStartup(apiKey)
    const items = result.items
    apiCallsUsed = result.apiCallsUsed

    let inserted = 0
    let skipped = 0

    const records: Record<string, unknown>[] = []
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
      const extraction = extractEligibility(eligibilityTexts, title, item.jrsdInsttNm || item.excInsttNm)

      records.push({
        title,
        organization: item.jrsdInsttNm || item.excInsttNm || '미상',
        category: mapCategory(item.bizPrchPtrnCdNm, item.sprtField),
        start_date: null,
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
        amount: null,
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
        region_scope: extraction.regionScope,
      })
    }

    const batchResult = await batchUpsertSupports(supabase, records, 'K-Startup')
    inserted = batchResult.inserted
    skipped += batchResult.skipped

    await completeSyncLog(supabase, logId, { fetched: items.length, inserted, updated: 0, skipped, apiCallsUsed })
    return { fetched: items.length, inserted, updated: 0, skipped, apiCallsUsed }
  } catch (error) {
    await failSyncLog(supabase, logId, error, apiCallsUsed)
    throw error
  }
}
