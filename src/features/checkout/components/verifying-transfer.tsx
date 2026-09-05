'use client'

import { Clock, Headset, Landmark, Receipt, RefreshCw, Wallet } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { useRouter } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { Button } from '@/shared/components/ui/button'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { checkoutDoneRoute } from '@/shared/constants/routes'
import { formatCurrency } from '@/shared/utils'
import { useOrder } from '../hooks/use-checkout'
import { CheckoutSteps } from './checkout-steps'

interface VerifyingTransferProps {
  orderId: string
}

/**
 * S06 — Đang xác nhận chuyển khoản.
 *
 * `useOrder` tự hỏi lại server mỗi 3 giây khi đơn ở trạng thái này, nên trang tự
 * cập nhật; khi tiền về thì chuyển thẳng sang màn Hoàn tất.
 *
 * Stepper ở đây dừng ở nấc "Thanh toán" chứ KHÔNG tô xanh cả bốn nấc: tiền chưa
 * về thì đơn chưa hoàn tất, và stepper là thứ khách nhìn để biết mình đang ở đâu.
 */
export function VerifyingTransfer({ orderId }: VerifyingTransferProps) {
  const t = useTranslations('checkout.verifying')
  const tPayment = useTranslations('checkout.payment')
  const locale = useLocale() as Locale
  const router = useRouter()

  const { data: order, isPending, refetch, isFetching } = useOrder(orderId)
  const [waited, setWaited] = useState(0)

  useEffect(() => {
    const timer = window.setInterval(() => setWaited((value) => value + 1), 1_000)
    return () => window.clearInterval(timer)
  }, [])

  const status = order?.status
  useEffect(() => {
    if (status === 'paid') router.replace(checkoutDoneRoute(orderId))
  }, [status, orderId, router])

  if (isPending || !order) {
    return (
      <div className='mx-auto w-full max-w-2xl px-4 py-12 lg:px-8'>
        <Skeleton className='h-96 rounded-2xl' />
      </div>
    )
  }

  const waitedLabel = `${String(Math.floor(waited / 60)).padStart(2, '0')}:${String(waited % 60).padStart(2, '0')}`

  const rows = [
    { icon: Receipt, label: t('orderCode'), value: `#${order.id}` },
    { icon: Wallet, label: t('amount'), value: formatCurrency(order.total, locale) },
    { icon: Landmark, label: t('content'), value: order.transfer.content }
  ]

  return (
    // Hình S06: cột nội dung hẹp, canh giữa.
    <div className='mx-auto w-full max-w-lg space-y-6 px-4 py-8'>
      <CheckoutSteps current='payment' />

      <div className='space-y-3 text-center'>
        <span className='bg-warning/15 text-warning-strong mx-auto flex size-20 items-center justify-center rounded-full'>
          <Clock className='size-10' strokeWidth={2.25} />
        </span>
        <h1 className='text-warning-strong text-3xl font-bold tracking-tight'>{t('title')}</h1>
        <p className='text-muted-foreground text-pretty'>{t('subtitle')}</p>
      </div>

      <dl className='border-warning/30 bg-warning/5 space-y-2 rounded-2xl border p-5'>
        {rows.map((row) => (
          <div key={row.label} className='flex items-center gap-3 border-b py-2.5 last:border-b-0'>
            <row.icon className='text-warning-strong size-4 shrink-0' />
            <dt className='text-muted-foreground min-w-0 flex-1 text-sm'>{row.label}</dt>
            <dd className='font-medium'>{row.value}</dd>
          </div>
        ))}
      </dl>

      <p className='bg-accent/40 text-primary-strong rounded-xl px-4 py-3 text-center text-sm'>
        {t('waited', { time: waitedLabel })}
      </p>

      <div className='space-y-2'>
        <Button variant='outline' className='h-13 w-full' onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={isFetching ? 'size-4 animate-spin' : 'size-4'} />
          {t('refresh')}
        </Button>

        {/* Chuyển rồi mà chưa thấy cập nhật: đường thoát sang đội hỗ trợ, đúng
            như bản mô tả — không để khách ngồi nhìn màn hình chờ mãi. */}
        <Button variant='ghost' className='w-full' onClick={() => toast.info(tPayment('supportToast'))}>
          <Headset className='size-4' />
          {t('notSeen')}
        </Button>
      </div>

      <p className='text-muted-foreground text-center text-xs text-pretty'>{t('keepPage')}</p>
    </div>
  )
}
