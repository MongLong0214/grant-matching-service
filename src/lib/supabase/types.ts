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
          target_business_types: string[] | null
          target_employee_min: number | null
          target_employee_max: number | null
          target_revenue_min: number | null
          target_revenue_max: number | null
          target_business_age_min: number | null
          target_business_age_max: number | null
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
        }
        Insert: Omit<Database["public"]["Tables"]["supports"]["Row"], "id" | "created_at" | "updated_at" | "is_active" | "source" | "raw_eligibility_text" | "raw_exclusion_text" | "raw_preference_text" | "extraction_confidence" | "external_id"> & {
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
        }
        Update: Partial<Database["public"]["Tables"]["supports"]["Row"]>
      }
      diagnoses: {
        Row: {
          id: string
          business_type: string
          region: string
          employee_count: number
          annual_revenue: number
          business_start_date: string
          email: string | null
          matched_support_ids: string[]
          matched_count: number
          created_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["diagnoses"]["Row"], "id" | "created_at" | "matched_count"> & {
          id?: string
          created_at?: string
          matched_count?: number
        }
        Update: Partial<Database["public"]["Tables"]["diagnoses"]["Row"]>
      }
    }
  }
}
