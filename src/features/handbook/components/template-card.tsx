'use client'

import { Photo } from '@/shared/components/common'
import { Badge } from '@/shared/components/ui/badge'
import { FavoriteButton } from '@/shared/favorite'
import { cn } from '@/shared/lib/utils'
import type { HandbookTemplate } from '../types/handbook.types'

interface TemplateCardProps {
  template: HandbookTemplate
  className?: string
  /** Bấm thẻ mở xem chi tiết mẫu (mục IV). */
  onOpen?: (template: HandbookTemplate) => void
}

/**
 * Thẻ mẫu tham khảo: ảnh + tên mẫu + tag phong cách, kèm nút ♥ Yêu thích.
 * Cùng một thẻ dùng ở panel cẩm nang (Bước 2/3) và trang Cẩm nang.
 *
 * The "open detail" hit area is a stretched overlay button rather than a wrapper
 * — nesting the ♥ inside another button would be invalid markup and would
 * swallow its clicks.
 */
export function TemplateCard({ template, className, onOpen }: TemplateCardProps) {
  return (
    <article
      className={cn(
        'group bg-card relative overflow-hidden rounded-xl border',
        onOpen && 'hover:border-primary/50 transition-colors',
        className
      )}
    >
      <div className='relative'>
        <Photo className='aspect-4/3 w-full' src={template.imageUrl} alt={template.name} />
        <FavoriteButton
          item={{
            templateId: template.id,
            kind: template.kind,
            name: template.name,
            imageUrl: template.imageUrl,
            tagLabel: template.styleLabel
          }}
          className='bg-background/80 hover:bg-background absolute top-2 right-2 z-10 backdrop-blur'
        />
      </div>

      <div className='space-y-2 p-3'>
        <h3 className='line-clamp-2 text-sm font-semibold'>{template.name}</h3>
        <Badge variant='secondary'>{template.styleLabel}</Badge>
      </div>

      {onOpen ? (
        <button
          type='button'
          onClick={() => onOpen(template)}
          className='focus-visible:ring-ring absolute inset-0 focus-visible:ring-2 focus-visible:outline-none'
        >
          <span className='sr-only'>{template.name}</span>
        </button>
      ) : null}
    </article>
  )
}
