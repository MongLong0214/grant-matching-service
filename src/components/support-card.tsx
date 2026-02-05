import { Badge } from '@/components/ui/badge'
import { Clock, CalendarDays, ArrowRight } from 'lucide-react'
import { CATEGORY_COLORS } from '@/constants'
import type { Support } from '@/types'

interface SupportCardProps {
  support: Support
}

/**
 * 지원금 카드 컴포넌트
 *
 * 개별 지원금 정보를 카드 형태로 표시
 * 분야 뱃지, 제목, 기관명, 마감일, 지원 금액 표시
 */
export default function SupportCard({ support }: SupportCardProps) {
  const categoryColor = CATEGORY_COLORS[support.category] || CATEGORY_COLORS['기타']

  /** 마감일을 D-day 형식으로 변환 */
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

  const deadline = formatDeadline(support.endDate)
  const isUrgent = deadline === 'D-Day' || (deadline !== '상시' && deadline !== '마감' && !isNaN(parseInt(deadline.replace('D-', ''))) && parseInt(deadline.replace('D-', '')) <= 7)
  const isAlwaysOpen = deadline === '상시'

  return (
    <div className="group rounded-2xl border border-border bg-card p-6 shadow-sm transition-all duration-200 hover:border-primary/40 hover:shadow-md">
      {/* Top Row: Category and Deadline */}
      <div className="mb-3 flex items-center justify-between">
        <Badge variant="outline" className={`${categoryColor.bg} ${categoryColor.text} border-0`}>
          {support.category}
        </Badge>
        <div
          className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${
            isUrgent
              ? 'bg-red-50 text-red-600'
              : isAlwaysOpen
                ? 'bg-emerald-50 text-emerald-600'
                : 'bg-muted text-muted-foreground'
          }`}
        >
          {isUrgent ? (
            <Clock className="h-3 w-3" />
          ) : (
            <CalendarDays className="h-3 w-3" />
          )}
          <span>{deadline}</span>
        </div>
      </div>

      {/* Title */}
      <h3 className="text-xl font-bold leading-tight text-foreground group-hover:text-primary">
        {support.title}
      </h3>

      {/* Organization */}
      <p className="mt-1 text-sm text-muted-foreground">{support.organization}</p>

      {/* Confidence Badge */}
      {support.extractionConfidence && (
        <div className="mt-2 flex items-center gap-1">
          {(() => {
            const values = Object.values(support.extractionConfidence)
            const avg = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0
            const level = avg >= 0.7 ? 'high' : avg >= 0.4 ? 'medium' : 'low'
            const config = {
              high: { label: '높은 신뢰도', bg: 'bg-emerald-100 dark:bg-emerald-900/40', text: 'text-emerald-700 dark:text-emerald-300' },
              medium: { label: '보통 신뢰도', bg: 'bg-amber-100 dark:bg-amber-900/40', text: 'text-amber-700 dark:text-amber-300' },
              low: { label: '낮은 신뢰도', bg: 'bg-gray-100 dark:bg-gray-800/40', text: 'text-gray-600 dark:text-gray-400' },
            }[level]
            return (
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${config.bg} ${config.text}`}>
                {config.label}
              </span>
            )
          })()}
        </div>
      )}

      {/* Amount */}
      {support.amount && (
        <div className="mt-4 rounded-lg bg-muted p-3">
          <p className="text-xs text-muted-foreground">지원 혜택</p>
          <p className="mt-1 text-xl font-bold text-primary">{support.amount}</p>
        </div>
      )}

      {/* Footer */}
      {support.detailUrl && (
        <div className="mt-6 flex justify-end border-t border-border pt-4">
          <a
            href={support.detailUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${support.title} 자세히 보기`}
            className="inline-flex items-center gap-1.5 text-sm font-bold text-primary transition-all hover:gap-2.5"
          >
            자세히 보기
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </a>
        </div>
      )}
    </div>
  )
}
