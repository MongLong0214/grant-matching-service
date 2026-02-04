import { extractRegions, CTPV_TO_REGION } from './region-dictionary'
import { extractBusinessTypes } from './business-type-dictionary'
import { extractEmployeeRange } from './employee-patterns'
import { extractRevenueRange } from './revenue-patterns'
import { extractBusinessAge } from './business-age-patterns'

export interface ExtractionResult {
  regions: string[]
  businessTypes: string[]
  employeeMin: number | null
  employeeMax: number | null
  revenueMin: number | null
  revenueMax: number | null
  businessAgeMinMonths: number | null
  businessAgeMaxMonths: number | null
  confidence: ExtractionConfidence
}

export interface ExtractionConfidence {
  regions: number
  businessTypes: number
  employee: number
  revenue: number
  businessAge: number
}

/**
 * Extract structured eligibility criteria from Korean free-text fields.
 * Combines multiple text sources (eligibility, exclusion, content) for best coverage.
 * NO AI/LLM - pure regex + keyword dictionary extraction.
 */
export function extractEligibility(texts: string[]): ExtractionResult {
  const combined = texts.filter(Boolean).join(' ')

  const regions = extractRegions(combined)
  const businessTypes = extractBusinessTypes(combined)
  const { employeeMin, employeeMax } = extractEmployeeRange(combined)
  const { revenueMin, revenueMax } = extractRevenueRange(combined)
  const { businessAgeMinMonths, businessAgeMaxMonths } = extractBusinessAge(combined)

  return {
    regions,
    businessTypes,
    employeeMin,
    employeeMax,
    revenueMin,
    revenueMax,
    businessAgeMinMonths,
    businessAgeMaxMonths,
    confidence: {
      regions: regions.length > 0 ? 0.9 : 0.1,
      businessTypes: businessTypes.length > 0 ? 0.7 : 0.1,
      employee: (employeeMin !== null || employeeMax !== null) ? 0.8 : 0.1,
      revenue: (revenueMin !== null || revenueMax !== null) ? 0.8 : 0.1,
      businessAge: (businessAgeMinMonths !== null || businessAgeMaxMonths !== null) ? 0.85 : 0.1,
    },
  }
}

export { extractRegions, CTPV_TO_REGION } from './region-dictionary'
export { extractBusinessTypes } from './business-type-dictionary'
export { extractEmployeeRange } from './employee-patterns'
export { extractRevenueRange } from './revenue-patterns'
export { extractBusinessAge } from './business-age-patterns'
