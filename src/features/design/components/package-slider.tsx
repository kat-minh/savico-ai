'use client'

import { useTranslations } from 'next-intl'

import { Slider } from '@/shared/components/ui/slider'
import { cn } from '@/shared/lib/utils'
import { PACKAGE_TIERS } from '../constants/design.constants'
import type { PackageTier } from '../types/design.types'
import { FieldLabel } from '@/shared/components/common'

interface PackageSliderProps {
  value: PackageTier
  onChange: (value: PackageTier) => void
}

/**
 * Trường 6 — Gói hoàn thiện & nội thất (mục III.2).
 * Thanh kéo 3 nấc: Cơ bản - Tiêu chuẩn - VIP; mặc định Tiêu chuẩn.
 * Một gói chung cho cả vật liệu hoàn thiện và nội thất.
 */
export function PackageSlider({ value, onChange }: PackageSliderProps) {
  const t = useTranslations('design.input.packageTier')
  const index = Math.max(0, PACKAGE_TIERS.indexOf(value))

  return (
    <div className='space-y-3'>
      <FieldLabel hint={t('hint')} required>
        {t('label')}
      </FieldLabel>

      <Slider
        min={0}
        max={PACKAGE_TIERS.length - 1}
        step={1}
        value={[index]}
        aria-label={t('label')}
        onValueChange={([next]) => {
          const tier = PACKAGE_TIERS[next ?? 0]
          if (tier) onChange(tier)
        }}
      />

      <div className='flex justify-between'>
        {PACKAGE_TIERS.map((tier) => (
          <button
            key={tier}
            type='button'
            onClick={() => onChange(tier)}
            className={cn(
              'text-xs font-medium transition-colors',
              tier === value ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {t(`options.${tier}`)}
          </button>
        ))}
      </div>
    </div>
  )
}
