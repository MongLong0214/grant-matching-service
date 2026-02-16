import { SEED_SUPPORTS } from '@/lib/seed-data'
import type { Support, MatchedScore, UserInput, Diagnosis } from '@/types'

const isSupabaseConfigured = () =>
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

/**
 * 매칭용 지원금 목록 조회 (모든 활성 소스에서 조회)
 * 진단 시 매칭 알고리즘에서 사용
 */
export async function getActiveSupports(): Promise<Support[]> {
  if (!isSupabaseConfigured()) {
    return SEED_SUPPORTS.filter((s) => s.isActive)
  }

  const { createClient } = await import('@/lib/supabase/server')
  const { mapSupportRows } = await import('@/lib/supabase/mappers')
  const supabase = await createClient()

  const today = new Date().toISOString().split('T')[0]
  const { data: rows, error } = await supabase
    .from('supports')
    .select('*')
    .eq('is_active', true)
    .or(`end_date.is.null,end_date.gte.${today}`)

  if (error) throw error
  return mapSupportRows(rows || [])
}

/**
 * 전체 지원사업 목록 페이지네이션 조회
 * 기업마당 API 데이터 포함
 */
export async function browseSupports(options: {
  page?: number
  perPage?: number
  category?: string
  activeOnly?: boolean
} = {}): Promise<{ data: Support[]; total: number }> {
  const { page = 1, perPage = 20, category, activeOnly = true } = options

  if (!isSupabaseConfigured()) {
    let filtered = SEED_SUPPORTS.filter((s) => s.isActive)
    if (category) filtered = filtered.filter((s) => s.category === category)
    const start = (page - 1) * perPage
    return { data: filtered.slice(start, start + perPage), total: filtered.length }
  }

  const { createClient } = await import('@/lib/supabase/server')
  const { mapSupportRows } = await import('@/lib/supabase/mappers')
  const supabase = await createClient()

  const from = (page - 1) * perPage
  const to = from + perPage - 1

  let query = supabase
    .from('supports')
    .select('*', { count: 'exact' })
    .eq('is_active', true)
    .order('end_date', { ascending: false, nullsFirst: true })
    .range(from, to)

  if (activeOnly) {
    const today = new Date().toISOString().split('T')[0]
    query = query.or(`end_date.is.null,end_date.gte.${today}`)
  }

  if (category) {
    query = query.eq('category', category)
  }

  const { data: rows, error, count } = await query

  if (error) throw error
  return { data: mapSupportRows(rows || []), total: count ?? 0 }
}

/**
 * 지원금 ID 목록으로 조회
 */
export async function getSupportsByIds(ids: string[]): Promise<Support[]> {
  if (ids.length === 0) return []

  if (!isSupabaseConfigured()) {
    return SEED_SUPPORTS.filter((s) => ids.includes(s.id))
  }

  const { createClient } = await import('@/lib/supabase/server')
  const { mapSupportRows } = await import('@/lib/supabase/mappers')
  const supabase = await createClient()

  // PostgREST URL 길이 제한으로 배치 처리 (UUID 100개씩)
  const CHUNK_SIZE = 100
  const chunks: string[][] = []
  for (let i = 0; i < ids.length; i += CHUNK_SIZE) {
    chunks.push(ids.slice(i, i + CHUNK_SIZE))
  }

  const results = await Promise.all(
    chunks.map(async (chunk) => {
      const { data: rows, error } = await supabase
        .from('supports')
        .select('*')
        .in('id', chunk)
      if (error) throw error
      return rows || []
    })
  )

  const allRows = results.flat()
  return mapSupportRows(allRows)
}

// In-memory store for dev mode diagnoses (bounded to prevent memory leaks)
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
      base.employeeCount = input.employeeCount
      base.annualRevenue = input.annualRevenue
      base.businessAge = input.businessAge
      base.founderAge = input.founderAge
    } else {
      base.ageGroup = input.ageGroup
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
