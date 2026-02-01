import { SEED_SUPPORTS } from '@/lib/seed-data'
import type { Support, DiagnoseFormData } from '@/types'

const isSupabaseConfigured = () =>
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

/**
 * 매칭용 지원금 목록 조회 (상세 자격조건이 있는 시드 데이터만)
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
    .eq('source', 'seed')
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

  const { data: rows, error } = await supabase
    .from('supports')
    .select('*')
    .in('id', ids)

  if (error) throw error
  return mapSupportRows(rows || [])
}

// In-memory store for dev mode diagnoses (bounded to prevent memory leaks)
const MAX_DEV_DIAGNOSES = 1000
const devDiagnoses = new Map<string, {
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
}>()

/**
 * 진단 결과 저장
 * Supabase 미설정 시 인메모리 저장
 */
export async function saveDiagnosis(input: DiagnoseFormData, matchedSupports: Support[]): Promise<string> {
  const id = crypto.randomUUID()

  if (!isSupabaseConfigured()) {
    // Evict oldest entry if at capacity
    if (devDiagnoses.size >= MAX_DEV_DIAGNOSES) {
      const oldestKey = devDiagnoses.keys().next().value
      if (oldestKey) devDiagnoses.delete(oldestKey)
    }
    devDiagnoses.set(id, {
      id,
      businessType: input.businessType,
      region: input.region,
      employeeCount: input.employeeCount,
      annualRevenue: input.annualRevenue,
      businessStartDate: input.businessStartDate,
      email: input.email || null,
      matchedSupportIds: matchedSupports.map((s) => s.id),
      matchedCount: matchedSupports.length,
      createdAt: new Date().toISOString(),
    })
    return id
  }

  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('diagnoses')
    .insert({
      business_type: input.businessType,
      region: input.region,
      employee_count: input.employeeCount,
      annual_revenue: input.annualRevenue,
      business_start_date: input.businessStartDate,
      email: input.email || null,
      matched_support_ids: matchedSupports.map((s) => s.id),
      matched_count: matchedSupports.length,
    })
    .select()
    .single()

  if (error) throw error
  return data.id
}

/**
 * 진단 결과 조회
 */
export async function getDiagnosis(id: string) {
  if (!isSupabaseConfigured()) {
    return devDiagnoses.get(id) || null
  }

  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('diagnoses')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) return null

  return {
    id: data.id,
    businessType: data.business_type,
    region: data.region,
    employeeCount: data.employee_count,
    annualRevenue: data.annual_revenue,
    businessStartDate: data.business_start_date,
    email: data.email,
    matchedSupportIds: data.matched_support_ids || [],
    matchedCount: data.matched_count,
    createdAt: data.created_at,
  }
}
