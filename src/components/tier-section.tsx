'use client'

import { useState } from 'react'
import { CheckCircle2, ThumbsUp, Compass, ChevronDown } from 'lucide-react'
import SupportCard from '@/components/support-card'
import type { ScoredSupportData } from '@/types'
import type { TierName } from '@/lib/normalize-tier'

const TIER_CONFIG = {
  tailored: {
    title: '맞춤 추천',
    subtitle: '여러 조건이 높은 수준으로 일치합니다',
    Icon: CheckCircle2,
    bgClass: 'bg-emerald-50 dark:bg-emerald-950/30',
    badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
    iconClass: 'text-emerald-600 dark:text-emerald-400',
    borderClass: 'border-emerald-200/60 dark:border-emerald-800/40',
    initialShow: Infinity,
  },
  recommended: {
    title: '추천',
    subtitle: '좋은 매칭이거나 강한 부분 매칭입니다',
    Icon: ThumbsUp,
    bgClass: 'bg-blue-50 dark:bg-blue-950/30',
    badgeClass: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    iconClass: 'text-blue-600 dark:text-blue-400',
    borderClass: 'border-blue-200/60 dark:border-blue-800/40',
    initialShow: 10,
  },
  exploratory: {
    title: '탐색',
    subtitle: '탐색할 가치가 있지만 데이터가 제한적입니다',
    Icon: Compass,
    bgClass: 'bg-gray-50 dark:bg-gray-900/30',
    badgeClass: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    iconClass: 'text-gray-500 dark:text-gray-400',
    borderClass: 'border-gray-200/60 dark:border-gray-700/40',
    initialShow: 5,
  },
} as const

interface TierSectionProps {
  tier: TierName
  items: ScoredSupportData[]
}

export function TierSection({ tier, items }: TierSectionProps) {
  const [expanded, setExpanded] = useState(false)

  if (items.length === 0) return null

  const config = TIER_CONFIG[tier]
  const Icon = config.Icon
  const { initialShow } = config
  const visibleItems = expanded || items.length <= initialShow ? items : items.slice(0, initialShow)
  const hasMore = items.length > initialShow

  return (
    <section className="mb-10" aria-label={`${config.title} 혜택 ${items.length}개`}>
      <div className={`mb-5 rounded-xl border ${config.borderClass} ${config.bgClass} p-4`}>
        <div className="flex items-center gap-3">
          <Icon className={`h-5 w-5 shrink-0 ${config.iconClass}`} aria-hidden="true" />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-foreground">{config.title}</h2>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${config.badgeClass}`}>
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
          className="mt-5 flex w-full items-center justify-center gap-1.5 rounded-xl border border-border/60 bg-card py-3 text-sm font-medium text-muted-foreground shadow-sm transition-all duration-200 hover:border-primary/30 hover:bg-accent hover:text-foreground hover:shadow-md"
        >
          나머지 {items.length - initialShow}개 더보기
          <ChevronDown className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
    </section>
  )
}
