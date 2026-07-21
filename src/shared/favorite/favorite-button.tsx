'use client'

import { Heart } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Button } from '@/shared/components/ui/button'
import { cn } from '@/shared/lib/utils'
import { useFavoriteStore } from './favorite.store'
import type { FavoriteInput } from './favorite.types'
import { useIsFavorite } from './use-favorite'

interface FavoriteButtonProps {
  /** Everything the account screen needs to render this item later (mục IV). */
  item: FavoriteInput
  className?: string
  /** `icon` for the ♥ overlaid on a card; `full` for a labelled button. */
  variant?: 'icon' | 'full'
}

/**
 * Nút ♥ Yêu thích dùng chung ở mọi vị trí (mục VI): bấm để lưu, bấm lại để bỏ.
 * Trạng thái hiển thị nhất quán trên mọi màn hình vì cùng đọc `useFavoriteStore`.
 */
export function FavoriteButton({ item, className, variant = 'icon' }: FavoriteButtonProps) {
  const t = useTranslations('favorite')
  const active = useIsFavorite(item.templateId)
  const toggle = useFavoriteStore((s) => s.toggle)

  const label = active ? t('remove') : t('add')

  return (
    <Button
      type='button'
      variant={variant === 'icon' ? 'ghost' : 'outline'}
      size={variant === 'icon' ? 'icon' : 'sm'}
      aria-pressed={active}
      aria-label={label}
      title={label}
      onClick={(event) => {
        event.preventDefault()
        event.stopPropagation()
        toggle(item)
      }}
      className={cn(variant === 'icon' && 'rounded-full', className)}
    >
      <Heart className={cn('size-4 transition-colors', active && 'fill-primary text-primary')} />
      {variant === 'full' ? label : null}
    </Button>
  )
}
