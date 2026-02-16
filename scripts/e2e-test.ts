/**
 * E2E 테스트 — Playwright Library Mode
 * 실행: npx tsx scripts/e2e-test.ts
 *
 * Playwright getByRole/getByText 기반 ARIA 시맨틱 테스트
 * Custom Radix combobox: click trigger → click option (not selectOption)
 */

import { chromium } from 'playwright'

const BASE = 'http://localhost:3000'

async function main() {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } })

  let passed = 0
  let failed = 0

  async function assert(check: boolean | Promise<boolean>, name: string) {
    const ok = await check
    if (ok) {
      console.log(`  ✅ ${name}`)
      passed++
    } else {
      console.error(`  ❌ ${name}`)
      failed++
    }
  }

  // === 1. 랜딩 페이지 ===
  console.log('\n[1] 랜딩 페이지')
  await page.goto(BASE, { waitUntil: 'networkidle' })

  await assert(page.getByText('나에게 맞는 정부 혜택,').isVisible(), '히어로 타이틀 표시')
  await assert(page.getByRole('link', { name: /개인 혜택 찾기/ }).first().isVisible(), '개인 CTA 링크 표시')
  await assert(page.getByRole('link', { name: /사업자 지원금 찾기/ }).first().isVisible(), '사업자 CTA 링크 표시')
  await assert(page.getByText('자주 묻는 질문').isVisible(), 'FAQ 섹션 표시')

  // === 2. 개인 진단 폼 ===
  console.log('\n[2] 개인 진단 폼 진입')
  await page.getByRole('link', { name: /개인 혜택 찾기/ }).first().click()
  await page.waitForURL('**/diagnose?type=personal', { timeout: 10000 })
  await assert(page.url().includes('type=personal'), '개인 폼 URL 이동')

  // 폼 필드 존재 확인
  await assert(page.getByText('연령대').isVisible(), '연령대 필드 표시')
  await assert(page.getByText('성별').isVisible(), '성별 필드 표시')
  await assert(page.getByText('가구 유형').isVisible(), '가구 유형 필드 표시')
  await assert(page.getByText('소득 수준').isVisible(), '소득 수준 필드 표시')
  await assert(page.getByText('취업 상태').isVisible(), '취업 상태 필드 표시')
  await assert(page.getByText('관심 분야').isVisible(), '관심 분야 필드 표시')

  // === 3. 개인 폼 채우기 ===
  console.log('\n[3] 개인 폼 입력')

  // 라디오: Radix RadioGroupItem (sr-only) — 라벨 클릭으로 선택
  await page.getByRole('radio', { name: '20대' }).click({ force: true })
  console.log('  → 연령대: 20대')

  await page.getByRole('radio', { name: '남성' }).click({ force: true })
  console.log('  → 성별: 남성')

  // 지역 콤보박스: Radix Popover 기반 (role="combobox" → role="option")
  await page.getByRole('combobox', { name: '지역 선택' }).click()
  await page.getByRole('option', { name: '서울' }).click()
  console.log('  → 지역: 서울')

  await page.getByRole('radio', { name: '1인 가구' }).click({ force: true })
  console.log('  → 가구 유형: 1인 가구')

  await page.getByRole('radio', { name: /중위소득 100% 이하/ }).click({ force: true })
  console.log('  → 소득 수준: 중위소득 100% 이하')

  await page.getByRole('radio', { name: /구직자/ }).click({ force: true })
  console.log('  → 취업 상태: 구직자')

  // 관심 분야: checkbox (sr-only) — 라벨 클릭
  await page.getByRole('checkbox', { name: /주거/ }).click({ force: true })
  console.log('  → 관심 분야: 주거')

  // 프로그레스 확인
  const progressEl = page.getByRole('progressbar')
  if (await progressEl.isVisible()) {
    const progressText = await progressEl.textContent()
    console.log(`  → 진행률: ${progressText}`)
  }

  // === 4. 개인 진단 제출 ===
  console.log('\n[4] 개인 진단 제출')
  await page.getByRole('button', { name: '내 혜택 찾기' }).click()
  await page.waitForURL('**/result/**', { timeout: 20000 })
  await assert(page.url().includes('/result/'), '결과 페이지 이동')

  // === 5. 개인 결과 페이지 ===
  console.log('\n[5] 개인 결과 페이지')
  await page.waitForLoadState('networkidle')
  // SSR 페이지 — 컨텐츠 로드 대기
  await page.waitForTimeout(2000)
  await assert(page.getByText('맞춤 혜택 결과').isVisible(), '개인 결과 타이틀 표시')
  await assert(page.getByText('조건 수정하기').isVisible(), '조건 수정 링크 표시')

  // 카테고리 필터 바 (개인 트랙)
  const filterGroup = page.getByRole('group', { name: '카테고리 필터' })
  await assert(filterGroup.isVisible(), '카테고리 필터 바 표시')

  // === 6. 사업자 진단 폼 ===
  console.log('\n[6] 사업자 진단 폼 진입')
  await page.goto(`${BASE}/diagnose?type=business`, { waitUntil: 'networkidle' })

  await assert(page.getByText('업종').first().isVisible(), '업종 필드 표시')
  await assert(page.getByText('직원 수').isVisible(), '직원 수 필드 표시')
  await assert(page.getByText('연 매출').isVisible(), '연 매출 필드 표시')
  await assert(page.getByText('업력').isVisible(), '업력 필드 표시')
  await assert(page.getByText('대표자 연령대').isVisible(), '대표자 연령대 필드 표시')

  // === 7. 사업자 폼 채우기 ===
  console.log('\n[7] 사업자 폼 입력')

  // 업종 콤보박스
  await page.getByRole('combobox', { name: '업종 선택' }).click()
  await page.getByRole('option', { name: '음식점업' }).click()
  console.log('  → 업종: 음식점업')

  // 지역 콤보박스
  await page.getByRole('combobox', { name: '지역 선택' }).click()
  await page.getByRole('option', { name: '서울' }).click()
  console.log('  → 지역: 서울')

  // 라디오 선택
  await page.getByRole('radio', { name: '5~9명' }).click({ force: true })
  console.log('  → 직원 수: 5~9명')

  await page.getByRole('radio', { name: '1억 ~ 5억' }).click({ force: true })
  console.log('  → 연 매출: 1억 ~ 5억')

  await page.getByRole('radio', { name: '1~3년' }).click({ force: true })
  console.log('  → 업력: 1~3년')

  await page.getByRole('radio', { name: '만 30~39세' }).click({ force: true })
  console.log('  → 대표자 연령대: 만 30~39세')

  // === 8. 사업자 진단 제출 ===
  console.log('\n[8] 사업자 진단 제출')
  await page.getByRole('button', { name: '내 지원금 찾기' }).click()
  await page.waitForURL('**/result/**', { timeout: 20000 })
  await assert(page.url().includes('/result/'), '결과 페이지 이동')

  // === 9. 사업자 결과 페이지 ===
  console.log('\n[9] 사업자 결과 페이지')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(2000)
  await assert(page.getByText('맞춤 지원금 결과').isVisible(), '사업자 결과 타이틀 표시')
  await assert(page.getByText('조건 수정하기').isVisible(), '조건 수정 링크 표시')

  // === 10. 유형 선택 화면 ===
  console.log('\n[10] 유형 선택 화면')
  await page.goto(`${BASE}/diagnose`, { waitUntil: 'networkidle' })
  await assert(page.getByText('개인').first().isVisible(), '개인 유형 카드 표시')
  await assert(page.getByText('사업자').first().isVisible(), '사업자 유형 카드 표시')

  // === 11. 잘못된 UUID 에러 처리 ===
  console.log('\n[11] 에러 처리')
  await page.goto(`${BASE}/result/not-a-uuid`, { waitUntil: 'networkidle' })
  await assert(page.getByText('잘못된 접근입니다').isVisible(), '잘못된 UUID 에러 메시지')

  // === 결과 ===
  console.log(`\n${'='.repeat(40)}`)
  console.log(`결과: ${passed} 통과 / ${failed} 실패 / ${passed + failed} 전체`)
  console.log(`${'='.repeat(40)}`)

  await browser.close()
  process.exit(failed > 0 ? 1 : 0)
}

main().catch((e) => {
  console.error('E2E 테스트 실패:', e)
  process.exit(1)
})
