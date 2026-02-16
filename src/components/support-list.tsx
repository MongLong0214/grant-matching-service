'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Search, CheckCircle2, ThumbsUp, Compass, ChevronDown } from 'lucide-react'
import SupportCard from '@/components/support-card'
import type { Support } from '@/types'

import type { UserType } from '@/types'
import { INTEREST_CATEGORY_OPTIONS } from '@/constants'
import { normalizeTier, type TierName } from '@/lib/normalize-tier'

interface ScoredSupportData {
  support: Support
  score: number
  tier: string
  breakdown?: Record<string, number>
  confidence?: number
}

interface SupportListProps {
  supports: Support[]
  scoredSupports?: ScoredSupportData[]
  totalAnalyzed?: number
  userType?: UserType
}

const TIER_CONFIG = {
  tailored: {
    title: '맞춤 추천',
    subtitle: '여러 조건이 높은 수준으로 일치합니다',
    Icon: CheckCircle2,
    bgClass: 'bg-emerald-50 dark:bg-emerald-950/30',
    badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
    iconClass: 'text-emerald-600 dark:text-emerald-400',
    initialShow: Infinity,
  },
  recommended: {
    title: '추천',
    subtitle: '좋은 매칭이거나 강한 부분 매칭입니다',
    Icon: ThumbsUp,
    bgClass: 'bg-blue-50 dark:bg-blue-950/30',
    badgeClass: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    iconClass: 'text-blue-600 dark:text-blue-400',
    initialShow: 10,
  },
  exploratory: {
    title: '탐색',
    subtitle: '탐색할 가치가 있지만 데이터가 제한적입니다',
    Icon: Compass,
    bgClass: 'bg-gray-50 dark:bg-gray-900/30',
    badgeClass: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    iconClass: 'text-gray-500 dark:text-gray-400',
    initialShow: 5,
  },
} as const

function TierSection({ tier, items }: { tier: TierName; items: ScoredSupportData[] }) {
  const [expanded, setExpanded] = useState(false)

  if (items.length === 0) return null

  const config = TIER_CONFIG[tier]
  const Icon = config.Icon
  const { initialShow } = config
  const visibleItems = expanded || items.length <= initialShow ? items : items.slice(0, initialShow)
  const hasMore = items.length > initialShow

  return (
    <section className="mb-8">
      <div className={`mb-4 rounded-xl ${config.bgClass} p-4`}>
        <div className="flex items-center gap-3">
          <Icon className={`h-5 w-5 shrink-0 ${config.iconClass}`} aria-hidden="true" />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-foreground">{config.title}</h2>
              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${config.badgeClass}`}>
                {items.length}개
              </span>
            </div>
            <p className="mt-0.5 text-sm text-muted-foreground">{config.subtitle}</p>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {visibleItems.map((item) => (
          <SupportCard
            key={item.support.id}
            support={item.support}
            matchScore={{
              score: Math.round(item.score * 100),
              tier: tier,
              confidence: item.confidence,
            }}
          />
        ))}
      </div>
      {hasMore && !expanded && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-lg border border-border py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          나머지 {items.length - initialShow}개 더보기
          <ChevronDown className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
    </section>
  )
}

export default function SupportList({ supports, scoredSupports, totalAnalyzed, userType }: SupportListProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  if (!scoredSupports || scoredSupports.length === 0) {
    if (supports.length === 0) {
      return (
        <div className="rounded-2xl border bg-card p-12 text-center shadow-sm">
          <Search className="mx-auto mb-4 h-12 w-12 text-muted-foreground" aria-hidden="true" />
          <p className="text-lg font-semibold text-foreground">조건에 맞는 혜택이 없습니다</p>
          <p className="mt-2 text-sm text-muted-foreground">
            입력 조건을 변경하면 더 많은 혜택을 찾을 수 있어요.
          </p>
          <Button asChild className="mt-5">
            <Link href="/diagnose">다시 진단하기</Link>
          </Button>
        </div>
      )
    }

    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {supports.map((support) => (
          <SupportCard key={support.id} support={support} />
        ))}
      </div>
    )
  }

  const normalized = scoredSupports.map((s) => ({
    ...s,
    tier: normalizeTier(s.tier),
  }))

  const filtered = selectedCategory
    ? normalized.filter((s) =>
        s.support.benefitCategories?.includes(selectedCategory)
      )
    : normalized

  const tailored = filtered.filter((s) => s.tier === 'tailored')
  const recommended = filtered.filter((s) => s.tier === 'recommended')
  const exploratory = filtered.filter((s) => s.tier === 'exploratory')

  return (
    <div>
      {totalAnalyzed != null && totalAnalyzed > 0 && (
        <p className="mb-6 text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{totalAnalyzed.toLocaleString()}개</span> 지원사업을 분석하여{' '}
          <span className="font-semibold text-foreground">{normalized.length}개</span>의 맞춤 결과를 찾았습니다
        </p>
      )}

      {/* 개인 트랙: 카테고리 필터 바 */}
      {userType === 'personal' && (
        <div className="mb-6 flex flex-wrap gap-2" role="group" aria-label="카테고리 필터">
          <button
            type="button"
            onClick={() => setSelectedCategory(null)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              selectedCategory === null
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-accent'
            }`}
          >
            전체
          </button>
          {INTEREST_CATEGORY_OPTIONS.map((cat) => (
            <button
              key={cat.value}
              type="button"
              onClick={() => setSelectedCategory(selectedCategory === cat.value ? null : cat.value)}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                selectedCategory === cat.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-accent'
              }`}
            >
              {cat.label.split(' / ')[0]}
            </button>
          ))}
        </div>
      )}

      <TierSection tier="tailored" items={tailored} />
      <TierSection tier="recommended" items={recommended} />
      <TierSection tier="exploratory" items={exploratory} />
    </div>
  )
}
