import { cn } from '@/shared/lib/utils'

interface BrandIconProps {
  className?: string
}

/**
 * Icon thương hiệu mà `lucide-react` không có (Zalo, TikTok) — dựng bằng SVG
 * đơn sắc `currentColor` để đổi màu theo token như mọi icon lucide khác.
 * Facebook / YouTube dùng thẳng icon lucide.
 */

/** Zalo — chữ "Zalo" đặt trong khung bo tròn, dạng đơn sắc. */
export function ZaloIcon({ className }: BrandIconProps) {
  return (
    <svg viewBox='0 0 24 24' aria-hidden='true' className={cn('size-4', className)} fill='currentColor'>
      <path d='M19.25 2H4.75A2.75 2.75 0 0 0 2 4.75v14.5A2.75 2.75 0 0 0 4.75 22h14.5A2.75 2.75 0 0 0 22 19.25V4.75A2.75 2.75 0 0 0 19.25 2Zm-8.4 5.35v1.06L7.9 13.2h3.03v1.28H6.02v-1.06l2.95-4.79H6.16V7.35h4.69Zm2.02 7.13h-1.3V7.1h1.3v7.38Zm3.3.12a2.4 2.4 0 0 1-2.42-2.5 2.4 2.4 0 0 1 2.42-2.5 2.4 2.4 0 0 1 2.43 2.5 2.4 2.4 0 0 1-2.43 2.5Zm0-1.2c.68 0 1.15-.53 1.15-1.3s-.47-1.3-1.15-1.3c-.67 0-1.14.53-1.14 1.3s.47 1.3 1.14 1.3Z' />
    </svg>
  )
}

/** TikTok — nốt nhạc đặc trưng. */
export function TikTokIcon({ className }: BrandIconProps) {
  return (
    <svg viewBox='0 0 24 24' aria-hidden='true' className={cn('size-4', className)} fill='currentColor'>
      <path d='M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 0 1-2.59 2.5 2.59 2.59 0 1 1 .76-5.07v-3.1a5.66 5.66 0 0 0-.76-.05A5.68 5.68 0 1 0 15.54 15.4V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3a4.29 4.29 0 0 1-3.24-1.48Z' />
    </svg>
  )
}
