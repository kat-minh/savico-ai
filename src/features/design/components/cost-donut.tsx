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
 * Biểu đồ tròn tỷ trọng chi phí 3 phần (mục III.3b, khối 2).
 *
 * Số % hiển thị TRỰC TIẾP trên từng phần của hình tròn; chú thích bên cạnh ghi
 * đủ: chấm màu + tên phần + % + số tiền (VNĐ).
 */
export function CostDonut({ sections }: { sections: readonly EstimateSection[] }) {
  const t = useTranslations('design.estimate')
  const locale = useLocale() as Locale
  const shares = costShares(sections)

  const radius = 70
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
    <div className='flex flex-col items-center gap-8 sm:flex-row sm:items-center sm:justify-center'>
      <div className='relative size-56 shrink-0'>
        <svg viewBox='0 0 200 200' className='size-full -rotate-90'>
          {slices.map((slice) => (
            <circle
              key={slice.section}
              cx='100'
              cy='100'
              r={radius}
              fill='none'
              strokeWidth='34'
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
            return (
              <text
                key={slice.section}
                x={100 + Math.cos(angle) * radius}
                y={100 + Math.sin(angle) * radius}
                textAnchor='middle'
                dominantBaseline='central'
                className='fill-background text-[13px] font-semibold'
              >
                {slice.percent}%
              </text>
            )
          })}
        </svg>
      </div>

      {/* Chú thích: chấm màu + tên phần + % + số tiền. */}
      <ul className='w-full max-w-xs space-y-3'>
        {shares.map((share) => (
          <li key={share.section} className='flex items-center gap-3'>
            <span
              aria-hidden
              className='size-3 shrink-0 rounded-full'
              style={{ backgroundColor: SECTION_COLOR[share.section] }}
            />
            <span className='flex-1 text-sm font-medium'>{t(`sections.${share.section}`)}</span>
            <span className='text-muted-foreground text-sm tabular-nums'>{share.percent}%</span>
            <span className='text-sm font-semibold tabular-nums'>{formatCurrency(share.amount, locale)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
