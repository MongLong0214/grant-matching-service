import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Search, Star, ThumbsUp, Bookmark } from 'lucide-react'
import SupportCard from '@/components/support-card'
import type { Support } from '@/types'

interface ScoredSupportData {
  support: Support
  score: number
  tier: 'exact' | 'likely' | 'related'
}

interface SupportListProps {
  supports: Support[]
  scoredSupports?: ScoredSupportData[]
}

const TIER_CONFIG = {
  exact: {
    icon: Star,
    title: '맞춤추천',
    subtitle: '입력하신 조건에 가장 적합한 지원사업입니다',
    borderColor: 'border-l-emerald-500',
    bgColor: 'bg-emerald-50/50 dark:bg-emerald-950/20',
  },
  likely: {
    icon: ThumbsUp,
    title: '추천',
    subtitle: '조건에 부합할 가능성이 높은 지원사업입니다',
    borderColor: 'border-l-blue-500',
    bgColor: 'bg-blue-50/50 dark:bg-blue-950/20',
  },
  related: {
    icon: Bookmark,
    title: '관련사업',
    subtitle: '일부 조건이 맞는 관련 지원사업입니다',
    borderColor: 'border-l-gray-400',
    bgColor: 'bg-gray-50/50 dark:bg-gray-950/20',
  },
} as const

function TierSection({ tier, items }: { tier: 'exact' | 'likely' | 'related'; items: ScoredSupportData[] }) {
  if (items.length === 0) return null
  const config = TIER_CONFIG[tier]
  const Icon = config.icon

  return (
    <section className="mb-10">
      <div className={`mb-4 flex items-center gap-3 rounded-lg border-l-4 ${config.borderColor} ${config.bgColor} px-4 py-3`}>
        <Icon className="h-5 w-5 text-foreground" />
        <div>
          <h2 className="font-bold text-foreground">{config.title} <span className="text-muted-foreground font-normal">({items.length}개)</span></h2>
          <p className="text-sm text-muted-foreground">{config.subtitle}</p>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {items.map((item) => (
          <SupportCard key={item.support.id} support={item.support} />
        ))}
      </div>
    </section>
  )
}

export default function SupportList({ supports, scoredSupports }: SupportListProps) {
  // If no scored data, fall back to flat display
  if (!scoredSupports || scoredSupports.length === 0) {
    if (supports.length === 0) {
      return (
        <div className="rounded-2xl border bg-card p-12 text-center shadow-sm">
          <Search className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <p className="text-lg font-semibold text-foreground">조건에 맞는 지원금이 없습니다</p>
          <p className="mt-2 text-sm text-muted-foreground">
            입력 조건을 변경하면 더 많은 지원금을 찾을 수 있어요.
          </p>
          <Button asChild className="mt-5">
            <Link href="/diagnose">다시 진단하기</Link>
          </Button>
        </div>
      )
    }

    return (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {supports.map((support) => (
          <SupportCard key={support.id} support={support} />
        ))}
      </div>
    )
  }

  const exact = scoredSupports.filter((s) => s.tier === 'exact')
  const likely = scoredSupports.filter((s) => s.tier === 'likely')
  const related = scoredSupports.filter((s) => s.tier === 'related')

  if (scoredSupports.length === 0) {
    return (
      <div className="rounded-2xl border bg-card p-12 text-center shadow-sm">
        <Search className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
        <p className="text-lg font-semibold text-foreground">조건에 맞는 지원금이 없습니다</p>
        <p className="mt-2 text-sm text-muted-foreground">
          입력 조건을 변경하면 더 많은 지원금을 찾을 수 있어요.
        </p>
        <Button asChild className="mt-5">
          <Link href="/diagnose">다시 진단하기</Link>
        </Button>
      </div>
    )
  }

  return (
    <div>
      <TierSection tier="exact" items={exact} />
      <TierSection tier="likely" items={likely} />
      <TierSection tier="related" items={related} />
    </div>
  )
}
