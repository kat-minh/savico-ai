'use client'

import { Eye, Search } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Link } from '@/i18n/navigation'
import { ROUTES } from '@/shared/constants/routes'
import { cn } from '@/shared/lib/utils'
import { useHandbookQuota } from '../hooks/use-handbook'

/**
 * Hạn mức tra cứu trong ngày (Phần 2.1, 2.3).
 *
 * `lookup` là huy hiệu ở góc phải thanh lọc của lưới thư viện; `detail` là dòng
 * nhắc trong cột phải trang chi tiết. Hết lượt thì đổi thành lời mời nâng cấp
 * gói, dẫn thẳng sang trang Gói đăng ký.
 */
export function QuotaBadge({ scope, className }: { scope: 'lookup' | 'detail'; className?: string }) {
  const t = useTranslations('handbook.quota')
  const { data } = useHandbookQuota()

  if (!data) return null

  const remaining = scope === 'lookup' ? data.lookupRemaining : data.detailRemaining
  const total = scope === 'lookup' ? data.lookupTotal : data.detailTotal
  const Icon = scope === 'lookup' ? Search : Eye

  if (remaining <= 0) {
    return (
      <Link
        href={ROUTES.PLANS}
        className={cn(
          'text-destructive inline-flex items-center gap-1.5 rounded-lg border border-current/30 px-3 py-1.5 text-xs font-medium hover:underline',
          className
        )}
      >
        <Icon className='size-3.5' />
        {t('exhausted')}
      </Link>
    )
  }

  if (scope === 'detail') {
    return (
      <p className={cn('text-muted-foreground flex items-center gap-2 text-xs', className)}>
        <Icon className='size-4 shrink-0' />
        {t('detailRemaining', { remaining, total })}
      </p>
    )
  }

  return (
    <span
      className={cn(
        'border-primary/40 text-primary inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium',
        className
      )}
    >
      <Icon className='size-3.5' />
      {t('lookupRemaining', { remaining, total })}
    </span>
  )
}
