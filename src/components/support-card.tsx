import { Card } from '@/components/ui/card'
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
  const isUrgent = deadline !== '상시' && deadline !== '마감' && parseInt(deadline.replace('D-', '')) <= 7

  return (
    <Card className="transition-shadow hover:shadow-md">
      <div className="space-y-3">
        {/* 상단: 카테고리 뱃지 + 마감일 */}
        <div className="flex items-center justify-between">
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${categoryColor.bg} ${categoryColor.text}`}>
            {support.category}
          </span>
          <span className={`text-xs font-medium ${isUrgent ? 'text-red-500' : 'text-slate-500'}`}>
            {deadline}
          </span>
        </div>

        {/* 제목 */}
        <h3 className="text-base font-semibold text-slate-900 line-clamp-2">
          {support.title}
        </h3>

        {/* 기관명 */}
        <p className="text-sm text-slate-500">
          {support.organization}
        </p>

        {/* 지원 금액 */}
        {support.amount && (
          <p className="text-sm font-medium text-blue-600">
            {support.amount}
          </p>
        )}

        {/* 자세히 보기 링크 */}
        <a
          href={support.detailUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          자세히 보기
          <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </a>
      </div>
    </Card>
  )
}
