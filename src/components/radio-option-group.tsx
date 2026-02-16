'use client'

import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { cn } from '@/lib/utils'

interface RadioOptionGroupProps {
  label: string
  icon: React.ReactNode
  options: readonly { label: string; value: string | number }[]
  value: string
  onValueChange: (value: string) => void
  error?: string
  columns?: 2 | 3
}

export const RadioOptionGroup = ({
  label,
  icon,
  options,
  value,
  onValueChange,
  error,
  columns = 3,
}: RadioOptionGroupProps) => {
  const gridClass = columns === 2
    ? 'grid grid-cols-2 gap-3'
    : 'grid grid-cols-2 gap-3 sm:grid-cols-3'

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2 text-sm font-bold">
        {icon}
        {label}
      </Label>
      <RadioGroup
        aria-label={`${label} 선택`}
        value={value}
        onValueChange={onValueChange}
        className={gridClass}
      >
        {options.map(opt => (
          <label
            key={opt.value}
            className={cn(
              'flex cursor-pointer items-center justify-center rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors hover:bg-accent has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring has-[:focus-visible]:ring-offset-2',
              value === String(opt.value)
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-input'
            )}
          >
            <RadioGroupItem value={String(opt.value)} className="sr-only" />
            {opt.label}
          </label>
        ))}
      </RadioGroup>
      {error && (
        <p className="text-xs text-destructive" role="alert">{error}</p>
      )}
    </div>
  )
}
