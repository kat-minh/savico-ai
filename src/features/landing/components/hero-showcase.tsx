'use client'

import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'

import type { Locale } from '@/i18n/routing'
import { DossierCover, Photo, PlanDrawing } from '@/shared/components/common'
import { RENDER_IMAGE } from '@/shared/lib/imagery'
import { formatCurrency } from '@/shared/utils'
import { cn } from '@/shared/lib/utils'
import { SHOWCASE_TABS, type ShowcaseTab } from '../constants/landing.constants'

/** Dữ liệu tĩnh minh họa cho tab Dự toán — không gọi API. */
const SAMPLE_ROWS: { key: 'structure' | 'finishing' | 'interior'; amount: number }[] = [
  { key: 'structure', amount: 1_200_000_000 },
  { key: 'finishing', amount: 660_000_000 },
  { key: 'interior', amount: 540_000_000 }
]

/**
 * Khung minh họa sản phẩm TƯƠNG TÁC ở cột phải hero (mục II.2).
 *
 * Một khung lớn trình diễn kết quả mẫu; 4 tab nhỏ phía dưới đổi nội dung khung.
 * Mỗi tab hiện đúng thứ nó hứa: bản vẽ mặt bằng 2D, ảnh phối cảnh, trang bìa bộ
 * hồ sơ, bảng dự toán — dữ liệu tĩnh, chuyển mượt và nhẹ.
 */
export function HeroShowcase() {
  const t = useTranslations('landing.showcase')
  const locale = useLocale() as Locale
  const [tab, setTab] = useState<ShowcaseTab>('floorPlan')

  const total = SAMPLE_ROWS.reduce((sum, row) => sum + row.amount, 0)

  return (
    <div className='space-y-3'>
      <div className='bg-card relative aspect-4/3 overflow-hidden rounded-2xl border shadow-sm'>
        <div key={tab} className='animate-in fade-in size-full duration-300'>
          {tab === 'floorPlan' ? <PlanDrawing className='size-full' /> : null}

          {tab === 'render3d' ? (
            <Photo
              src={RENDER_IMAGE.villa}
              alt={t('tabs.render3d')}
              priority
              sizes='(max-width: 1024px) 100vw, 560px'
              className='size-full'
            />
          ) : null}

          {tab === 'dossier' ? <DossierCover className='size-full' /> : null}

          {tab === 'estimate' ? (
            <div className='flex h-full flex-col justify-center gap-3 p-6 sm:p-8'>
              {SAMPLE_ROWS.map((row) => (
                <div key={row.key} className='flex items-center justify-between border-b pb-2 text-sm'>
                  <span className='text-muted-foreground'>{t(`rows.${row.key}`)}</span>
                  <span className='font-medium tabular-nums'>{formatCurrency(row.amount, locale)}</span>
                </div>
              ))}
              <div className='flex items-center justify-between pt-2'>
                <span className='font-semibold'>{t('rows.total')}</span>
                <span className='text-primary text-lg font-semibold tabular-nums'>{formatCurrency(total, locale)}</span>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div role='tablist' aria-label={t('label')} className='bg-muted/50 grid grid-cols-4 gap-1 rounded-xl p-1'>
        {SHOWCASE_TABS.map((item) => (
          <button
            key={item}
            role='tab'
            type='button'
            aria-selected={tab === item}
            onClick={() => setTab(item)}
            className={cn(
              'rounded-lg px-2 py-2 text-xs font-medium transition-colors sm:text-sm',
              tab === item
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {t(`tabs.${item}`)}
          </button>
        ))}
      </div>
    </div>
  )
}
