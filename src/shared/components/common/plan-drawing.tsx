import { useTranslations } from 'next-intl'

import { cn } from '@/shared/lib/utils'

/** One room block on the plan: x, y, width, height (in viewBox units) + label key. */
const ROOMS = [
  { x: 16, y: 16, w: 104, h: 78, key: 'living' },
  { x: 120, y: 16, w: 64, h: 78, key: 'kitchen' },
  { x: 16, y: 94, w: 68, h: 66, key: 'bed1' },
  { x: 84, y: 94, w: 44, h: 34, key: 'wc' },
  { x: 84, y: 128, w: 44, h: 32, key: 'stairs' },
  { x: 128, y: 94, w: 56, h: 66, key: 'bed2' }
] as const

/**
 * Kích thước ghi trên đường kích thước, đơn vị mm — số liệu kỹ thuật của bản vẽ,
 * giống nhau ở mọi ngôn ngữ nên không đưa vào file dịch.
 */
const DIMENSION_MM = { width: '8 400', depth: '7 200' } as const

/**
 * Bản vẽ mặt bằng 2D mẫu — vẽ thẳng bằng SVG thay vì dùng ảnh stock, nên nội
 * dung luôn đúng thứ nó minh họa và không phụ thuộc mạng.
 *
 * Dùng ở khung minh họa trang chủ (tab "Mặt bằng", mục II.2) và thẻ xem trước
 * bộ hồ sơ (mục III.4a).
 */
export function PlanDrawing({ className }: { className?: string }) {
  const t = useTranslations('design.planSample')

  return (
    <div className={cn('bg-card relative overflow-hidden', className)}>
      {/* Lưới nền kiểu giấy can. */}
      <div
        aria-hidden
        className='absolute inset-0 opacity-60'
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, var(--grid-line) 0 1px, transparent 1px 20px), repeating-linear-gradient(90deg, var(--grid-line) 0 1px, transparent 1px 20px)'
        }}
      />
      <svg viewBox='0 0 200 176' className='relative size-full' role='img' aria-label={t('label')}>
        {/* Tường bao */}
        <rect
          x='16'
          y='16'
          width='168'
          height='144'
          fill='none'
          className='stroke-foreground'
          strokeWidth='2.5'
          vectorEffect='non-scaling-stroke'
        />

        {ROOMS.map((room) => (
          <g key={room.key}>
            <rect
              x={room.x}
              y={room.y}
              width={room.w}
              height={room.h}
              fill='none'
              className='stroke-foreground/55'
              strokeWidth='1'
              vectorEffect='non-scaling-stroke'
            />
            <text
              x={room.x + room.w / 2}
              y={room.y + room.h / 2}
              textAnchor='middle'
              dominantBaseline='central'
              className='fill-muted-foreground'
              style={{ fontSize: 5, letterSpacing: 0.3 }}
            >
              {t(`rooms.${room.key}`)}
            </text>
          </g>
        ))}

        {/* Cửa chính + vệt mở cửa */}
        <path
          d='M 78 160 A 14 14 0 0 1 92 146'
          fill='none'
          className='stroke-primary'
          strokeWidth='1'
          vectorEffect='non-scaling-stroke'
        />
        <line x1='78' y1='160' x2='92' y2='160' className='stroke-card' strokeWidth='3' />

        {/* Đường kích thước */}
        <g className='stroke-primary/70' strokeWidth='0.8' vectorEffect='non-scaling-stroke'>
          <line x1='16' y1='170' x2='184' y2='170' />
          <line x1='16' y1='166' x2='16' y2='174' />
          <line x1='184' y1='166' x2='184' y2='174' />
        </g>
        <text x='100' y='167' textAnchor='middle' className='fill-primary' style={{ fontSize: 5 }}>
          {DIMENSION_MM.width}
        </text>

        <g className='stroke-primary/70' strokeWidth='0.8' vectorEffect='non-scaling-stroke'>
          <line x1='190' y1='16' x2='190' y2='160' />
          <line x1='186' y1='16' x2='194' y2='16' />
          <line x1='186' y1='160' x2='194' y2='160' />
        </g>
        <text
          x='190'
          y='88'
          textAnchor='middle'
          className='fill-primary'
          style={{ fontSize: 5 }}
          transform='rotate(-90 190 88)'
        >
          {DIMENSION_MM.depth}
        </text>
      </svg>
    </div>
  )
}
