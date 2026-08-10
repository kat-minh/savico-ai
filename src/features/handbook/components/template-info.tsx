'use client'

import { Building2, Layers, Ruler, Square } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { cn } from '@/shared/lib/utils'
import type { HandbookTemplate } from '../types/handbook.types'

/**
 * Khung "Thông tin bản vẽ" / "Thông tin mẫu" + đoạn mô tả (Hình 2, 7, 8).
 *
 * Mẫu 2D liệt kê số liệu kỹ thuật (kích thước lô, diện tích); mẫu 3D đổi sang
 * phong cách và số ảnh trong bộ, vì người xem mẫu 3D tìm cảm hứng thẩm mỹ chứ
 * không tra kích thước.
 */
export function TemplateInfo({ template, className }: { template: HandbookTemplate; className?: string }) {
  const t = useTranslations('handbook.info')
  const { specs } = template

  const rows =
    template.kind === '2d'
      ? [
          { icon: Building2, label: t('buildingType'), value: specs.buildingTypeLabel },
          { icon: Layers, label: t('floorsPlan'), value: specs.floorLabel },
          { icon: Ruler, label: t('lotSize'), value: specs.lotSize },
          { icon: Square, label: t('floorArea'), value: specs.floorArea }
        ]
      : [
          { icon: Building2, label: t('buildingType'), value: specs.buildingTypeLabel },
          { icon: Square, label: t('style'), value: template.styleLabel },
          // Số ảnh 3D chỉ hiện trên THẺ lưới (mục 2.2); Hình 8 không đưa nó vào
          // khung thông tin nên ở đây bỏ.
          { icon: Layers, label: t('floors'), value: specs.floorLabel }
        ]

  return (
    <div className={cn('space-y-4', className)}>
      <div>
        <h3 className='text-base font-semibold'>{template.kind === '2d' ? t('planTitle') : t('templateTitle')}</h3>
        <dl className='mt-3 space-y-0'>
          {rows.map((row) =>
            row.value ? (
              <div key={row.label} className='flex items-center justify-between gap-4 border-b py-2.5 last:border-0'>
                <dt className='text-muted-foreground flex items-center gap-2 text-sm'>
                  <row.icon className='text-primary size-4 shrink-0' />
                  {row.label}
                </dt>
                <dd className='text-sm font-medium'>{row.value}</dd>
              </div>
            ) : null
          )}
        </dl>
      </div>

      <div>
        <h3 className='text-base font-semibold'>
          {template.kind === '2d' ? t('planDescription') : t('templateDescription')}
        </h3>
        <div className='mt-2 space-y-2'>
          {template.description.map((paragraph) => (
            <p key={paragraph} className='text-muted-foreground text-sm leading-relaxed'>
              {paragraph}
            </p>
          ))}
        </div>
      </div>
    </div>
  )
}
