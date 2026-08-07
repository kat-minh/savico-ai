'use client'

import { useLocale, useTranslations } from 'next-intl'

import type { Locale } from '@/i18n/routing'
import { formatCurrency } from '@/shared/utils'
import { costShares } from '../services/estimate.service'
import type { EstimateSection } from '../types/design.types'

/** Semantic chart tokens — never raw hex (design-token rule). */
const SECTION_COLOR = {
  structure: 'var(--chart-1)',
  finishing: 'var(--chart-2)',
  interior: 'var(--chart-3)'
} as const

/**
 * Biểu đồ tròn tỷ trọng chi phí 3 phần (mục IV.5, Hình 08).
 *
 * Hình tròn ĐẶC (không khoét lỗ) như demo; số % nằm trực tiếp trên từng miếng.
 * Chú thích bên phải: chấm màu + tên phần, số tiền xuống dòng bên dưới.
 */
export function CostDonut({ sections }: { sections: readonly EstimateSection[] }) {
  const t = useTranslations('design.estimate')
  const locale = useLocale() as Locale
  const shares = costShares(sections)

  // Hình tròn đặc: vẽ bằng nét dày bằng bán kính trên đường tròn bán kính r/2,
  // nên cung vẫn tính theo `strokeDasharray` mà không để lại lỗ ở giữa.
  const radius = 50
  const circumference = 2 * Math.PI * radius

  // Precompute each slice's arc length and its start offset, so rendering stays
  // a pure map over data rather than mutating a cursor mid-render.
  const slices = shares.reduce<
    { section: (typeof shares)[number]['section']; percent: number; amount: number; length: number; start: number }[]
  >((acc, share) => {
    const previous = acc[acc.length - 1]
    const start = previous ? previous.start + previous.length : 0
    acc.push({ ...share, length: (share.percent / 100) * circumference, start })
    return acc
  }, [])

  return (
    <div className='flex flex-col items-center gap-6 sm:flex-row sm:items-center'>
      <div className='relative size-44 shrink-0'>
        <svg viewBox='0 0 200 200' className='size-full -rotate-90'>
          {slices.map((slice) => (
            <circle
              key={slice.section}
              cx='100'
              cy='100'
              r={radius}
              fill='none'
              strokeWidth='100'
              stroke={SECTION_COLOR[slice.section]}
              strokeDasharray={`${slice.length} ${circumference - slice.length}`}
              strokeDashoffset={-slice.start}
            />
          ))}
        </svg>

        {/* % nằm trực tiếp trên từng phần của hình tròn. */}
        <svg viewBox='0 0 200 200' className='pointer-events-none absolute inset-0 size-full'>
          {slices.map((slice) => {
            // Slivers under 5% have no room for a legible label; the legend covers them.
            if (slice.percent < 5) return null
            const midFraction = (slice.start + slice.length / 2) / circumference
            const angle = midFraction * 2 * Math.PI - Math.PI / 2
            // Nhãn đặt ở ~60% bán kính ngoài để nằm gọn trong miếng bánh đặc.
            const labelRadius = radius * 1.2
            return (
              <text
                key={slice.section}
                x={100 + Math.cos(angle) * labelRadius}
                y={100 + Math.sin(angle) * labelRadius}
                textAnchor='middle'
                dominantBaseline='central'
                className='fill-background text-[15px] font-bold'
              >
                {slice.percent}%
              </text>
            )
          })}
        </svg>
      </div>

      {/* `min-w-0` để số tiền dài không bị cắt khi cột nội dung hẹp. */}
      <ul className='w-full min-w-0 space-y-3.5'>
        {shares.map((share) => (
          <li key={share.section} className='flex items-start gap-2.5'>
            <span
              aria-hidden
              className='mt-1.5 size-2.5 shrink-0 rounded-full'
              style={{ backgroundColor: SECTION_COLOR[share.section] }}
            />
            <span className='min-w-0'>
              <span className='block text-sm font-medium'>{t(`sections.${share.section}`)}</span>
              <span className='text-muted-foreground block text-sm whitespace-nowrap tabular-nums'>
                {formatCurrency(share.amount, locale)}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
