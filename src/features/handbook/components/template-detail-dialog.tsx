'use client'

import { useTranslations } from 'next-intl'

import { Photo } from '@/shared/components/common'
import { Badge } from '@/shared/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'
import { FavoriteButton } from '@/shared/favorite'
import type { HandbookTemplate } from '../types/handbook.types'

interface TemplateDetailDialogProps {
  template: HandbookTemplate | null
  onClose: () => void
}

/** Bấm thẻ mẫu → mở xem chi tiết mẫu (mục IV), kèm nút ♥ đồng bộ. */
export function TemplateDetailDialog({ template, onClose }: TemplateDetailDialogProps) {
  const t = useTranslations('handbook.detail')

  return (
    <Dialog open={Boolean(template)} onOpenChange={(open) => !open && onClose()}>
      {/* `flex flex-col` chứ không dùng `grid` mặc định: khi nội dung cao hơn
          max-height, grid bóp hàng lại cho vừa, còn ảnh vẫn giữ đúng tỉ lệ nên
          tràn ra ngoài hàng của nó và đè lên đoạn mô tả bên dưới. Với flex,
          `shrink-0` giữ ảnh nguyên kích thước và phần dư được cuộn. */}
      <DialogContent className='flex flex-col sm:max-w-2xl'>
        {template ? (
          <>
            <DialogHeader>
              <DialogTitle>{template.name}</DialogTitle>
            </DialogHeader>

            <Photo
              className='aspect-4/3 w-full shrink-0 rounded-xl'
              src={template.imageUrl}
              alt={template.name}
              sizes='(max-width: 640px) 100vw, 640px'
            />

            {/* Đoạn mô tả nằm ngay dưới ảnh: ảnh + tag không nói được mẫu này
                hợp với ai, còn thiếu gì — người dùng phải đoán. */}
            <p className='text-sm leading-relaxed'>{template.description}</p>

            <div className='flex flex-wrap items-center gap-2'>
              <Badge>{template.styleLabel}</Badge>
              {Object.entries(template.tags).map(([key, value]) =>
                value === undefined ? null : (
                  <Badge key={key} variant='secondary'>
                    {String(value)}
                  </Badge>
                )
              )}
            </div>

            <FavoriteButton
              variant='full'
              item={{
                templateId: template.id,
                kind: template.kind,
                name: template.name,
                imageUrl: template.imageUrl,
                tagLabel: template.styleLabel
              }}
              className='w-full'
            />

            <p className='text-muted-foreground text-xs'>{t('note')}</p>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
