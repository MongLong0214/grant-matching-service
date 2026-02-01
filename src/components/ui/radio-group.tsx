'use client'

import { cn } from '@/lib/utils'

interface RadioGroupProps {
  label?: string
  error?: string
  name: string
  options: readonly { label: string; value: string | number }[]
  value?: string | number
  onChange: (value: string) => void
}

/**
 * 라디오 버튼 그룹 컴포넌트
 * 선택형 입력을 위한 라디오 버튼 UI
 */
export function RadioGroup({ label, error, name, options, value, onChange }: RadioGroupProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <span className="block text-sm font-medium text-slate-700">{label}</span>
      )}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {options.map((option) => {
          const isSelected = String(value) === String(option.value)
          return (
            <label
              key={String(option.value)}
              className={cn(
                'flex cursor-pointer items-center justify-center rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors',
                isSelected
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
              )}
            >
              <input
                type="radio"
                name={name}
                value={String(option.value)}
                checked={isSelected}
                onChange={(e) => onChange(e.target.value)}
                className="sr-only"
              />
              {option.label}
            </label>
          )
        })}
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
