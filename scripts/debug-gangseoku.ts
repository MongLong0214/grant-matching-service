import { readFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'

const env = readFileSync('.env.local', 'utf-8')
for (const l of env.split('\n')) {
  const t = l.trim()
  if (!t || t.startsWith('#')) continue
  const e = t.indexOf('=')
  if (e === -1) continue
  const k = t.slice(0, e).trim()
  const v = t.slice(e + 1).trim()
  if (!process.env[k]) process.env[k] = v
}

import { extractEligibility } from '../src/lib/extraction/index'
import { extractRegions } from '../src/lib/extraction/region-dictionary'

const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function main() {
  // 강서구 전세피해지원금 원문 확인
  const { data } = await s.from('supports')
    .select('id, title, raw_eligibility_text, raw_preference_text, raw_exclusion_text, target_regions, source')
    .ilike('title', '%강서구%전세피해%').limit(1)

  for (const r of data || []) {
    console.log('=== 강서구 전세피해지원금 원문 분석 ===')
    console.log('title:', r.title)
    console.log('source:', r.source)
    console.log('current regions:', JSON.stringify(r.target_regions))
    console.log()
    console.log('raw_eligibility_text:', r.raw_eligibility_text)
    console.log()
    console.log('raw_preference_text:', r.raw_preference_text)
    console.log()
    console.log('raw_exclusion_text:', r.raw_exclusion_text)
    console.log()

    // 재추출 테스트
    const texts = [r.raw_eligibility_text, r.raw_preference_text, r.raw_exclusion_text].filter(Boolean) as string[]
    const result = extractEligibility(texts, r.title)
    console.log('Re-extracted regions:', JSON.stringify(result.regions))
    console.log('Region confidence:', result.confidence.regions)

    // 개별 텍스트별 분석
    const combined = texts.join(' ')
    const withTitle = `${r.title} ${combined}`
    console.log('\n--- 개별 분석 ---')
    console.log('Title only:', JSON.stringify(extractRegions(r.title)))
    console.log('Combined only:', JSON.stringify(extractRegions(combined)))
    console.log('Title+Combined:', JSON.stringify(extractRegions(withTitle)))

    // "인천" 문자열 위치 확인
    const fullText = withTitle
    const incheonIdx = fullText.indexOf('인천')
    if (incheonIdx !== -1) {
      const start = Math.max(0, incheonIdx - 20)
      const end = Math.min(fullText.length, incheonIdx + 20)
      console.log(`\n"인천" found at index ${incheonIdx}: ...${fullText.slice(start, end)}...`)
    } else {
      console.log('\n"인천" NOT found in text')
    }

    // "서울" 문자열 위치 확인
    const seoulIdx = fullText.indexOf('서울')
    if (seoulIdx !== -1) {
      const start = Math.max(0, seoulIdx - 20)
      const end = Math.min(fullText.length, seoulIdx + 20)
      console.log(`"서울" found at index ${seoulIdx}: ...${fullText.slice(start, end)}...`)
    } else {
      console.log('"서울" NOT found in text')
    }
  }

  // 전수 조사: 지역 2개 이상 태깅된 레코드 중 의심 케이스
  console.log('\n\n=== 지역 2개 이상 태깅 레코드 (의심 케이스) ===')
  const PAGE = 1000
  let from = 0
  let suspicious = 0
  while (true) {
    const { data: rows } = await s.from('supports')
      .select('id, title, target_regions')
      .eq('is_active', true)
      .range(from, from + PAGE - 1)
    if (!rows || rows.length === 0) break
    for (const r of rows) {
      if (r.target_regions && r.target_regions.length >= 2) {
        suspicious++
        if (suspicious <= 20) {
          console.log(`  ${r.title}: ${JSON.stringify(r.target_regions)}`)
        }
      }
    }
    if (rows.length < PAGE) break
    from += PAGE
  }
  console.log(`\n총 의심 레코드 (지역 2개+): ${suspicious}`)
}

main().catch(console.error)
