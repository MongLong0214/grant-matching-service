'use client'

import { User, Building2 } from 'lucide-react'
import type { UserType } from '@/types'

export const UserTypeSelector = ({ onSelect }: { onSelect: (type: UserType) => void }) => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-bold text-foreground">어떤 혜택을 찾으시나요?</h2>
        <p className="mt-1 text-sm text-muted-foreground">유형에 맞는 맞춤 분석을 제공합니다</p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => onSelect('personal')}
          className="group flex flex-col items-center gap-4 rounded-2xl border-2 border-border/60 bg-white p-8 text-center transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 transition-colors group-hover:bg-primary/20">
            <User className="h-8 w-8 text-primary" aria-hidden="true" />
          </div>
          <div>
            <p className="text-lg font-bold text-foreground">개인 혜택</p>
            <p className="mt-1 text-sm text-muted-foreground">
              주거 / 육아 / 교육 / 건강 등
              <br />
              생활 복지 혜택 찾기
            </p>
          </div>
        </button>
        <button
          type="button"
          onClick={() => onSelect('business')}
          className="group flex flex-col items-center gap-4 rounded-2xl border-2 border-border/60 bg-white p-8 text-center transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 transition-colors group-hover:bg-emerald-100">
            <Building2 className="h-8 w-8 text-emerald-600" aria-hidden="true" />
          </div>
          <div>
            <p className="text-lg font-bold text-foreground">사업자 지원금</p>
            <p className="mt-1 text-sm text-muted-foreground">
              창업 / 고용 / 수출 / R&D 등
              <br />
              사업 관련 지원금 찾기
            </p>
          </div>
        </button>
      </div>
    </div>
  )
}
