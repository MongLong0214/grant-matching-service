import { Badge } from '@/components/ui/badge'
import { Clock, CalendarDays, ExternalLink } from 'lucide-react'
import { CATEGORY_COLORS } from '@/constants'
import type { Support } from '@/types'

interface MatchScore {
  score: number
  tier: string
  confidence?: number
}

interface SupportCardProps {
  support: Support
  matchScore?: MatchScore
}

const TIER_PROGRESS_COLORS: Record<string, string> = {
  tailored: 'bg-gradient-to-r from-emerald-400 to-emerald-600',
  recommended: 'bg-gradient-to-r from-blue-400 to-blue-600',
  exploratory: 'bg-gradient-to-r from-gray-300 to-gray-500',
}

function getConfidenceLabel(confidence?: number): { label: string; className: string } | null {
  if (confidence == null) return null
  if (confidence >= 70) return { label: '높은 신뢰도', className: 'text-emerald-600 dark:text-emerald-400' }
  if (confidence >= 40) return { label: '보통 신뢰도', className: 'text-amber-600 dark:text-amber-400' }
  return { label: '낮은 신뢰도', className: 'text-gray-500 dark:text-gray-400' }
}

function formatDeadline(endDate: string | null): string {
  if (!endDate) return '상시'

  const end = new Date(endDate)
  const now = new Date()
  const diffTime = end.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays < 0) return '마감'
  if (diffDays === 0) return 'D-Day'
  return `D-${diffDays}`
}

export default function SupportCard({ support, matchScore }: SupportCardProps) {
  const categoryColor = CATEGORY_COLORS[support.category] || CATEGORY_COLORS['기타']

  const deadline = formatDeadline(support.endDate)
  const isUrgent = deadline === 'D-Day' || (deadline !== '상시' && deadline !== '마감' && !isNaN(parseInt(deadline.replace('D-', ''))) && parseInt(deadline.replace('D-', '')) <= 7)
  const isAlwaysOpen = deadline === '상시'

  const progressColor = matchScore
    ? (TIER_PROGRESS_COLORS[matchScore.tier] ?? TIER_PROGRESS_COLORS['exploratory'])
    : ''
  const confidenceInfo = matchScore ? getConfidenceLabel(matchScore.confidence) : null

  return (
    <div className="group flex h-full flex-col rounded-xl border border-border/60 bg-card p-5 shadow-sm transition-all duration-200 hover:border-primary/30 hover:shadow-md hover:-translate-y-0.5">
      <div className="mb-3 flex items-center justify-between">
        <Badge variant="outline" className={`${categoryColor.bg} ${categoryColor.text} border-0 text-xs`}>
          {support.category}
        </Badge>
        <div
          className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${
            isUrgent
              ? 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400'
              : isAlwaysOpen
                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
                : 'bg-muted text-muted-foreground'
          }`}
        >
          {isUrgent ? (
            <Clock className="h-3 w-3" aria-hidden="true" />
          ) : (
            <CalendarDays className="h-3 w-3" aria-hidden="true" />
          )}
          <span>{deadline}</span>
        </div>
      </div>

      <h3 className="line-clamp-2 text-lg font-bold leading-snug text-foreground transition-colors duration-200 group-hover:text-primary">
        {support.title}
      </h3>

      <p className="mt-1 text-sm text-muted-foreground">{support.organization}</p>

      {matchScore && (
        <div className="mt-4 flex items-center gap-3">
          <span className="shrink-0 text-sm font-semibold text-foreground">
            매칭 {matchScore.score}%
          </span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
              style={{ width: `${matchScore.score}%` }}
            />
          </div>
          {confidenceInfo && (
            <span className={`shrink-0 text-xs font-medium ${confidenceInfo.className}`}>
              {confidenceInfo.label}
            </span>
          )}
        </div>
      )}

      {support.amount && (
        <div className="mt-3 rounded-lg bg-primary/5 px-3 py-2">
          <p className="text-sm font-semibold text-primary">{support.amount}</p>
        </div>
      )}

      <div className="mt-auto pt-4">
        {support.detailUrl && (
          <a
            href={support.detailUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${support.title} 자세히 보기 (새 창)`}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary transition-colors duration-200 hover:text-primary/80"
          >
            자세히 보기
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        )}
      </div>
    </div>
  )
}
