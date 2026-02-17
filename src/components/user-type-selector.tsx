'use client'

import { User, Building2, ArrowRight } from 'lucide-react'
import type { UserType } from '@/types'

export const UserTypeSelector = ({ onSelect }: { onSelect: (type: UserType) => void }) => {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-xl font-bold text-foreground sm:text-2xl">어떤 혜택을 찾으시나요?</h2>
        <p className="mt-2 text-sm text-muted-foreground">유형에 맞는 맞춤 분석을 제공합니다</p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => onSelect('personal')}
          className="group flex flex-col items-center gap-5 rounded-2xl border-2 border-border/60 bg-card p-8 text-center transition-all duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg active:scale-[0.98]"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 transition-all duration-200 group-hover:bg-primary/15 group-hover:scale-110">
            <User className="h-8 w-8 text-primary" aria-hidden="true" />
          </div>
          <div>
            <p className="text-lg font-bold text-foreground">개인 혜택</p>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              주거 / 육아 / 교육 / 건강 등
              <br />
              생활 복지 혜택 찾기
            </p>
          </div>
          <span className="inline-flex items-center gap-1 text-sm font-medium text-primary opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            시작하기 <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
        </button>
        <button
          type="button"
          onClick={() => onSelect('business')}
          className="group flex flex-col items-center gap-5 rounded-2xl border-2 border-border/60 bg-card p-8 text-center transition-all duration-200 hover:-translate-y-1 hover:border-emerald-400/40 hover:shadow-lg active:scale-[0.98]"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 transition-all duration-200 group-hover:bg-emerald-100 group-hover:scale-110">
            <Building2 className="h-8 w-8 text-emerald-600" aria-hidden="true" />
          </div>
          <div>
            <p className="text-lg font-bold text-foreground">사업자 지원금</p>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              창업 / 고용 / 수출 / R&D 등
              <br />
              사업 관련 지원금 찾기
            </p>
          </div>
          <span className="inline-flex items-center gap-1 text-sm font-medium text-emerald-600 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            시작하기 <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
        </button>
      </div>
    </div>
  )
}
