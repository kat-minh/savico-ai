import { cn } from '@/shared/lib/utils'

interface LogoProps {
  className?: string
  /** Hide the wordmark, showing only the icon. */
  iconOnly?: boolean
}

/**
 * Logo SAVICO — chữ "SAVI" và biểu tượng vòng tuần hoàn "CO" nối nhau, dựng
 * theo bộ nhận diện khách duyệt trong `client-ai-gen/`.
 *
 * Vẽ bằng SVG thay vì ảnh bitmap để nét luôn sắc ở mọi cỡ và tự đổi màu theo
 * token thương hiệu.
 */
export function Logo({ className, iconOnly = false }: LogoProps) {
  return (
    <span className={cn('flex items-center gap-1.5', className)}>
      {!iconOnly ? (
        <span className='text-primary-strong text-2xl leading-none font-extrabold tracking-[-0.02em]'>SAVI</span>
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
        <path d='M23.4 4.6 19 12.6h3.5L20.6 19.4 25.6 11h-3.4z' className='fill-primary-strong' />
      </svg>
    </span>
  )
}
