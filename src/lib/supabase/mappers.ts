import type { Diagnosis, Support } from "@/types"
import type { Database } from "./types"

type SupportRow = Database["public"]["Tables"]["supports"]["Row"]
type DiagnosisRow = Database["public"]["Tables"]["diagnoses"]["Row"]

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
    targetFounderAgeMin: row.target_founder_age_min,
    targetFounderAgeMax: row.target_founder_age_max,
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
    serviceType: (row.service_type as Support["serviceType"]) ?? 'unknown',
    targetAgeMin: row.target_age_min,
    targetAgeMax: row.target_age_max,
    targetHouseholdTypes: row.target_household_types,
    targetIncomeLevels: row.target_income_levels,
    targetEmploymentStatus: row.target_employment_status,
    benefitCategories: row.benefit_categories,
  }
}

/**
 * DB 진단 행을 프론트엔드 Diagnosis 타입으로 변환
 * snake_case → camelCase 매핑
 */
export function mapDiagnosisRow(row: DiagnosisRow): Diagnosis {
  return {
    id: row.id,
    userType: (row.user_type as Diagnosis["userType"]) ?? 'business',
    businessType: row.business_type,
    region: row.region,
    employeeCount: row.employee_count,
    annualRevenue: row.annual_revenue,
    businessAge: row.business_age,
    founderAge: row.founder_age,
    ageGroup: row.age_group,
    gender: row.gender,
    householdType: row.household_type,
    incomeLevel: row.income_level,
    employmentStatus: row.employment_status,
    interestCategories: row.interest_categories,
    matchedSupportIds: row.matched_support_ids,
    matchedCount: row.matched_count,
    matchedScores: row.matched_scores,
    createdAt: row.created_at,
  }
}

/**
 * 여러 DB 행을 Support 배열로 변환
 */
export function mapSupportRows(rows: SupportRow[]): Support[] {
  return rows.map(mapSupportRow)
}
