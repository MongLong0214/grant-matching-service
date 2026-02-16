import { createClient } from '@supabase/supabase-js'

/** Jaccard similarity between two strings (bigram-based) */
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

/**
 * Find and deactivate duplicate supports across sources.
 * Keeps the record with the most extraction data (non-null target fields).
 */
export async function deduplicateSupports(): Promise<DedupResult> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const supabase = createClient(supabaseUrl, serviceKey)

  const { data: supports } = await supabase
    .from('supports')
    .select('id, title, organization, detail_url, source, external_id, target_regions, target_business_types, target_employee_min, target_employee_max, target_revenue_min, target_revenue_max')
    .eq('is_active', true)
    .order('source', { ascending: true })

  if (!supports || supports.length < 2) return { duplicatesFound: 0, deactivated: 0, pairs: [] }

  type SupportRow = NonNullable<typeof supports>[number]

  // Count non-null target fields as "richness" score
  function richness(s: SupportRow): number {
    let score = 0
    if (s.target_regions) score++
    if (s.target_business_types) score++
    if (s.target_employee_min !== null || s.target_employee_max !== null) score++
    if (s.target_revenue_min !== null || s.target_revenue_max !== null) score++
    return score
  }

  const toDeactivate: string[] = []
  const pairs: DedupResult['pairs'] = []
  const processed = new Set<string>()

  for (let i = 0; i < supports.length; i++) {
    if (processed.has(supports[i].id)) continue

    for (let j = i + 1; j < supports.length; j++) {
      if (processed.has(supports[j].id)) continue
      if (supports[i].source === supports[j].source) continue  // Skip same-source

      const sim = compositeSimilarity(supports[i], supports[j])
      if (sim >= SIMILARITY_THRESHOLD) {
        // Keep the richer record, deactivate the other
        const richI = richness(supports[i])
        const richJ = richness(supports[j])

        if (richI >= richJ) {
          toDeactivate.push(supports[j].id)
          processed.add(supports[j].id)
          pairs.push({ kept: supports[i].title, removed: supports[j].title, score: sim })
        } else {
          toDeactivate.push(supports[i].id)
          processed.add(supports[i].id)
          pairs.push({ kept: supports[j].title, removed: supports[i].title, score: sim })
          break  // Move to next i since current i is now deactivated
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
    if (!error) deactivated += batch.length
  }

  return { duplicatesFound: toDeactivate.length, deactivated, pairs }
}
