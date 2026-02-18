'use client'

import { REGIONS, REGION_DISTRICTS } from '@/constants'
import { Combobox } from '@/components/ui/combobox'

interface RegionSelectorProps {
  region: string
  subRegion: string
  onRegionChange: (region: string) => void
  onSubRegionChange: (subRegion: string) => void
  regionId?: string
  subRegionId?: string
  regionError?: string
  onRegionBlur?: () => void
}

export const RegionSelector = ({
  region,
  subRegion,
  onRegionChange,
  onSubRegionChange,
  regionId,
  subRegionId,
  regionError,
  onRegionBlur,
}: RegionSelectorProps) => {
  const districts = region ? (REGION_DISTRICTS[region] ?? []) : []

  function handleRegionChange(val: string) {
    onRegionChange(val)
    onSubRegionChange('')
  }

  return (
    <div className="space-y-3">
      <Combobox
        id={regionId}
        options={[...REGIONS]}
        value={region}
        onValueChange={handleRegionChange}
        placeholder="시/도를 선택해주세요"
        aria-label="시/도 선택"
        aria-invalid={!!regionError}
        aria-describedby={regionError ? `${regionId}-error` : undefined}
        onBlur={onRegionBlur}
      />
      {regionError && (
        <p id={`${regionId}-error`} className="text-xs text-destructive" role="alert">{regionError}</p>
      )}

      {districts.length > 0 && (
        <div className="space-y-1.5">
          <span className="text-xs text-muted-foreground">구/군 (선택 사항)</span>
          <Combobox
            id={subRegionId}
            options={districts}
            value={subRegion}
            onValueChange={onSubRegionChange}
            placeholder="구/군을 선택해주세요"
            aria-label="구/군 선택"
          />
        </div>
      )}
    </div>
  )
}
