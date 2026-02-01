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
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["supports"]["Row"], "id" | "created_at" | "updated_at" | "is_active" | "source"> & {
          id?: string
          created_at?: string
          updated_at?: string
          is_active?: boolean
          source?: string
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
