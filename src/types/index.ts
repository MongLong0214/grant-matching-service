export type SupportCategory =
  | "금융"
  | "기술"
  | "인력"
  | "수출"
  | "내수"
  | "창업"
  | "경영"
  | "기타"

export interface Support {
  id: string
  title: string
  organization: string
  category: SupportCategory
  startDate: string | null
  endDate: string | null
  detailUrl: string
  targetRegions: string[] | null
  targetBusinessTypes: string[] | null
  targetEmployeeMin: number | null
  targetEmployeeMax: number | null
  targetRevenueMin: number | null
  targetRevenueMax: number | null
  targetBusinessAgeMin: number | null
  targetBusinessAgeMax: number | null
  amount: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Diagnosis {
  id: string
  businessType: string
  region: string
  employeeCount: number
  annualRevenue: number
  businessStartDate: string
  email: string | null
  matchedSupportIds: string[]
  matchedCount: number
  createdAt: string
}

export interface DiagnoseFormData {
  businessType: string
  region: string
  employeeCount: number
  annualRevenue: number
  businessStartDate: string
  email?: string
}
