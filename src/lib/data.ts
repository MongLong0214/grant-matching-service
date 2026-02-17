import type { Support } from '@/types'
export { saveDiagnosis, getDiagnosis } from '@/lib/diagnosis'

const isSupabaseConfigured = () =>
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

/**
 * 매칭용 지원금 목록 조회 (모든 활성 소스에서 조회)
 * 진단 시 매칭 알고리즘에서 사용
 */
export async function getActiveSupports(): Promise<Support[]> {
  if (!isSupabaseConfigured()) {
    const { SEED_SUPPORTS } = await import('@/lib/seed-data')
    return SEED_SUPPORTS.filter((s) => s.isActive)
  }

  const { createClient } = await import('@/lib/supabase/server')
  const { mapSupportRows } = await import('@/lib/supabase/mappers')
  const supabase = await createClient()

  const today = new Date().toISOString().split('T')[0]

  // Supabase 기본 1000행 제한 → 청크 로딩으로 전체 조회
  const PAGE_SIZE = 1000
  const allRows: unknown[] = []
  let from = 0

  while (true) {
    const { data: rows, error } = await supabase
      .from('supports')
      .select('*')
      .eq('is_active', true)
      .or(`end_date.is.null,end_date.gte.${today}`)
      .range(from, from + PAGE_SIZE - 1)

    if (error) throw error
    if (!rows || rows.length === 0) break
    allRows.push(...rows)
    if (rows.length < PAGE_SIZE) break
    from += PAGE_SIZE
  }

  return mapSupportRows(allRows as Parameters<typeof mapSupportRows>[0])
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
    const { SEED_SUPPORTS } = await import('@/lib/seed-data')
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
    const { SEED_SUPPORTS } = await import('@/lib/seed-data')
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

