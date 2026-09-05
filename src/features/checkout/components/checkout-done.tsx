'use client'

import { Check, CheckCircle2, FolderOpen, Receipt, ShieldCheck } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

import { Link } from '@/i18n/navigation'
import { StartOptions } from '@/shared/components/common'
import { Button } from '@/shared/components/ui/button'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { contractorMatchesRoute, ROUTES, supervisionRoute } from '@/shared/constants/routes'
import { useOrder } from '../hooks/use-checkout'
import { CheckoutSteps } from './checkout-steps'

interface CheckoutDoneProps {
  orderId: string
}

/**
 * Bước 4/4 — Hoàn tất (S08).
 *
 * Bản mô tả gọi phần ba lựa chọn là "popup", còn hình vẽ nó nằm ngay trong
 * trang. Ở đây dựng INLINE: sau khi thanh toán xong, ba lựa chọn chính là việc
 * tiếp theo của khách — bọc chúng trong một hộp thoại chỉ tạo thêm một lớp phải
 * đóng đi. Đúng khối đó được dùng lại ở dạng hộp thoại sau Bước 2 của luồng B
 * (S11), nơi nền sau lưng vẫn còn việc dở (R7).
 *
 * Đơn mua GÓI GIÁM SÁT không có ba lựa chọn ấy: mua xong thì việc tiếp theo là
 * mở bảng điều khiển của chính dự án đã gắn với đơn (R8).
 */
export function CheckoutDone({ orderId }: CheckoutDoneProps) {
  const t = useTranslations('checkout.done')
  const tPlans = useTranslations('plans.tiers')
  const tSupervision = useTranslations('supervision.tierAlias')
  const tStart = useTranslations('contractors.start')

  const { data: order, isPending } = useOrder(orderId)

  if (isPending || !order) {
    return (
      <div className='mx-auto w-full max-w-5xl px-4 py-12 lg:px-8'>
        <Skeleton className='h-96 rounded-2xl' />
      </div>
    )
  }

  const isSupervision = order.product.kind === 'supervision'
  const planName = isSupervision
    ? tSupervision(order.product.name as 'check' | 'control')
    : tPlans(order.product.name as 'basic' | 'advanced' | 'pro')

  return (
    <div className='mx-auto w-full max-w-6xl space-y-8 px-4 py-8 lg:px-8'>
      <CheckoutSteps current='done' />

      <div className='grid items-start gap-6 lg:grid-cols-[320px_minmax(0,1fr)]'>
        {/* Cột trái: xác nhận + thẻ gói vừa kích hoạt. */}
        <div className='space-y-4'>
          <div className='space-y-3 text-center lg:text-left'>
            <span className='bg-primary text-primary-foreground mx-auto flex size-16 items-center justify-center rounded-full lg:mx-0'>
              <Check className='size-9' strokeWidth={3} />
            </span>
            <h1 className='text-2xl font-bold tracking-tight text-pretty'>
              {isSupervision ? t('supervisionActivated', { plan: planName }) : t('designActivated', { plan: planName })}
            </h1>
            <p className='text-muted-foreground text-sm text-pretty'>
              {isSupervision ? t('assignNote') : t('subtitle')}
            </p>
          </div>

          <section className='bg-primary text-primary-foreground rounded-2xl p-5'>
            <div className='flex items-center justify-between gap-2'>
              <p className='text-[11px] font-semibold tracking-wide uppercase opacity-80'>{t('planTitle')}</p>
              <span className='bg-primary-foreground/15 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium'>
                <ShieldCheck className='size-3' />
                {t('activated')}
              </span>
            </div>

            <p className='mt-2 text-2xl font-bold tracking-wide uppercase'>{planName}</p>

            <ul className='mt-4 border-t border-white/15 text-sm'>
              {order.product.benefits.map((benefit) => {
                // "10 phương án thiết kế mới" → số tách ra để in cỡ lớn như ảnh;
                // quyền lợi không mở đầu bằng số thì giữ nguyên một dòng chữ.
                const [, count, rest] = /^(\d+)\s+(.*)$/.exec(benefit) ?? []
                return (
                  <li key={benefit} className='flex items-center gap-3 border-b border-white/10 py-2.5 last:border-b-0'>
                    {count ? (
                      <>
                        <span className='w-10 shrink-0 text-2xl leading-none font-bold tabular-nums'>{count}</span>
                        <span className='text-pretty'>{rest}</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className='size-4 shrink-0 opacity-80' />
                        <span className='text-pretty'>{benefit}</span>
                      </>
                    )}
                  </li>
                )
              })}
            </ul>

            {isSupervision ? null : <p className='mt-4 text-xs opacity-80'>{t('noExpiry')}</p>}
            <p className='mt-1 font-mono text-xs opacity-70'>#{order.id}</p>
          </section>

          <div className='flex flex-wrap gap-2'>
            <Button variant='outline' className='flex-1' onClick={() => toast.success(t('receiptSent'))}>
              <Receipt className='size-4' />
              {t('receipt')}
            </Button>
            {isSupervision && order.projectId ? (
              <Button asChild className='flex-1'>
                <Link href={supervisionRoute(order.projectId)}>{t('dashboard')}</Link>
              </Button>
            ) : (
              <Button asChild variant='outline' className='flex-1'>
                <Link href={ROUTES.ACCOUNT}>
                  <FolderOpen className='size-4' />
                  {t('myProjects')}
                </Link>
              </Button>
            )}
          </div>

          <p className='text-muted-foreground text-xs text-pretty'>{t('dataNote')}</p>
        </div>

        {/* Cột phải: ba lựa chọn "Bạn muốn bắt đầu như thế nào?" (R7). */}
        {isSupervision ? null : (
          <div className='min-w-0'>
            <h2 className='text-center text-xl font-semibold tracking-tight'>{tStart('title')}</h2>
            <StartOptions findHref={order.projectId ? contractorMatchesRoute(order.projectId) : ROUTES.CONTRACTORS} />
          </div>
        )}
      </div>
    </div>
  )
}
