'use client'

import { useTranslations } from 'next-intl'

import { Link } from '@/i18n/navigation'
import { Badge } from '@/shared/components/ui/badge'
import { handbookTemplateRoute } from '@/shared/constants/routes'
import { FavoriteButton } from '@/shared/favorite'
import { cn } from '@/shared/lib/utils'
import { useHandbookReadStore } from '../store/handbook-read.store'
import type { HandbookTemplate } from '../types/handbook.types'
import { ReadBadge } from './read-badge'
import { TemplateFigure } from './template-figure'

interface TemplateCardProps {
  template: HandbookTemplate
  className?: string
  /**
   * Bấm thẻ mở popup xem nhanh (Hình 2) — chỉ dùng ở màn chờ. Bỏ trống thì thẻ
   * là liên kết sang trang chi tiết, đúng luồng của lưới thư viện.
   */
  onOpen?: (template: HandbookTemplate) => void
  /**
   * `library` (mặc định) — thẻ trong lưới thư viện (Hình 5, Hình 6): tên, dòng
   * thông số và chip.
   * `panel` — thẻ trong panel màn chờ: Hình 1 chỉ có tên + 2 chip, Hình 4 chỉ
   * có tên + dòng "loại công trình · phong cách". Không có dòng thông số.
   */
  variant?: 'library' | 'panel'
}

/**
 * Thẻ mẫu trong lưới thư viện và trong panel màn chờ (Hình 1, Hình 5, Hình 6).
 *
 * Dòng thông số dưới tên là thứ giúp chọn mà không phải mở chi tiết: mẫu 2D ghi
 * kích thước lô · diện tích · số tầng, mẫu 3D ghi quy mô · số ảnh trong bộ.
 *
 * The "open detail" hit area is a stretched overlay button rather than a wrapper
 * — nesting the ♥ inside another button would be invalid markup and would
 * swallow its clicks.
 */
export function TemplateCard({ template, className, onOpen, variant = 'library' }: TemplateCardProps) {
  const t = useTranslations('handbook.card')
  const markRead = useHandbookReadStore((s) => s.markRead)
  const { specs } = template
  const inPanel = variant === 'panel'

  const specLine = (
    template.kind === '2d'
      ? [specs.lotSize, specs.floorArea, specs.floorLabel]
      : [specs.floorLabel, specs.imageCount ? t('imageCount', { count: specs.imageCount }) : undefined]
  ).filter(Boolean)

  return (
    <article
      className={cn(
        // `h-full`: tên mẫu dài ngắn khác nhau nên không có nó thì các thẻ cùng
        // một hàng lưới cao thấp lệch nhau.
        'group bg-card relative h-full overflow-hidden rounded-xl border',
        onOpen && 'hover:border-primary/50 transition-colors',
        className
      )}
    >
      <div className='relative'>
        <TemplateFigure template={template} className='aspect-3/2 w-full' sizes='(max-width: 768px) 100vw, 320px' />
        <FavoriteButton
          item={{
            templateId: template.id,
            kind: template.kind,
            name: template.name,
            imageUrl: template.imageUrl ?? template.floors[0]?.imageUrl ?? '',
            tagLabel: template.styleLabel
          }}
          className='bg-background/80 hover:bg-background absolute top-2 right-2 z-10 backdrop-blur'
        />
      </div>

      <div className='space-y-2 p-3'>
        <h3 className='line-clamp-2 text-sm font-semibold'>{template.name}</h3>

        {/* Dòng thông số màu thương hiệu theo Hình 5 — nó là thông tin để chọn
            mẫu, không phải chú thích phụ. Panel màn chờ không có dòng này. */}
        {!inPanel && specLine.length > 0 ? <p className='text-primary text-xs'>{specLine.join(' · ')}</p> : null}

        {/* Hình 4: thẻ nội thất trong panel chỉ ghi "loại công trình · phong cách". */}
        {inPanel && template.kind === '3d' ? (
          <p className='text-muted-foreground text-xs'>
            {[specs.buildingTypeLabel, template.styleLabel].filter(Boolean).join(' · ')}
          </p>
        ) : (
          <div className='flex flex-wrap items-center gap-2'>
            <Badge variant='secondary'>{template.styleLabel}</Badge>
            <Badge variant='outline'>{template.specs.floorLabel}</Badge>
            <ReadBadge id={template.id} />
          </div>
        )}
      </div>

      {onOpen ? (
        <button
          type='button'
          onClick={() => {
            markRead(template.id)
            onOpen(template)
          }}
          className='focus-visible:ring-ring absolute inset-0 focus-visible:ring-2 focus-visible:outline-none'
        >
          <span className='sr-only'>{template.name}</span>
        </button>
      ) : (
        <Link
          href={handbookTemplateRoute(template.id)}
          onClick={() => markRead(template.id)}
          className='focus-visible:ring-ring absolute inset-0 focus-visible:ring-2 focus-visible:outline-none'
        >
          <span className='sr-only'>{template.name}</span>
        </Link>
      )}
    </article>
  )
}
