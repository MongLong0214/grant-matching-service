import type { MatchTier } from '@/types'

/** DB matched_scores JSONB 컬럼의 개별 요소 타입 */
export interface MatchedScoreJson {
  supportId: string
  score: number
  tier: MatchTier
  breakdown: {
    region: number
    businessType?: number
    employee?: number
    revenue?: number
    businessAge?: number
    founderAge?: number
    age?: number
    householdType?: number
    incomeLevel?: number
    employmentStatus?: number
  }
  scores?: {
    region: number
    businessType?: number
    employee?: number
    revenue?: number
    businessAge?: number
    founderAge?: number
    age?: number
    householdType?: number
    incomeLevel?: number
    employmentStatus?: number
    confidence: number
    coverage?: number
    weighted: number
  }
}

/**
 * Supabase 데이터베이스 타입 정의
 * snake_case DB 컬럼명과 TypeScript 타입 매핑
 */
export interface Database {
  public: {
    Tables: {
      supports: {
        Row: {
          id: string
          title: string
          organization: string
          category: string
          start_date: string | null
          end_date: string | null
          detail_url: string
          target_regions: string[] | null
          target_sub_regions: string[] | null
          target_business_types: string[] | null
          target_employee_min: number | null
          target_employee_max: number | null
          target_revenue_min: number | null
          target_revenue_max: number | null
          target_business_age_min: number | null
          target_business_age_max: number | null
          target_founder_age_min: number | null
          target_founder_age_max: number | null
          amount: string | null
          is_active: boolean
          source: string
          raw_eligibility_text: string | null
          raw_exclusion_text: string | null
          raw_preference_text: string | null
          extraction_confidence: Record<string, number> | null
          external_id: string | null
          created_at: string
          updated_at: string
          service_type: string
          target_age_min: number | null
          target_age_max: number | null
          target_household_types: string[] | null
          target_income_levels: string[] | null
          target_employment_status: string[] | null
          benefit_categories: string[] | null
          region_scope: 'national' | 'regional' | 'unknown'
        }
        Insert: Omit<Database["public"]["Tables"]["supports"]["Row"], "id" | "created_at" | "updated_at" | "is_active" | "source" | "raw_eligibility_text" | "raw_exclusion_text" | "raw_preference_text" | "extraction_confidence" | "external_id" | "target_founder_age_min" | "target_founder_age_max" | "target_sub_regions" | "service_type" | "target_age_min" | "target_age_max" | "target_household_types" | "target_income_levels" | "target_employment_status" | "benefit_categories" | "region_scope"> & {
          id?: string
          created_at?: string
          updated_at?: string
          is_active?: boolean
          source?: string
          raw_eligibility_text?: string | null
          raw_exclusion_text?: string | null
          raw_preference_text?: string | null
          extraction_confidence?: Record<string, number> | null
          external_id?: string | null
          target_founder_age_min?: number | null
          target_founder_age_max?: number | null
          target_sub_regions?: string[] | null
          service_type?: string
          target_age_min?: number | null
          target_age_max?: number | null
          target_household_types?: string[] | null
          target_income_levels?: string[] | null
          target_employment_status?: string[] | null
          benefit_categories?: string[] | null
          region_scope?: 'national' | 'regional' | 'unknown'
        }
        Update: Partial<Database["public"]["Tables"]["supports"]["Row"]>
      }
      diagnoses: {
        Row: {
          id: string
          user_type: string
          business_type: string | null
          region: string
          sub_region: string | null
          employee_count: number | null
          annual_revenue: number | null
          business_start_date: string | null
          business_age: number | null
          founder_age: number | null

          age_group: string | null
          gender: string | null
          household_type: string | null
          income_level: string | null
          employment_status: string | null
          interest_categories: string[] | null
          matched_support_ids: string[]
          matched_count: number
          matched_scores: MatchedScoreJson[] | null
          created_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["diagnoses"]["Row"], "id" | "created_at" | "matched_count" | "matched_scores" | "business_start_date" | "user_type" | "age_group" | "gender" | "household_type" | "income_level" | "employment_status" | "interest_categories" | "sub_region"> & {
          id?: string
          created_at?: string
          matched_count?: number
          matched_scores?: MatchedScoreJson[] | null
          business_start_date?: string | null
          user_type?: string
          age_group?: string | null
          gender?: string | null
          household_type?: string | null
          income_level?: string | null
          employment_status?: string | null
          interest_categories?: string[] | null
          sub_region?: string | null
        }
        Update: Partial<Database["public"]["Tables"]["diagnoses"]["Row"]>
      }
    }
  }
}
