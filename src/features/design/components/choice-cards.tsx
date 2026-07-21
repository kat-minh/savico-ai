'use client'

import { Check } from 'lucide-react'

import { Photo } from '@/shared/components/common'
import { cn } from '@/shared/lib/utils'

export interface ChoiceOption {
  value: string
  label: string
  /** Ảnh minh họa cho thẻ ảnh chọn nhanh. Bỏ trống khi dùng `compact`. */
  imageUrl?: string
}

interface ChoiceCardsProps {
  options: readonly ChoiceOption[]
  value: string | null
  onChange: (value: string) => void
  /** Compact pill buttons instead of image cards (Quy mô, Tum). */
  compact?: boolean
  invalid?: boolean
  className?: string
}

/**
 * Nút / thẻ ảnh chọn nhanh dùng cho Quy mô, Tum, Kiểu kiến trúc và Phong cách
 * nội thất (mục III.2, trường 4, 5, 7, 8).
 */
export function ChoiceCards({ options, value, onChange, compact, invalid, className }: ChoiceCardsProps) {
  if (compact) {
    return (
      <div className={cn('flex flex-wrap gap-2', className)}>
        {options.map((option) => (
          <button
            key={option.value}
            type='button'
            aria-pressed={option.value === value}
            onClick={() => onChange(option.value)}
            className={cn(
              'rounded-full border px-4 py-2 text-sm font-medium transition-colors',
              option.value === value
                ? 'border-primary bg-primary text-primary-foreground'
                : 'hover:border-primary/50 hover:bg-muted/60',
              invalid && option.value !== value && 'border-destructive/60'
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className={cn('grid grid-cols-2 gap-3 sm:grid-cols-3', className)}>
      {options.map((option) => {
        const selected = option.value === value
        return (
          <button
            key={option.value}
            type='button'
            aria-pressed={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              'group overflow-hidden rounded-xl border text-left transition-all',
              selected ? 'border-primary ring-primary/40 ring-2' : 'hover:border-primary/50',
              invalid && !selected && 'border-destructive/60'
            )}
          >
            <div className='relative'>
              {option.imageUrl ? (
                <Photo className='aspect-4/3 w-full' src={option.imageUrl} alt={option.label} sizes='240px' />
              ) : (
                <span className='bg-muted block aspect-4/3 w-full' />
              )}
              {selected ? (
                <span className='bg-primary text-primary-foreground absolute top-2 right-2 flex size-6 items-center justify-center rounded-full'>
                  <Check className='size-3.5' />
                </span>
              ) : null}
            </div>
            <span className='block px-3 py-2 text-sm font-medium'>{option.label}</span>
          </button>
        )
      })}
    </div>
  )
}
