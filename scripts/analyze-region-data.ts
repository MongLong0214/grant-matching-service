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
  const PAGE_SIZE = 1000
  const allRows: any[] = []
  let from = 0
  while (true) {
    const { data, error } = await sb.from('supports')
      .select('id, title, organization, target_regions, target_sub_regions, source, service_type')
      .eq('is_active', true)
      .range(from, from + PAGE_SIZE - 1)
    if (error) throw error
    if (!data || data.length === 0) break
    allRows.push(...data)
    if (data.length < PAGE_SIZE) break
    from += PAGE_SIZE
  }

  console.log(`=== 지역 매칭 데이터 과학적 분석 ===\n`)
  console.log(`총 supports: ${allRows.length}\n`)

  // 1. target_regions 분포
  const hasRegion = allRows.filter(r => r.target_regions && r.target_regions.length > 0)
  const noRegion = allRows.filter(r => !r.target_regions || r.target_regions.length === 0)
  console.log(`--- 1. target_regions 분포 ---`)
  console.log(`  지역 있음: ${hasRegion.length} (${(hasRegion.length/allRows.length*100).toFixed(1)}%)`)
  console.log(`  지역 없음: ${noRegion.length} (${(noRegion.length/allRows.length*100).toFixed(1)}%)`)

  // 2. organization 필드 분석
  console.log(`\n--- 2. organization 패턴 분석 ---`)
  
  // org 패턴별 분류
  const orgPatterns = {
    centralGov: 0,     // 중앙정부
    ministry: 0,        // XX부, XX처, XX청 등
    sido: 0,            // XX광역시, XX도, XX시(광역시급)
    sigun: 0,           // XX시 XX구, XX군
    foundation: 0,      // XX신용보증재단 등
    other: 0,
  }
  
  const SIDO_NAMES = ['서울', '부산', '대구', '인천', '광주', '대전', '울산', '세종', '경기', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주']
  const SIDO_FULL = ['서울특별시', '부산광역시', '대구광역시', '인천광역시', '광주광역시', '대전광역시', '울산광역시', '세종특별자치시', '경기도', '강원특별자치도', '강원도', '충청북도', '충청남도', '전라북도', '전북특별자치도', '전라남도', '경상북도', '경상남도', '제주특별자치도', '제주도']
  const MINISTRIES = ['환경부', '과학기술', '중소벤처기업부', '산업통상자원부', '고용노동부', '보건복지부', '국토교통부', '농림축산식품부', '해양수산부', '문화체육관광부', '교육부', '여성가족부', '행정안전부', '기획재정부', '금융위원회', '공정거래위원회']
  
  const orgToRegion = new Map<string, string>()
  
  for (const r of allRows) {
    const org = r.organization || ''
    if (org === '중앙정부') {
      orgPatterns.centralGov++
      orgToRegion.set(r.id, '전국')
    } else if (MINISTRIES.some(m => org.includes(m))) {
      orgPatterns.ministry++
      orgToRegion.set(r.id, '전국')
    } else {
      let foundSido = ''
      for (const sf of SIDO_FULL) {
        if (org.includes(sf)) { foundSido = sf; break }
      }
      if (!foundSido) {
        for (const sn of SIDO_NAMES) {
          if (org.startsWith(sn) || org.includes(sn + '도') || org.includes(sn + '시') || org.includes(sn + '광역') || org.includes(sn + '특별')) {
            foundSido = sn; break
          }
        }
      }
      if (foundSido) {
        // 시/도급 or 시/군/구급
        if (SIDO_FULL.includes(foundSido) || SIDO_NAMES.some(n => org === n + '도' || org === n + '시' || foundSido === n)) {
          orgPatterns.sido++
        } else {
          orgPatterns.sigun++
        }
        orgToRegion.set(r.id, foundSido)
      } else if (org.includes('신용보증재단') || org.includes('경제진흥원') || org.includes('테크노파크') || org.includes('창조경제혁신센터')) {
        orgPatterns.foundation++
        // 재단/기관명에서 지역 추출 시도
        for (const sn of SIDO_NAMES) {
          if (org.includes(sn)) { orgToRegion.set(r.id, sn); break }
        }
      } else {
        orgPatterns.other++
      }
    }
  }

  console.log(`  중앙정부: ${orgPatterns.centralGov}`)
  console.log(`  중앙부처: ${orgPatterns.ministry}`)
  console.log(`  시/도급 기관: ${orgPatterns.sido}`)
  console.log(`  시/군/구급 기관: ${orgPatterns.sigun}`)
  console.log(`  재단/기관(지역명 포함): ${orgPatterns.foundation}`)
  console.log(`  기타: ${orgPatterns.other}`)
  console.log(`  org에서 지역 추출 가능: ${orgToRegion.size}/${allRows.length} (${(orgToRegion.size/allRows.length*100).toFixed(1)}%)`)

  // 3. target_regions=[] 인 supports의 organization 분포
  console.log(`\n--- 3. 지역 없는 supports의 org 분석 ---`)
  const noRegionByOrg = {
    centralGov: 0,
    localGov: 0,
    orgHasRegion: 0,
    unknown: 0,
  }

  for (const r of noRegion) {
    const org = r.organization || ''
    if (org === '중앙정부' || MINISTRIES.some(m => org.includes(m))) {
      noRegionByOrg.centralGov++
    } else if (orgToRegion.has(r.id)) {
      noRegionByOrg.orgHasRegion++
    } else {
      noRegionByOrg.unknown++
    }
  }

  console.log(`  중앙정부/부처 (정당하게 전국): ${noRegionByOrg.centralGov}`)
  console.log(`  org에 지역 있음 (수정 가능): ${noRegionByOrg.orgHasRegion}`)
  console.log(`  진짜 불명: ${noRegionByOrg.unknown}`)

  // 4. source별 target_regions 분포
  console.log(`\n--- 4. source별 지역 추출 상황 ---`)
  const bySource: Record<string, { total: number, hasRegion: number, noRegion: number }> = {}
  for (const r of allRows) {
    const src = r.source || 'unknown'
    if (!bySource[src]) bySource[src] = { total: 0, hasRegion: 0, noRegion: 0 }
    bySource[src].total++
    if (r.target_regions && r.target_regions.length > 0) bySource[src].hasRegion++
    else bySource[src].noRegion++
  }
  for (const [src, stat] of Object.entries(bySource).sort((a, b) => b[1].total - a[1].total)) {
    const pct = stat.total > 0 ? (stat.hasRegion/stat.total*100).toFixed(0) : '0'
    console.log(`  ${src}: ${stat.total}건 (지역 있음: ${stat.hasRegion} = ${pct}%, 없음: ${stat.noRegion})`)
  }

  // 5. organization이 지역 정보를 가진 경우와 현재 target_regions의 일치율
  console.log(`\n--- 5. org 기반 지역 vs target_regions 일치율 ---`)
  let orgMatch = 0, orgMismatch = 0, orgToAdd = 0
  const mismatchExamples: string[] = []
  
  for (const r of allRows) {
    const orgRegion = orgToRegion.get(r.id)
    if (!orgRegion || orgRegion === '전국') continue
    
    const stdRegion = SIDO_NAMES.find(sn => orgRegion.includes(sn))
    if (!stdRegion) continue
    
    if (r.target_regions && r.target_regions.includes(stdRegion)) {
      orgMatch++
    } else if (!r.target_regions || r.target_regions.length === 0) {
      orgToAdd++
      if (mismatchExamples.length < 10) {
        mismatchExamples.push(`  ADD: ${r.title} | org: ${r.organization} | current: ${JSON.stringify(r.target_regions)} | org→${stdRegion}`)
      }
    } else {
      orgMismatch++
      if (mismatchExamples.length < 10) {
        mismatchExamples.push(`  MISMATCH: ${r.title} | org: ${r.organization} | current: ${JSON.stringify(r.target_regions)} | org→${stdRegion}`)
      }
    }
  }
  console.log(`  org→지역 일치: ${orgMatch}`)
  console.log(`  org→지역 불일치: ${orgMismatch}`)
  console.log(`  org에서 추가 가능: ${orgToAdd}`)
  console.log(mismatchExamples.join('\n'))

  // 6. 제안: org 기반 지역 해결 가능한 비율
  console.log(`\n--- 6. 개선 가능성 요약 ---`)
  const currentCoverage = hasRegion.length / allRows.length * 100
  const potentialFix = orgToAdd
  const afterFix = (hasRegion.length + potentialFix) / allRows.length * 100
  console.log(`  현재 지역 커버리지: ${currentCoverage.toFixed(1)}%`)
  console.log(`  org 기반 추가 가능: +${potentialFix}건`)
  console.log(`  수정 후 커버리지: ${afterFix.toFixed(1)}%`)
  console.log(`  남은 불명: ${noRegion.length - potentialFix - noRegionByOrg.centralGov}건`)
}

main().catch(console.error)
