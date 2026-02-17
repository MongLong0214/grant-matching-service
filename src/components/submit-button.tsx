'use client'

import { Button } from '@/components/ui/button'
import { Loader2, Search } from 'lucide-react'

interface SubmitButtonProps {
  isLoading: boolean
  label: string
}

export const SubmitButton = ({ isLoading, label }: SubmitButtonProps) => {
  return (
    <div className="pt-2">
      <Button
        type="submit"
        disabled={isLoading}
        aria-label={isLoading ? '분석 진행 중' : label}
        className="h-14 w-full rounded-xl bg-gradient-to-r from-primary to-emerald-600 text-base font-bold text-white shadow-lg shadow-primary/25 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/30 active:scale-[0.99] disabled:pointer-events-none disabled:opacity-70"
      >
        {isLoading ? (
          <span className="inline-flex items-center gap-2.5">
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
            <span>분석 중...</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-2">
            <Search className="h-5 w-5" aria-hidden="true" />
            <span>{label}</span>
          </span>
        )}
      </Button>
      {isLoading && (
        <p className="mt-3 text-center text-xs text-muted-foreground" aria-live="polite">
          6,000개 이상의 지원사업을 분석하고 있습니다
        </p>
      )}
    </div>
  )
}
