'use client'

import { useState } from 'react'
import { Label } from '@/components/ui/label'
import { Combobox } from '@/components/ui/combobox'
import { RadioOptionGroup } from '@/components/radio-option-group'
import { SubmitButton } from '@/components/submit-button'
import { Store, MapPin, Users, Banknote, Clock, UserCircle, ArrowLeft } from 'lucide-react'
import {
  BUSINESS_TYPES, REGIONS, EMPLOYEE_OPTIONS,
  REVENUE_OPTIONS, BUSINESS_AGE_OPTIONS, FOUNDER_AGE_OPTIONS,
} from '@/constants'
import type { UserInput } from '@/types'
import FormProgress from '@/components/form-progress'

interface BusinessFormProps {
  onSubmit: (data: UserInput) => Promise<void>
  isLoading: boolean
  onBack?: () => void
}

const FIELD_LABELS: Record<string, string> = {
  businessType: '업종', region: '지역', employeeCount: '직원 수',
  annualRevenue: '연 매출', businessAge: '업력', founderAge: '대표자 연령대',
}

export const BusinessForm = ({ onSubmit, isLoading, onBack }: BusinessFormProps) => {
  const [formData, setFormData] = useState({
    businessType: '', region: '', employeeCount: '',
    annualRevenue: '', businessAge: '', founderAge: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const filledCount = Object.values(formData).filter(Boolean).length

  function update(field: string, value: string) {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => { const { [field]: _, ...rest } = prev; return rest })
    }
  }

  function validateField(fieldName: string) {
    const label = FIELD_LABELS[fieldName]
    if (!label) return
    setErrors(prev => {
      if (!formData[fieldName as keyof typeof formData]) {
        return { ...prev, [fieldName]: `${label}을(를) 선택해주세요.` }
      }
      const { [fieldName]: _, ...rest } = prev
      return rest
    })
  }

  function validate(): Record<string, string> {
    const e: Record<string, string> = {}
    for (const [field, label] of Object.entries(FIELD_LABELS)) {
      if (!formData[field as keyof typeof formData]) {
        e[field] = `${label}을(를) 선택해주세요.`
      }
    }
    setErrors(e)
    return e
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault()
    const validationErrors = validate()
    if (Object.keys(validationErrors).length > 0) {
      const el = document.getElementById(Object.keys(validationErrors)[0])
      el?.focus()
      return
    }
    await onSubmit({
      userType: 'business',
      businessType: formData.businessType,
      region: formData.region,
      employeeCount: Number(formData.employeeCount),
      annualRevenue: Number(formData.annualRevenue),
      businessAge: Number(formData.businessAge),
      founderAge: Number(formData.founderAge),
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" aria-label="사업자 진단 폼">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          유형 다시 선택
        </button>
      )}

      <FormProgress filledCount={filledCount} totalCount={6} />

      {/* 업종 - Combobox */}
      <div className="space-y-2">
        <Label htmlFor="businessType" className="flex items-center gap-2 text-sm font-bold">
          <Store className="h-4 w-4" aria-hidden="true" />
          업종
        </Label>
        <Combobox
          id="businessType"
          options={[...BUSINESS_TYPES]}
          value={formData.businessType}
          onValueChange={(val) => update('businessType', val)}
          placeholder="업종을 선택해주세요"
          aria-label="업종 선택"
          aria-invalid={!!errors.businessType}
          aria-describedby={errors.businessType ? 'businessType-error' : undefined}
          onBlur={() => validateField('businessType')}
        />
        {errors.businessType && (
          <p id="businessType-error" className="text-xs text-destructive" role="alert">{errors.businessType}</p>
        )}
      </div>

      {/* 지역 - Combobox */}
      <div className="space-y-2">
        <Label htmlFor="region" className="flex items-center gap-2 text-sm font-bold">
          <MapPin className="h-4 w-4" aria-hidden="true" />
          지역
        </Label>
        <Combobox
          id="region"
          options={[...REGIONS]}
          value={formData.region}
          onValueChange={(val) => update('region', val)}
          placeholder="지역을 선택해주세요"
          aria-label="지역 선택"
          aria-invalid={!!errors.region}
          aria-describedby={errors.region ? 'region-error' : undefined}
          onBlur={() => validateField('region')}
        />
        {errors.region && (
          <p id="region-error" className="text-xs text-destructive" role="alert">{errors.region}</p>
        )}
      </div>

      <RadioOptionGroup
        label="직원 수"
        icon={<Users className="h-4 w-4" aria-hidden="true" />}
        options={EMPLOYEE_OPTIONS}
        value={formData.employeeCount}
        onValueChange={(val) => update('employeeCount', val)}
        error={errors.employeeCount}
      />
      <RadioOptionGroup
        label="연 매출"
        icon={<Banknote className="h-4 w-4" aria-hidden="true" />}
        options={REVENUE_OPTIONS}
        value={formData.annualRevenue}
        onValueChange={(val) => update('annualRevenue', val)}
        error={errors.annualRevenue}
      />
      <RadioOptionGroup
        label="업력"
        icon={<Clock className="h-4 w-4" aria-hidden="true" />}
        options={BUSINESS_AGE_OPTIONS}
        value={formData.businessAge}
        onValueChange={(val) => update('businessAge', val)}
        error={errors.businessAge}
      />
      <RadioOptionGroup
        label="대표자 연령대"
        icon={<UserCircle className="h-4 w-4" aria-hidden="true" />}
        options={FOUNDER_AGE_OPTIONS}
        value={formData.founderAge}
        onValueChange={(val) => update('founderAge', val)}
        error={errors.founderAge}
      />

      <SubmitButton isLoading={isLoading} label="내 지원금 찾기" />
    </form>
  )
}
