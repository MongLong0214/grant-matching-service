'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Search } from 'lucide-react'
import SupportCard from '@/components/support-card'
import { TierSection } from '@/components/tier-section'
import type { Support, UserType, ScoredSupportData } from '@/types'
import { INTEREST_CATEGORY_OPTIONS } from '@/constants'
import { normalizeTier } from '@/lib/normalize-tier'

interface SupportListProps {
  supports: Support[]
  scoredSupports?: ScoredSupportData[]
  userType?: UserType
}

export default function SupportList({ supports, scoredSupports, userType }: SupportListProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  if (!scoredSupports || scoredSupports.length === 0) {
    if (supports.length === 0) {
      return (
        <div className="rounded-2xl border border-border/60 bg-card p-16 text-center shadow-sm">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Search className="h-7 w-7 text-muted-foreground" aria-hidden="true" />
          </div>
          <p className="text-xl font-bold text-foreground">조건에 맞는 혜택이 없습니다</p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
            입력 조건을 변경하면 더 많은 혜택을 찾을 수 있어요. 다른 유형으로도 진단해보세요.
          </p>
          <Button asChild className="mt-6 rounded-lg">
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
      {userType === 'personal' && (
        <div className="mb-8 flex flex-wrap gap-2" role="group" aria-label="카테고리 필터">
          <button
            type="button"
            onClick={() => setSelectedCategory(null)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
              selectedCategory === null
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-muted text-muted-foreground hover:bg-accent hover:text-foreground'
            }`}
          >
            전체
          </button>
          {INTEREST_CATEGORY_OPTIONS.map((cat) => (
            <button
              key={cat.value}
              type="button"
              onClick={() => setSelectedCategory(selectedCategory === cat.value ? null : cat.value)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
                selectedCategory === cat.value
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted text-muted-foreground hover:bg-accent hover:text-foreground'
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
