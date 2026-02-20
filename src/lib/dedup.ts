import { createClient } from '@supabase/supabase-js'

// 바이그램 기반 Jaccard 유사도 (0~1)
function jaccardSimilarity(a: string, b: string): number {
  const bigramsA = new Set<string>()
  const bigramsB = new Set<string>()

  const cleanA = a.replace(/\s+/g, '').toLowerCase()
  const cleanB = b.replace(/\s+/g, '').toLowerCase()

  for (let i = 0; i < cleanA.length - 1; i++) bigramsA.add(cleanA.slice(i, i + 2))
  for (let i = 0; i < cleanB.length - 1; i++) bigramsB.add(cleanB.slice(i, i + 2))

  if (bigramsA.size === 0 || bigramsB.size === 0) return 0

  let intersection = 0
  for (const bg of bigramsA) {
    if (bigramsB.has(bg)) intersection++
  }

  const union = bigramsA.size + bigramsB.size - intersection
  return union > 0 ? intersection / union : 0
}

const SIMILARITY_THRESHOLD = 0.65

interface DedupResult {
  duplicatesFound: number
  deactivated: number
  pairs: Array<{ kept: string; removed: string; score: number }>
}

/** 제목 유사도(0.7) + 소관기관 일치(0.2) + URL 도메인 일치(0.1) 복합 점수 */
function compositeSimilarity(
  a: { title: string; organization: string; detail_url: string },
  b: { title: string; organization: string; detail_url: string },
): number {
  const titleSim = jaccardSimilarity(a.title, b.title)
  const orgMatch = a.organization.trim() === b.organization.trim() ? 1.0 : 0.0

  let urlDomainMatch = 0.0
  try {
    const domainA = new URL(a.detail_url).hostname
    const domainB = new URL(b.detail_url).hostname
    urlDomainMatch = domainA === domainB ? 1.0 : 0.0
  } catch {
    // URL 파싱 실패 시 무시
  }

  return titleSim * 0.7 + orgMatch * 0.2 + urlDomainMatch * 0.1
}

// 소스 간 중복 탐지 후 데이터 풍부도 낮은 쪽 비활성화
export async function deduplicateSupports(): Promise<DedupResult> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const supabase = createClient(supabaseUrl, serviceKey)

  // Supabase 기본 1000행 제한 → 청크 로딩으로 전체 조회
  const PAGE_SIZE = 1000
  const allRows: unknown[] = []
  let from = 0

  while (true) {
    const { data: rows, error } = await supabase
      .from('supports')
      .select('id, title, organization, detail_url, source, external_id, target_regions, target_business_types, target_employee_min, target_employee_max, target_revenue_min, target_revenue_max')
      .eq('is_active', true)
      .order('source', { ascending: true })
      .range(from, from + PAGE_SIZE - 1)

    if (error) throw error
    if (!rows || rows.length === 0) break
    allRows.push(...rows)
    if (rows.length < PAGE_SIZE) break
    from += PAGE_SIZE
  }

  const supports = allRows as Array<{
    id: string; title: string; organization: string; detail_url: string;
    source: string; external_id: string;
    target_regions: string[] | null; target_business_types: string[] | null;
    target_employee_min: number | null; target_employee_max: number | null;
    target_revenue_min: number | null; target_revenue_max: number | null;
  }>

  if (supports.length < 2) return { duplicatesFound: 0, deactivated: 0, pairs: [] }

  type SupportRow = NonNullable<typeof supports>[number]

  // non-null 타겟 필드 수로 데이터 풍부도 측정
  function richness(s: SupportRow): number {
    let score = 0
    if (s.target_regions) score++
    if (s.target_business_types) score++
    if (s.target_employee_min !== null || s.target_employee_max !== null) score++
    if (s.target_revenue_min !== null || s.target_revenue_max !== null) score++
    return score
  }

  // 타이틀 정규화: 공백/특수문자 제거 후 소문자 변환
  function normalizeTitle(title: string): string {
    return title.replace(/[\s·\-_/()[\]{}.,;:!?'"]+/g, '').toLowerCase()
  }

  // 소스별 그룹핑 (같은 소스 내는 비교 불필요)
  const bySource = new Map<string, SupportRow[]>()
  for (const s of supports) {
    const arr = bySource.get(s.source)
    if (arr) arr.push(s)
    else bySource.set(s.source, [s])
  }
  const sourceKeys = [...bySource.keys()]

  // 각 소스의 레코드를 정규화된 타이틀 첫 10글자 기준 버킷으로 분류
  const bucketsBySource = new Map<string, Map<string, SupportRow[]>>()
  for (const [source, rows] of bySource) {
    const buckets = new Map<string, SupportRow[]>()
    for (const row of rows) {
      const norm = normalizeTitle(row.title)
      const key = norm.slice(0, 10)
      const arr = buckets.get(key)
      if (arr) arr.push(row)
      else buckets.set(key, [row])
    }
    bucketsBySource.set(source, buckets)
  }

  const toDeactivate: string[] = []
  const pairs: DedupResult['pairs'] = []
  const processed = new Set<string>()

  // 소스 간 교차 비교 (버킷 키가 동일한 레코드끼리만 비교)
  for (let si = 0; si < sourceKeys.length; si++) {
    const bucketsA = bucketsBySource.get(sourceKeys[si])!
    for (let sj = si + 1; sj < sourceKeys.length; sj++) {
      const bucketsB = bucketsBySource.get(sourceKeys[sj])!

      for (const [bucketKey, rowsA] of bucketsA) {
        const rowsB = bucketsB.get(bucketKey)
        if (!rowsB) continue

        for (const a of rowsA) {
          if (processed.has(a.id)) continue
          for (const b of rowsB) {
            if (processed.has(b.id)) continue

            const sim = compositeSimilarity(a, b)
            if (sim >= SIMILARITY_THRESHOLD) {
              const richA = richness(a)
              const richB = richness(b)

              if (richA >= richB) {
                toDeactivate.push(b.id)
                processed.add(b.id)
                pairs.push({ kept: a.title, removed: b.title, score: sim })
              } else {
                toDeactivate.push(a.id)
                processed.add(a.id)
                pairs.push({ kept: b.title, removed: a.title, score: sim })
                break
              }
            }
          }
        }
      }
    }
  }

  console.log(`[Dedup] Found ${toDeactivate.length} duplicates from ${supports.length} active supports`)
  for (const pair of pairs) {
    console.log(`[Dedup]   kept="${pair.kept}" removed="${pair.removed}" score=${pair.score.toFixed(3)}`)
  }

  let deactivated = 0
  // Batch deactivate
  for (let i = 0; i < toDeactivate.length; i += 100) {
    const batch = toDeactivate.slice(i, i + 100)
    const { error } = await supabase
      .from('supports')
      .update({ is_active: false })
      .in('id', batch)
    if (error) {
      console.error(`[Dedup] 비활성화 오류 (${i}~${i + batch.length}): ${error.message}`)
    } else {
      deactivated += batch.length
    }
  }

  return { duplicatesFound: toDeactivate.length, deactivated, pairs }
}
