import type { Support, MatchedScore, UserInput, Diagnosis } from '@/types'

const isSupabaseConfigured = () =>
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

// dev 모드 진단 인메모리 저장소 (메모리 누수 방지를 위해 크기 제한)
const MAX_DEV_DIAGNOSES = 1000
const devDiagnoses = new Map<string, Diagnosis>()

/**
 * 진단 결과 저장 (듀얼 트랙: 개인/사업자)
 * Supabase 미설정 시 인메모리 저장
 */
export async function saveDiagnosis(
  input: UserInput,
  matchedSupports: Support[],
  matchedScores?: MatchedScore[],
): Promise<string> {
  const id = crypto.randomUUID()
  const now = new Date().toISOString()
  const supportIds = matchedSupports.map((s) => s.id)

  if (!isSupabaseConfigured()) {
    if (devDiagnoses.size >= MAX_DEV_DIAGNOSES) {
      const oldestKey = devDiagnoses.keys().next().value
      if (oldestKey) devDiagnoses.delete(oldestKey)
    }

    const base: Diagnosis = {
      id,
      userType: input.userType,
      businessType: null,
      region: input.region,
      subRegion: null,
      employeeCount: null,
      annualRevenue: null,
      businessAge: null,
      founderAge: null,
      ageGroup: null,
      gender: null,
      householdType: null,
      incomeLevel: null,
      employmentStatus: null,
      interestCategories: null,
      matchedSupportIds: supportIds,
      matchedCount: matchedSupports.length,
      matchedScores: matchedScores ?? null,
      createdAt: now,
    }

    if (input.userType === 'business') {
      base.businessType = input.businessType
      base.subRegion = input.subRegion ?? null
      base.employeeCount = input.employeeCount
      base.annualRevenue = input.annualRevenue
      base.businessAge = input.businessAge
      base.founderAge = input.founderAge
    } else {
      base.ageGroup = input.ageGroup
      base.subRegion = input.subRegion ?? null
      base.gender = input.gender
      base.householdType = input.householdType
      base.incomeLevel = input.incomeLevel
      base.employmentStatus = input.employmentStatus
      base.interestCategories = input.interestCategories
    }

    devDiagnoses.set(id, base)
    return id
  }

  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()

  const commonPayload = {
    region: input.region,
    sub_region: input.subRegion ?? null,
    matched_support_ids: supportIds,
    matched_count: matchedSupports.length,
    matched_scores: matchedScores ?? null,
    user_type: input.userType,
  }

  const insertPayload = input.userType === 'business'
    ? {
        ...commonPayload,
        business_type: input.businessType,
        employee_count: input.employeeCount,
        annual_revenue: input.annualRevenue,
        business_age: input.businessAge,
        founder_age: input.founderAge,
      }
    : {
        ...commonPayload,
        age_group: input.ageGroup,
        gender: input.gender,
        household_type: input.householdType,
        income_level: input.incomeLevel,
        employment_status: input.employmentStatus,
        interest_categories: input.interestCategories,
      }

  const { data, error } = await supabase
    .from('diagnoses')
    .insert(insertPayload)
    .select()
    .single()

  if (error) throw error
  return data.id
}

/**
 * 진단 결과 조회 (듀얼 트랙)
 */
export async function getDiagnosis(id: string): Promise<Diagnosis | null> {
  if (!isSupabaseConfigured()) {
    return devDiagnoses.get(id) ?? null
  }

  const { createClient } = await import('@/lib/supabase/server')
  const { mapDiagnosisRow } = await import('@/lib/supabase/mappers')
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('diagnoses')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) return null

  return mapDiagnosisRow(data)
}
