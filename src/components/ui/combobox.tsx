'use client'

import * as React from 'react'
import * as Popover from '@radix-ui/react-popover'
import { Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ComboboxProps {
  options: string[]
  value: string
  onValueChange: (val: string) => void
  placeholder: string
  id?: string
  'aria-label'?: string
  'aria-invalid'?: boolean
  'aria-describedby'?: string
  onBlur?: () => void
}

export function Combobox({
  options,
  value,
  onValueChange,
  placeholder,
  id,
  'aria-label': ariaLabel,
  'aria-invalid': ariaInvalid,
  'aria-describedby': ariaDescribedby,
  onBlur,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const listboxId = id ? `${id}-listbox` : 'combobox-listbox'

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          id={id}
          role="combobox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-label={ariaLabel}
          aria-invalid={ariaInvalid}
          aria-describedby={ariaDescribedby}
          onBlur={onBlur}
          className={cn(
            'flex h-12 w-full items-center justify-between rounded-xl border border-border bg-muted px-4 text-base transition-colors',
            'hover:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            !value && 'text-muted-foreground'
          )}
        >
          <span className="truncate">
            {value || placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" aria-hidden="true" />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          className="z-50 w-[var(--radix-popover-trigger-width)] rounded-xl border border-border bg-popover p-0 shadow-md animate-in fade-in-0 zoom-in-95"
          sideOffset={4}
          align="start"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <div className="max-h-[240px] overflow-y-auto p-1" role="listbox" id={listboxId} aria-label={ariaLabel}>
            {options.map((option) => (
              <button
                key={option}
                type="button"
                role="option"
                aria-selected={value === option}
                onClick={() => {
                  onValueChange(option === value ? '' : option)
                  setOpen(false)
                }}
                className={cn(
                  'relative flex w-full cursor-pointer select-none items-center rounded-lg px-3 py-2.5 text-sm outline-none transition-colors',
                  'hover:bg-accent focus-visible:bg-accent focus-visible:outline-none',
                  value === option && 'bg-accent/50 font-medium'
                )}
              >
                <Check
                  className={cn(
                    'mr-2 h-4 w-4 shrink-0',
                    value === option ? 'opacity-100' : 'opacity-0'
                  )}
                  aria-hidden="true"
                />
                {option}
              </button>
            ))}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
