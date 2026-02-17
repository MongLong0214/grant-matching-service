const fs = require('fs')
const { createClient } = require('@supabase/supabase-js')

const env = fs.readFileSync('.env.local', 'utf-8')
for (const l of env.split('\n')) {
  const t = l.trim()
  if (t.length === 0 || t.startsWith('#')) continue
  const e = t.indexOf('=')
  if (e === -1) continue
  const k = t.slice(0, e).trim()
  let v = t.slice(e + 1).trim()
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1)
  if (process.env[k] === undefined) process.env[k] = v
}

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function main() {
  // 1. 강서구 자립수당 검색
  const { data, error } = await sb.from('supports')
    .select('id, title, organization, target_regions, target_sub_regions, raw_eligibility_text, service_type, source')
    .ilike('title', '%자립수당%')
    .limit(10)

  if (error) { console.error(error); return }

  console.log('=== 자립수당 관련 supports ===')
  for (const r of data) {
    console.log('Title:', r.title)
    console.log('Org:', r.organization)
    console.log('Source:', r.source)
    console.log('service_type:', r.service_type)
    console.log('target_regions:', JSON.stringify(r.target_regions))
    console.log('target_sub_regions:', JSON.stringify(r.target_sub_regions))
    console.log('raw_eligibility:', (r.raw_eligibility_text || '').substring(0, 500))
    console.log('---')
  }

  // 2. 강서구 관련 supports 검색
  const { data: data2 } = await sb.from('supports')
    .select('id, title, organization, target_regions, target_sub_regions, service_type')
    .ilike('title', '%강서구%')
    .limit(10)

  console.log('\n=== 강서구 관련 supports ===')
  for (const r of (data2 || [])) {
    console.log('Title:', r.title)
    console.log('Org:', r.organization)
    console.log('target_regions:', JSON.stringify(r.target_regions))
    console.log('target_sub_regions:', JSON.stringify(r.target_sub_regions))
    console.log('---')
  }

  // 3. target_regions가 비어있는 supports 중 제목에 특정 구/군이 있는 것들
  const { data: data3 } = await sb.from('supports')
    .select('id, title, target_regions, target_sub_regions')
    .or('target_regions.is.null,target_regions.eq.{}')
    .limit(5000)

  const leaky = (data3 || []).filter(r => {
    const title = r.title || ''
    return /[가-힣]+구|[가-힣]+군|[가-힣]+시/.test(title) &&
           (title.includes('구 ') || title.includes('군 ') || title.includes('시 '))
  }).slice(0, 20)

  console.log('\n=== target_regions 없는데 제목에 지역명 있는 supports (상위 20) ===')
  for (const r of leaky) {
    console.log('Title:', r.title)
    console.log('target_regions:', JSON.stringify(r.target_regions))
    console.log('target_sub_regions:', JSON.stringify(r.target_sub_regions))
    console.log('---')
  }
}

main().catch(console.error)
