'use client'

import { ArrowRight, CalendarClock } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Link } from '@/i18n/navigation'
import { Button } from '@/shared/components/ui/button'
import { ROUTES } from '@/shared/constants/routes'
import { cn } from '@/shared/lib/utils'

interface ConsultButtonProps {
  /** `solid` là nút chính ở trang chi tiết mẫu; `link` là liên kết ở trang bài viết. */
  variant?: 'solid' | 'link'
  className?: string
}

/**
 * Nút "Đặt lịch tư vấn 1:1" (Phần 2.3, 2.4, 3.3).
 *
 * Trước đây nút mở hộp thoại gọi hotline / Zalo vì chưa có luồng đặt lịch. Bên A
 * đã chốt trang Tư vấn 1:1 (mục VIII) nên nút đưa thẳng sang đó — chọn kiến trúc
 * sư, chọn khung giờ và xác nhận ở một chỗ.
 */
export function ConsultButton({ variant = 'solid', className }: ConsultButtonProps) {
  const t = useTranslations('handbook.consult')

  if (variant === 'link') {
    return (
      <Link
        href={ROUTES.CONSULT}
        className={cn('text-primary inline-flex items-center gap-2 text-sm font-medium hover:underline', className)}
      >
        <CalendarClock className='size-4' />
        {t('cta')}
        <ArrowRight className='size-4' />
      </Link>
    )
  }

  return (
    <Button asChild size='lg' className={cn('w-full justify-between', className)}>
      <Link href={ROUTES.CONSULT}>
        {t('cta')}
        <ArrowRight className='size-4' />
      </Link>
    </Button>
  )
}
