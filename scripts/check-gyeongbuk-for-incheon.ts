import { readFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'

const env = readFileSync('.env.local', 'utf-8')
for (const l of env.split('\n')) {
  const t = l.trim()
  if (!t || t.startsWith('#')) continue
  const e = t.indexOf('=')
  if (e === -1) continue
  const k = t.slice(0, e).trim()
  let v = t.slice(e + 1).trim()
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1)
  if (!process.env[k]) process.env[k] = v
}

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function main() {
  // 1. 경상북도/경북 관련 단어가 제목에 있지만 target_regions가 비어있는 supports
  const PAGE_SIZE = 1000
  const allRows: any[] = []
  let from = 0
  while (true) {
    const { data, error } = await sb.from('supports')
      .select('id, title, organization, target_regions, target_sub_regions, service_type, source')
      .eq('is_active', true)
      .range(from, from + PAGE_SIZE - 1)
    if (error) throw error
    if (!data || data.length === 0) break
    allRows.push(...data)
    if (data.length < PAGE_SIZE) break
    from += PAGE_SIZE
  }

  console.log('Total active supports:', allRows.length)

  // target_regions가 비어있는데 경북/경상북도/포항/구미 등 경북 지역 키워드가 있는 것
  const gyeongbukKeywords = ['경상북도', '경북', '포항', '구미', '경주', '안동', '영주', '영천', '상주', '문경', '경산', '김천']
  
  const leaked = allRows.filter(r => {
    if (r.target_regions && r.target_regions.length > 0) return false // 이미 지역 있음
    const title = (r.title || '') + ' ' + (r.organization || '')
    return gyeongbukKeywords.some(kw => title.includes(kw))
  })

  console.log('\n=== 경북 관련인데 target_regions 비어있는 supports ===')
  console.log('건수:', leaked.length)
  for (const r of leaked.slice(0, 30)) {
    console.log(`  [${r.source}] ${r.title} | org: ${r.organization} | regions: ${JSON.stringify(r.target_regions)} | service_type: ${r.service_type}`)
  }

  // 2. target_regions에 '경북'이 있는 supports 수
  const gyeongbukTagged = allRows.filter(r => r.target_regions && r.target_regions.includes('경북'))
  console.log('\n=== target_regions에 경북 있는 supports ===')
  console.log('건수:', gyeongbukTagged.length)

  // 3. 인천 유저가 볼 수 있는 supports (target_regions 비어있거나 인천 포함)
  const forIncheon = allRows.filter(r => !r.target_regions || r.target_regions.length === 0 || r.target_regions.includes('인천'))
  console.log('\n=== 인천 유저가 볼 수 있는 supports ===')
  console.log('건수:', forIncheon.length, `(전국: ${allRows.filter(r => !r.target_regions || r.target_regions.length === 0).length}, 인천 전용: ${allRows.filter(r => r.target_regions && r.target_regions.includes('인천')).length})`)

  // 4. 그 중 제목에 다른 지역 키워드가 있는 것 (오염)
  const otherRegionKeywords = ['경상북도', '경북', '경상남도', '경남', '전라북도', '전북', '전라남도', '전남', '충청북도', '충북', '충청남도', '충남', '강원', '제주', '서울', '부산', '대구', '광주', '대전', '울산', '세종']
  
  const contaminated = forIncheon.filter(r => {
    if (r.target_regions && r.target_regions.length > 0) return false // 인천 전용은 OK
    const title = r.title || ''
    return otherRegionKeywords.some(kw => title.includes(kw))
  })

  console.log('\n=== 전국으로 분류됐지만 제목에 특정 지역명 있는 supports (인천 유저에게 노출됨) ===')
  console.log('건수:', contaminated.length)
  
  // 지역별 분류
  const byRegion: Record<string, number> = {}
  for (const r of contaminated) {
    const title = r.title || ''
    for (const kw of otherRegionKeywords) {
      if (title.includes(kw)) {
        byRegion[kw] = (byRegion[kw] || 0) + 1
        break
      }
    }
  }
  for (const [k, v] of Object.entries(byRegion).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${k}: ${v}건`)
  }
  
  console.log('\n예시:')
  for (const r of contaminated.slice(0, 20)) {
    console.log(`  [${r.source}] ${r.title}`)
  }
}

main().catch(console.error)
