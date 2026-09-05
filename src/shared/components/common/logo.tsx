import { cn } from '@/shared/lib/utils'

interface LogoProps {
  className?: string
  /** Hide the wordmark, showing only the icon. */
  iconOnly?: boolean
  /**
   * Bản nền tối (footer — mục II.2): chữ "SAVI" chuyển sang màu chữ của footer
   * vì `--primary-strong` quá tối để đọc trên nền `--footer`.
   */
  onDark?: boolean
  /**
   * Dòng định vị nhỏ dưới chữ ký thương hiệu ("Nền tảng AI cho kiến trúc xây
   * dựng"), như mọi ảnh thiết kế của Bên A. Chữ do nơi gọi truyền vào: `Logo`
   * dùng được ở cả server lẫn client component nên không tự lấy bản dịch.
   */
  tagline?: string
}

/**
 * Logo SAVICO — chữ "SAVI" và biểu tượng vòng tuần hoàn "CO" nối nhau, dựng
 * theo bộ nhận diện khách duyệt trong `client-ai-gen/`.
 *
 * Vẽ bằng SVG thay vì ảnh bitmap để nét luôn sắc ở mọi cỡ và tự đổi màu theo
 * token thương hiệu.
 */
export function Logo({ className, iconOnly = false, onDark = false, tagline }: LogoProps) {
  const mark = (
    <span className={cn('flex items-center gap-1.5', tagline ? undefined : className)}>
      {!iconOnly ? (
        <span
          className={cn(
            'text-2xl leading-none font-extrabold tracking-[-0.02em]',
            onDark ? 'text-footer-foreground' : 'text-primary-strong'
          )}
        >
          SAVI
        </span>
      ) : null}

      {/* Vòng tuần hoàn: hai cung hở lồng nhau, tia chớp ở giữa. */}
      <svg viewBox='0 0 44 24' className='h-[1.15em] w-auto shrink-0' role='img' aria-label='SAVICO'>
        <path
          d='M15.5 5.2a7 7 0 1 0 0 13.6'
          className='stroke-primary'
          strokeWidth='3.2'
          strokeLinecap='round'
          fill='none'
        />
        <path
          d='M28.5 18.8a7 7 0 1 0 0-13.6'
          className='stroke-primary'
          strokeWidth='3.2'
          strokeLinecap='round'
          fill='none'
        />
        <path
          d='M23.4 4.6 19 12.6h3.5L20.6 19.4 25.6 11h-3.4z'
          className={onDark ? 'fill-primary' : 'fill-primary-strong'}
        />
      </svg>
    </span>
  )

  if (!tagline) return mark

  return (
    <span className={cn('flex flex-col items-start gap-0.5', className)}>
      {mark}
      <span
        className={cn(
          'text-[0.32em] leading-none font-medium tracking-[0.14em] whitespace-nowrap uppercase',
          onDark ? 'text-footer-foreground/60' : 'text-muted-foreground'
        )}
      >
        {tagline}
      </span>
    </span>
  )
}
