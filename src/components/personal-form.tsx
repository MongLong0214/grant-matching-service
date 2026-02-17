'use client'

import { useState } from 'react'
import { Label } from '@/components/ui/label'
import { Combobox } from '@/components/ui/combobox'
import { RadioOptionGroup } from '@/components/radio-option-group'
import { SubmitButton } from '@/components/submit-button'
import { Calendar, User, MapPin, Home, Wallet, Briefcase, Heart, ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  REGIONS,
  AGE_GROUP_OPTIONS,
  GENDER_OPTIONS,
  HOUSEHOLD_TYPE_OPTIONS,
  INCOME_LEVEL_OPTIONS,
  EMPLOYMENT_STATUS_OPTIONS,
  INTEREST_CATEGORY_OPTIONS,
} from '@/constants'
import type { UserInput } from '@/types'
import FormProgress from '@/components/form-progress'

interface PersonalFormProps {
  onSubmit: (data: UserInput) => Promise<void>
  isLoading: boolean
  onBack: () => void
}

const FIELD_LABELS: Record<string, string> = {
  ageGroup: '연령대', gender: '성별', region: '지역',
  householdType: '가구 유형', incomeLevel: '소득 수준',
  employmentStatus: '취업 상태', interestCategories: '관심 분야',
}

export const PersonalForm = ({ onSubmit, isLoading, onBack }: PersonalFormProps) => {
  const [formData, setFormData] = useState({
    ageGroup: '', gender: '', region: '',
    householdType: '', incomeLevel: '', employmentStatus: '',
    interestCategories: [] as string[],
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const filledCount = [
    formData.ageGroup, formData.gender, formData.region,
    formData.householdType, formData.incomeLevel, formData.employmentStatus,
    formData.interestCategories.length > 0 ? 'filled' : '',
  ].filter(Boolean).length

  function update(field: string, value: string) {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => { const { [field]: _, ...rest } = prev; return rest })
    }
  }

  function toggleInterest(value: string) {
    setFormData(prev => {
      const cats = prev.interestCategories.includes(value)
        ? prev.interestCategories.filter(c => c !== value)
        : [...prev.interestCategories, value]
      return { ...prev, interestCategories: cats }
    })
  }

  function validate(): Record<string, string> {
    const e: Record<string, string> = {}
    for (const [field, label] of Object.entries(FIELD_LABELS)) {
      if (field === 'interestCategories') {
        if (formData.interestCategories.length === 0) e[field] = `${label}를 하나 이상 선택해주세요.`
      } else if (!formData[field as keyof typeof formData]) {
        e[field] = `${label}을(를) 선택해주세요.`
      }
    }
    setErrors(e)
    return e
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault()
    if (Object.keys(validate()).length > 0) return
    await onSubmit({ userType: 'personal', ...formData })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" aria-label="개인 혜택 진단 폼">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        유형 다시 선택
      </button>

      <FormProgress filledCount={filledCount} totalCount={7} />

      <RadioOptionGroup
        label="연령대"
        icon={<Calendar className="h-4 w-4" aria-hidden="true" />}
        options={AGE_GROUP_OPTIONS}
        value={formData.ageGroup}
        onValueChange={(val) => update('ageGroup', val)}
        error={errors.ageGroup}
      />
      <RadioOptionGroup
        label="성별"
        icon={<User className="h-4 w-4" aria-hidden="true" />}
        options={GENDER_OPTIONS}
        value={formData.gender}
        onValueChange={(val) => update('gender', val)}
        error={errors.gender}
        columns={2}
      />

      {/* 거주 지역 - Combobox */}
      <div className="space-y-2">
        <Label htmlFor="personal-region" className="flex items-center gap-2 text-sm font-bold">
          <MapPin className="h-4 w-4" aria-hidden="true" />
          거주 지역
        </Label>
        <Combobox
          id="personal-region"
          options={[...REGIONS]}
          value={formData.region}
          onValueChange={(val) => update('region', val)}
          placeholder="지역을 선택해주세요"
          aria-label="지역 선택"
          aria-invalid={!!errors.region}
          aria-describedby={errors.region ? 'personal-region-error' : undefined}
        />
        {errors.region && (
          <p id="personal-region-error" className="text-xs text-destructive" role="alert">{errors.region}</p>
        )}
      </div>

      <RadioOptionGroup
        label="가구 유형"
        icon={<Home className="h-4 w-4" aria-hidden="true" />}
        options={HOUSEHOLD_TYPE_OPTIONS}
        value={formData.householdType}
        onValueChange={(val) => update('householdType', val)}
        error={errors.householdType}
      />
      <RadioOptionGroup
        label="소득 수준"
        icon={<Wallet className="h-4 w-4" aria-hidden="true" />}
        options={INCOME_LEVEL_OPTIONS}
        value={formData.incomeLevel}
        onValueChange={(val) => update('incomeLevel', val)}
        error={errors.incomeLevel}
        columns={2}
      />
      <RadioOptionGroup
        label="취업 상태"
        icon={<Briefcase className="h-4 w-4" aria-hidden="true" />}
        options={EMPLOYMENT_STATUS_OPTIONS}
        value={formData.employmentStatus}
        onValueChange={(val) => update('employmentStatus', val)}
        error={errors.employmentStatus}
      />

      {/* 관심 분야 - 멀티셀렉트 (체크박스) */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2 text-sm font-bold">
          <Heart className="h-4 w-4" aria-hidden="true" />
          관심 분야 <span className="font-normal text-muted-foreground">(복수 선택 가능)</span>
        </Label>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3" role="group" aria-label="관심 분야 선택">
          {INTEREST_CATEGORY_OPTIONS.map(opt => (
            <label
              key={opt.value}
              className={cn(
                'flex cursor-pointer items-center justify-center rounded-xl border px-3 py-2.5 text-sm font-medium transition-all duration-200 hover:bg-accent active:scale-[0.97]',
                formData.interestCategories.includes(opt.value)
                  ? 'border-primary bg-primary/10 text-primary shadow-sm'
                  : 'border-input hover:border-primary/20'
              )}
            >
              <input
                type="checkbox"
                className="sr-only"
                checked={formData.interestCategories.includes(opt.value)}
                onChange={() => toggleInterest(opt.value)}
              />
              {opt.label}
            </label>
          ))}
        </div>
        {errors.interestCategories && (
          <p className="text-xs text-destructive" role="alert">{errors.interestCategories}</p>
        )}
      </div>

      <SubmitButton isLoading={isLoading} label="내 혜택 찾기" />
    </form>
  )
}
