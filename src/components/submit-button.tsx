'use client'

import { Button } from '@/components/ui/button'
import { Loader2, Search } from 'lucide-react'

interface SubmitButtonProps {
  isLoading: boolean
  label: string
}

export const SubmitButton = ({ isLoading, label }: SubmitButtonProps) => {
  return (
    <Button
      type="submit"
      disabled={isLoading}
      aria-label={isLoading ? '분석 진행 중' : label}
      className="h-14 w-full rounded-xl bg-gradient-to-r from-primary to-emerald-600 text-base font-bold text-white shadow-lg shadow-primary/30 transition-all hover:-translate-y-0.5"
    >
      {isLoading ? (
        <>
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
          분석 중...
        </>
      ) : (
        <>
          <Search className="h-5 w-5" aria-hidden="true" />
          {label}
        </>
      )}
    </Button>
  )
}
