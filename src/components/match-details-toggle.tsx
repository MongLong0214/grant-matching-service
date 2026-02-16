'use client'

import { useId, useState } from 'react'
import { ChevronDown } from 'lucide-react'

type BreakdownData = Record<string, number>

interface MatchDetailsToggleProps {
  breakdown: BreakdownData
  confidence?: number
  breakdownLabels: { key: string; label: string }[]
}

/** 점수에 따른 바 색상 */
function getBarColor(value: number): string {
  if (value >= 70) return 'bg-emerald-500'
  if (value >= 40) return 'bg-amber-400'
  return 'bg-gray-300'
}

/** 점수에 따른 텍스트 색상 */
function getTextColor(value: number): string {
  if (value >= 70) return 'text-emerald-600'
  if (value >= 40) return 'text-amber-600'
  return 'text-gray-400'
}

export function MatchDetailsToggle({ breakdown, confidence, breakdownLabels }: MatchDetailsToggleProps) {
  const [isOpen, setIsOpen] = useState(false)
  const panelId = useId()

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        aria-expanded={isOpen}
        aria-controls={panelId}
      >
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
        매칭 상세
      </button>

      {isOpen && (
        <div id={panelId} className="mt-3 space-y-2.5">
          {breakdownLabels.map(({ key, label }) => {
            const value = breakdown[key]
            return (
              <div key={key} className="flex items-center gap-3">
                <span className="w-20 shrink-0 text-xs text-muted-foreground">{label}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${getBarColor(value)}`}
                    style={{ width: `${value}%` }}
                  />
                </div>
                <span className={`w-10 shrink-0 text-right text-xs font-semibold ${getTextColor(value)}`}>
                  {value}%
                </span>
              </div>
            )
          })}

          {/* 종합 신뢰도 */}
          {confidence != null && (
            <div className="mt-1 flex items-center gap-2 border-t border-border/40 pt-2">
              <span className="text-xs text-muted-foreground">종합 신뢰도</span>
              <div className="flex items-center gap-1.5">
                <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${getBarColor(confidence)}`}
                    style={{ width: `${confidence}%` }}
                  />
                </div>
                <span className={`text-xs font-semibold ${getTextColor(confidence)}`}>
                  {confidence}%
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
