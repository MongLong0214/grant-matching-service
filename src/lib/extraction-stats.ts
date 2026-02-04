import { createClient } from '@supabase/supabase-js'

interface ExtractionStatsResult {
  totalActive: number
  bySource: Record<string, {
    count: number
    withRegions: number
    withBusinessTypes: number
    withEmployeeRange: number
    withRevenueRange: number
    withBusinessAge: number
    avgConfidence: number
  }>
  overall: {
    withRegions: number
    withBusinessTypes: number
    withEmployeeRange: number
    withRevenueRange: number
    withBusinessAge: number
    avgConfidence: number
    coveragePercent: number
  }
}

/**
 * Record extraction quality statistics across all active supports.
 * Logs to sync_logs with source='extraction-stats'.
 */
export async function recordExtractionStats(): Promise<ExtractionStatsResult> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const supabase = createClient(supabaseUrl, serviceKey)

  const { data: supports } = await supabase
    .from('supports')
    .select('source, target_regions, target_business_types, target_employee_min, target_employee_max, target_revenue_min, target_revenue_max, target_business_age_min, target_business_age_max, extraction_confidence')
    .eq('is_active', true)

  if (!supports || supports.length === 0) {
    return {
      totalActive: 0,
      bySource: {},
      overall: {
        withRegions: 0,
        withBusinessTypes: 0,
        withEmployeeRange: 0,
        withRevenueRange: 0,
        withBusinessAge: 0,
        avgConfidence: 0,
        coveragePercent: 0,
      },
    }
  }

  // Group by source
  const sourceGroups: Record<string, typeof supports> = {}
  for (const s of supports) {
    const src = s.source || 'unknown'
    if (!sourceGroups[src]) sourceGroups[src] = []
    sourceGroups[src].push(s)
  }

  function calcStats(items: typeof supports) {
    if (!items) return {
      count: 0,
      withRegions: 0,
      withBusinessTypes: 0,
      withEmployeeRange: 0,
      withRevenueRange: 0,
      withBusinessAge: 0,
      avgConfidence: 0,
    }

    let withRegions = 0
    let withBusinessTypes = 0
    let withEmployeeRange = 0
    let withRevenueRange = 0
    let withBusinessAge = 0
    let totalConfidence = 0
    let confidenceCount = 0

    for (const s of items) {
      if (s.target_regions && (Array.isArray(s.target_regions) ? s.target_regions.length > 0 : true)) withRegions++
      if (s.target_business_types && (Array.isArray(s.target_business_types) ? s.target_business_types.length > 0 : true)) withBusinessTypes++
      if (s.target_employee_min !== null || s.target_employee_max !== null) withEmployeeRange++
      if (s.target_revenue_min !== null || s.target_revenue_max !== null) withRevenueRange++
      if (s.target_business_age_min !== null || s.target_business_age_max !== null) withBusinessAge++

      if (s.extraction_confidence && typeof s.extraction_confidence === 'object') {
        const conf = s.extraction_confidence as Record<string, number>
        const values = Object.values(conf).filter((v): v is number => typeof v === 'number')
        if (values.length > 0) {
          totalConfidence += values.reduce((a, b) => a + b, 0) / values.length
          confidenceCount++
        }
      }
    }

    return {
      count: items.length,
      withRegions,
      withBusinessTypes,
      withEmployeeRange,
      withRevenueRange,
      withBusinessAge,
      avgConfidence: confidenceCount > 0 ? Math.round((totalConfidence / confidenceCount) * 100) / 100 : 0,
    }
  }

  const bySource: ExtractionStatsResult['bySource'] = {}
  for (const [src, items] of Object.entries(sourceGroups)) {
    bySource[src] = calcStats(items)
  }

  const overallStats = calcStats(supports)
  const hasAnyData = (s: typeof supports[0]) =>
    (s.target_regions && (Array.isArray(s.target_regions) ? s.target_regions.length > 0 : true)) ||
    (s.target_business_types && (Array.isArray(s.target_business_types) ? s.target_business_types.length > 0 : true)) ||
    s.target_employee_min !== null || s.target_employee_max !== null ||
    s.target_revenue_min !== null || s.target_revenue_max !== null ||
    s.target_business_age_min !== null || s.target_business_age_max !== null

  const withAnyCriteria = supports.filter(hasAnyData).length
  const coveragePercent = supports.length > 0 ? Math.round((withAnyCriteria / supports.length) * 1000) / 10 : 0

  const result: ExtractionStatsResult = {
    totalActive: supports.length,
    bySource,
    overall: {
      ...overallStats,
      coveragePercent,
    },
  }

  // Log to sync_logs
  await supabase.from('sync_logs').insert({
    source: 'extraction-stats',
    status: 'completed',
    completed_at: new Date().toISOString(),
    programs_fetched: supports.length,
    programs_inserted: withAnyCriteria,
    metadata: result,
  })

  return result
}
