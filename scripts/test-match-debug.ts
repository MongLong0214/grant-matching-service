/**
 * 실제 유저 프로필로 매칭 디버깅
 * Bug fix: Supabase 1000행 제한 → 전체 로드
 */
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

import { mapSupportRows } from '../src/lib/supabase/mappers'
import { matchSupportsV4 } from '../src/lib/matching-v4'
import type { UserInput } from '../src/types'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function loadAllSupports() {
  const today = new Date().toISOString().split('T')[0]
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

async function main() {
  console.log('Loading ALL supports (paginated)...')
  const supports = await loadAllSupports()
  console.log(`Loaded ${supports.length} active supports`)

  const profiles: { name: string; input: UserInput }[] = [
    {
      name: '30대/서울/1인/차상위/구직자',
      input: { userType: 'personal', ageGroup: '30대', gender: '남성', region: '서울', householdType: '1인', incomeLevel: '차상위', employmentStatus: '구직자', interestCategories: ['주거', '생활'] },
    },
    {
      name: '20대/서울/1인/기초생활/구직자',
      input: { userType: 'personal', ageGroup: '20대', gender: '남성', region: '서울', householdType: '1인', incomeLevel: '기초생활', employmentStatus: '구직자', interestCategories: ['주거', '취업'] },
    },
    {
      name: '60대+/부산/일반/차상위/은퇴',
      input: { userType: 'personal', ageGroup: '60대이상', gender: '남성', region: '부산', householdType: '일반', incomeLevel: '차상위', employmentStatus: '은퇴', interestCategories: ['건강', '생활'] },
    },
    {
      name: '사업자: 서울/음식점/5명/2억/2년/35세',
      input: { userType: 'business', businessType: '숙박 및 음식점업', region: '서울', employeeCount: 5, annualRevenue: 200000000, businessAge: 24, founderAge: 35 },
    },
    {
      name: '사업자: 경기/IT/30명/20억/5년/45세',
      input: { userType: 'business', businessType: '정보통신업', region: '경기', employeeCount: 30, annualRevenue: 2000000000, businessAge: 60, founderAge: 45 },
    },
  ]

  for (const p of profiles) {
    console.log(`\n${'='.repeat(60)}`)
    console.log(`프로필: ${p.name}`)
    console.log('='.repeat(60))
    const result = matchSupportsV4(supports, p.input)
    console.log(`Total: ${result.totalCount} (T:${result.tailored.length} R:${result.recommended.length} E:${result.exploratory.length})`)
    console.log(`Knocked out: ${result.knockedOut}, Service filtered: ${result.filteredByServiceType}`)

    if (result.all.length > 0) {
      console.log('\nTop 10:')
      for (const s of result.all.slice(0, 10)) {
        console.log(`  [${s.tier}] ${s.score.toFixed(3)} - ${s.support.title.slice(0, 60)} (${s.support.source})`)
        const dims = Object.entries(s.breakdown).filter(([, v]) => v > 0)
        console.log(`    dims: ${dims.map(([k, v]) => `${k}=${v}`).join(', ')}`)
      }
    } else {
      console.log('  *** 결과 없음! ***')
    }
  }
}

main().catch(console.error)
