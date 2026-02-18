export type SupportCategory =
  | "금융"
  | "기술"
  | "인력"
  | "수출"
  | "내수"
  | "창업"
  | "경영"
  | "복지"
  | "주거"
  | "육아"
  | "교육"
  | "건강"
  | "고용"
  | "생활"
  | "기타"

export type ServiceType = 'business' | 'personal' | 'both' | 'unknown'
export type RegionScope = 'national' | 'regional' | 'unknown'
export type UserType = 'personal' | 'business'

export interface Support {
  id: string
  title: string
  organization: string
  category: SupportCategory
  startDate: string | null
  endDate: string | null
  detailUrl: string
  targetRegions: string[] | null
  targetSubRegions?: string[] | null
  targetBusinessTypes: string[] | null
  targetEmployeeMin: number | null
  targetEmployeeMax: number | null
  targetRevenueMin: number | null
  targetRevenueMax: number | null
  targetBusinessAgeMin: number | null
  targetBusinessAgeMax: number | null
  targetFounderAgeMin: number | null
  targetFounderAgeMax: number | null
  amount: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  source?: string
  rawEligibilityText?: string | null
  rawExclusionText?: string | null
  rawPreferenceText?: string | null
  extractionConfidence?: Record<string, number> | null
  externalId?: string | null
  serviceType?: ServiceType
  targetAgeMin?: number | null
  targetAgeMax?: number | null
  targetHouseholdTypes?: string[] | null
  targetIncomeLevels?: string[] | null
  targetEmploymentStatus?: string[] | null
  benefitCategories?: string[] | null
  regionScope?: RegionScope
}

export type MatchTier = 'tailored' | 'recommended' | 'exploratory'

export interface MatchedScore {
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


export interface Diagnosis {
  id: string
  userType?: UserType
  businessType: string | null
  region: string
  subRegion?: string | null
  employeeCount: number | null
  annualRevenue: number | null
  businessAge: number | null
  founderAge: number | null
  ageGroup?: string | null
  gender?: string | null
  householdType?: string | null
  incomeLevel?: string | null
  employmentStatus?: string | null
  interestCategories?: string[] | null
  matchedSupportIds: string[]
  matchedCount: number
  matchedScores?: MatchedScore[] | null
  createdAt: string
}

export interface DiagnoseFormData {
  businessType: string
  region: string
  subRegion?: string
  employeeCount: number
  annualRevenue: number
  businessAge: number
  founderAge: number
}

export interface PersonalFormData {
  ageGroup: string
  gender: string
  region: string
  subRegion?: string
  householdType: string
  incomeLevel: string
  employmentStatus: string
  interestCategories: string[]
}

export type UserInput =
  | ({ userType: 'personal' } & PersonalFormData)
  | ({ userType: 'business' } & DiagnoseFormData)

export interface ScoredSupportData {
  support: Support
  score: number
  tier: string
  breakdown?: Record<string, number>
  confidence?: number
}
