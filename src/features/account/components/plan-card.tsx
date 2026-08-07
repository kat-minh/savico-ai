'use client'

import { Search, SquarePen } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'

import { Link } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { ROUTES } from '@/shared/constants/routes'
import { Button } from '@/shared/components/ui/button'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { formatDate } from '@/shared/utils'
import { useAccountPlan } from '../hooks/use-account-plan'
import type { PlanAllowance } from '../types/account.types'

/** Một hàng hạn mức: icon tròn + nhãn "còn {x}/{y}" + thanh tiến độ. */
function AllowanceRow({ icon: Icon, label, allowance }: { icon: LucideIcon; label: string; allowance: PlanAllowance }) {
  // Thanh thể hiện phần CÒN LẠI, không phải phần đã dùng — nhãn cũng nói "còn".
  const percent = allowance.total > 0 ? Math.round((allowance.remaining / allowance.total) * 100) : 0

  return (
    <li className='flex gap-3'>
      <span className='bg-card text-primary-strong mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full'>
        <Icon className='size-4' />
      </span>
      <span className='min-w-0 flex-1 space-y-1.5'>
        <span className='block text-[13px] font-medium'>{label}</span>
        <span
          role='progressbar'
          aria-valuenow={allowance.remaining}
          aria-valuemin={0}
          aria-valuemax={allowance.total}
          className='bg-card block h-1.5 overflow-hidden rounded-full'
        >
          <span className='bg-primary block h-full rounded-full' style={{ width: `${percent}%` }} />
        </span>
      </span>
    </li>
  )
}

interface PlanCardProps {
  /**
   * Hạn mức lượt thiết kế lấy từ CÙNG nguồn với dòng hạn mức ở Bước 1
   * (mục IX: "Số hạn mức đồng bộ thời gian thực với Bước 1 (IV.3.c)").
   * `features/account` không được import `features/design`, nên app layer đọc
   * `useDesignQuota()` rồi truyền xuống đây.
   */
  designAllowance?: PlanAllowance
}

/**
 * Thẻ "GÓI CỦA TÔI" ở cột trái trang Tài khoản (mục IX, Hình 17): tên gói, hạn
 * dùng, hai hàng hạn mức kèm thanh tiến độ và nút "Nâng cấp gói".
 */
export function PlanCard({ designAllowance }: PlanCardProps = {}) {
  const t = useTranslations('account.plan')
  const locale = useLocale() as Locale
  const { data: plan, isPending } = useAccountPlan()

  if (isPending) return <Skeleton className='h-56 w-full rounded-2xl' />
  if (!plan) return null

  const design = designAllowance ?? plan.design

  return (
    <section className='bg-accent/60 border-primary/25 mt-4 rounded-2xl border p-5 text-center'>
      <h2 className='text-muted-foreground text-[11px] font-semibold tracking-[0.12em] uppercase'>{t('title')}</h2>
      <p className='text-primary-strong mt-1 text-xl font-bold'>{plan.name}</p>
      <p className='text-muted-foreground mt-0.5 text-sm'>
        {t('expiresAt', { date: formatDate(plan.expiresAt, locale) })}
      </p>

      <ul className='mt-5 space-y-4 text-left'>
        {/* Số lượt thiết kế ưu tiên nguồn dùng chung với Bước 1; chỉ rơi về
            số của gói khi lớp app chưa truyền vào. */}
        <AllowanceRow
          icon={SquarePen}
          label={t('designAllowance', { remaining: design.remaining, total: design.total })}
          allowance={design}
        />
        <AllowanceRow
          icon={Search}
          label={t('libraryAllowance', { remaining: plan.library.remaining, total: plan.library.total })}
          allowance={plan.library}
        />
      </ul>

      {/* Dẫn sang trang Gói đăng ký (mục VII). */}
      <Button asChild size='lg' className='mt-5 w-full'>
        <Link href={ROUTES.PLANS}>{t('upgrade')}</Link>
      </Button>
    </section>
  )
}
