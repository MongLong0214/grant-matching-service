import type { Support } from "@/types"
import type { Database } from "./types"

type SupportRow = Database["public"]["Tables"]["supports"]["Row"]

/**
 * DB 지원금 행을 프론트엔드 Support 타입으로 변환
 * snake_case → camelCase 매핑
 */
export function mapSupportRow(row: SupportRow): Support {
  return {
    id: row.id,
    title: row.title,
    organization: row.organization,
    category: row.category as Support["category"],
    startDate: row.start_date,
    endDate: row.end_date,
    detailUrl: row.detail_url,
    targetRegions: row.target_regions,
    targetBusinessTypes: row.target_business_types,
    targetEmployeeMin: row.target_employee_min,
    targetEmployeeMax: row.target_employee_max,
    targetRevenueMin: row.target_revenue_min,
    targetRevenueMax: row.target_revenue_max,
    targetBusinessAgeMin: row.target_business_age_min,
    targetBusinessAgeMax: row.target_business_age_max,
    amount: row.amount,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    source: row.source,
    rawEligibilityText: row.raw_eligibility_text,
    rawExclusionText: row.raw_exclusion_text,
    rawPreferenceText: row.raw_preference_text,
    extractionConfidence: row.extraction_confidence,
    externalId: row.external_id,
  }
}

/**
 * 여러 DB 행을 Support 배열로 변환
 */
export function mapSupportRows(rows: SupportRow[]): Support[] {
  return rows.map(mapSupportRow)
}
