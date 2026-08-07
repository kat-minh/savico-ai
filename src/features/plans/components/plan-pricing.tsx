'use client'

import { CheckCircle2, Info, Search, SquarePen } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { toast } from 'sonner'

import type { Locale } from '@/i18n/routing'
import { Button } from '@/shared/components/ui/button'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { cn } from '@/shared/lib/utils'
import { formatCurrency } from '@/shared/utils'
import { usePlans } from '../hooks/use-plans'

/**
 * Trang Gói đăng ký (mục VII, Hình 13).
 *
 * ★ Giữ nguyên cấu trúc demo: ba thẻ gói, thẻ giữa nổi bật với badge "Phổ biến"
 * nhô lên trên viền, viền xanh và nút đặc. Giá cùng số lượt là số minh họa —
 * admin sửa được không cần deploy (mục X, #4).
 */
export function PlanPricing() {
  const t = useTranslations('plans')
  const locale = useLocale() as Locale
  const { data: plans, isPending } = usePlans()

  return (
    <div className='mx-auto w-full max-w-6xl px-4 py-12 lg:px-8'>
      <header className='mb-10 space-y-2 text-center'>
        <h1 className='text-3xl font-semibold tracking-tight sm:text-4xl'>{t('title')}</h1>
        <p className='text-muted-foreground text-pretty'>{t('subtitle')}</p>
      </header>

      {isPending ? (
        <div className='grid gap-5 md:grid-cols-3'>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className='h-96 rounded-2xl' />
          ))}
        </div>
      ) : (
        // `items-stretch` + `pt-4` chừa chỗ cho badge "Phổ biến" nhô lên khỏi thẻ.
        <ul className='grid items-stretch gap-5 pt-4 md:grid-cols-3'>
          {plans?.map((plan) => (
            <li key={plan.tier} className='relative flex'>
              {plan.popular ? (
                <span className='bg-primary-strong text-primary-foreground absolute -top-3.5 left-1/2 z-10 -translate-x-1/2 rounded-full px-4 py-1 text-xs font-semibold whitespace-nowrap'>
                  {t('popular')}
                </span>
              ) : null}

              <section
                className={cn(
                  'bg-card flex w-full flex-col rounded-2xl border p-6 text-center',
                  plan.popular ? 'border-primary shadow-md' : 'border-border'
                )}
              >
                <h2 className='text-primary-strong text-lg font-bold tracking-wide uppercase'>
                  {t(`tiers.${plan.tier}`)}
                </h2>

                <p className='mt-2'>
                  <span className='text-3xl font-bold tracking-tight'>{formatCurrency(plan.price, locale)}</span>
                  <span className='text-muted-foreground text-sm'> {t('period', { days: plan.periodDays })}</span>
                </p>

                {/* Hai hạn mức chính, mỗi dòng một icon như Hình 13. */}
                <ul className='mt-6 space-y-3 text-left'>
                  <li className='flex items-start gap-2.5'>
                    <SquarePen className='text-primary mt-0.5 size-4 shrink-0' />
                    <span className='text-sm'>
                      <span className='font-semibold'>{plan.designCredits}</span> {t('designCredits')}
                    </span>
                  </li>
                  <li className='flex items-start gap-2.5'>
                    <Search className='text-primary mt-0.5 size-4 shrink-0' />
                    <span className='text-sm'>
                      <span className='font-semibold'>{plan.libraryCredits}</span> {t('libraryCredits')}
                    </span>
                  </li>
                </ul>

                <ul className='mt-4 space-y-3 border-t pt-4 text-left'>
                  <li className='flex items-start gap-2.5'>
                    <CheckCircle2 className='text-primary mt-0.5 size-4 shrink-0' />
                    <span className='text-sm'>{plan.perk}</span>
                  </li>
                </ul>

                <p className='text-muted-foreground mt-4 border-t pt-4 text-xs'>
                  {t('audience', { audience: plan.audience })}
                </p>

                {/* Hình 13: thẻ giữa nút đặc, hai thẻ bên viền XANH chữ xanh.
                    Cổng thanh toán chưa nối nên bấm chỉ báo trạng thái — không
                    giả vờ đặt mua thành công. */}
                <Button
                  size='lg'
                  variant={plan.popular ? 'default' : 'outline'}
                  className={cn('mt-6 w-full', !plan.popular && 'border-primary text-primary-strong hover:bg-accent')}
                  onClick={() => toast.info(t('choosePlanSoon'))}
                >
                  {t('choosePlan')}
                </Button>
              </section>
            </li>
          ))}
        </ul>
      )}

      <p className='text-muted-foreground mx-auto mt-8 flex max-w-2xl items-start justify-center gap-2 text-center text-sm'>
        <Info className='mt-0.5 size-4 shrink-0' />
        <span className='text-pretty'>{t('paymentNote')}</span>
      </p>
    </div>
  )
}
