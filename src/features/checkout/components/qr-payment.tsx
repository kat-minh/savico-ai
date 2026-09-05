'use client'

import { Check, Copy, Download, Headset, Info, TriangleAlert } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { QRCodeCanvas } from 'qrcode.react'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

import type { Locale } from '@/i18n/routing'
import { Button } from '@/shared/components/ui/button'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { cn } from '@/shared/lib/utils'
import { formatCurrency } from '@/shared/utils'
import { QR_TTL_MINUTES } from '../constants/checkout.constants'
import { useMarkTransferred, useOrder, useRegenerateQr } from '../hooks/use-checkout'
import { CheckoutSteps } from './checkout-steps'

interface QrPaymentProps {
  orderId: string
}

/**
 * Đếm ngược `mm:ss` tới thời điểm hết hạn mã QR, kèm `ratio` là phần thời gian
 * còn lại (0–100) để vẽ thanh tiến độ dọc đáy banner như Hình S04.
 */
function useCountdown(expiresAt?: string): { label: string; expired: boolean; ratio: number } {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1_000)
    return () => window.clearInterval(timer)
  }, [])

  if (!expiresAt) return { label: '--:--', expired: false, ratio: 0 }

  const remaining = Math.max(0, new Date(expiresAt).getTime() - now)
  const minutes = Math.floor(remaining / 60_000)
  const seconds = Math.floor((remaining % 60_000) / 1_000)

  return {
    label: `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`,
    expired: remaining === 0,
    ratio: Math.min(100, Math.max(0, (remaining / (QR_TTL_MINUTES * 60_000)) * 100))
  }
}

/**
 * Bước 3/4 — Thanh toán QR (S04).
 *
 * Hai cột: mã QR bên trái, thông tin chuyển khoản thủ công bên phải — mỗi dòng
 * có nút sao chép riêng vì nội dung chuyển khoản gõ sai là đơn phải đối soát tay.
 *
 * Nút "Tôi đã chuyển khoản" có mặt ở đây: bản mô tả yêu cầu nó (đường vào S06)
 * nhưng ảnh demo lại không vẽ, mà thiếu nó thì khách chuyển khoản xong không có
 * cách nào báo cho hệ thống. Ngược lại, KHÔNG có link "Đổi hình thức thanh toán"
 * — chỉ còn một hình thức (R10).
 */
export function QrPayment({ orderId }: QrPaymentProps) {
  const t = useTranslations('checkout.payment')
  const locale = useLocale() as Locale

  const { data: order, isPending } = useOrder(orderId)
  const markTransferred = useMarkTransferred(orderId)
  const regenerate = useRegenerateQr(orderId)
  const { label, expired, ratio } = useCountdown(order?.expiresAt)
  const qrRef = useRef<HTMLDivElement>(null)

  const copy = (value: string) => {
    void navigator.clipboard.writeText(value)
    toast.success(t('copied'))
  }

  /** Tải ảnh QR: lấy thẳng canvas đang render, không cần dựng lại mã. */
  const downloadQr = () => {
    const canvas = qrRef.current?.querySelector('canvas')
    if (!canvas) return
    const link = document.createElement('a')
    link.download = `${orderId}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  if (isPending || !order) {
    return (
      <div className='mx-auto w-full max-w-5xl px-4 py-8 lg:px-8'>
        <Skeleton className='h-[32rem] rounded-2xl' />
      </div>
    )
  }

  const rows = [
    { label: t('bank'), value: order.transfer.bankName, copyable: false },
    { label: t('accountNumber'), value: order.transfer.accountNumber, copyable: true },
    { label: t('accountName'), value: order.transfer.accountName, copyable: false },
    { label: t('amount'), value: formatCurrency(order.total, locale), copyable: true },
    { label: t('content'), value: order.transfer.content, copyable: true, highlight: true }
  ]

  return (
    <div className='mx-auto w-full max-w-5xl space-y-6 px-4 py-8 lg:px-8'>
      <CheckoutSteps current='payment' error={expired} />

      <section
        className={cn(
          'relative flex flex-wrap items-center gap-4 overflow-hidden rounded-2xl border p-4',
          expired ? 'border-destructive/40 bg-destructive/10' : 'border-primary/40 bg-accent/40'
        )}
      >
        {/* Hình S04: một thanh tiến độ chạy dọc đáy banner cho thấy còn bao
            nhiêu thời gian — không có nó thì con số đếm ngược đứng trơ một mình. */}
        {expired ? null : (
          <span aria-hidden className='bg-primary/15 absolute inset-x-0 bottom-0 h-1.5'>
            <span className='bg-primary block h-full transition-[width] duration-1000' style={{ width: `${ratio}%` }} />
          </span>
        )}

        <span
          className={cn(
            'flex size-10 shrink-0 items-center justify-center rounded-full',
            expired ? 'bg-destructive/15 text-destructive' : 'bg-primary/15'
          )}
        >
          {expired ? <TriangleAlert className='size-5' /> : <span className='bg-primary size-3 rounded-full' />}
        </span>

        <div className='min-w-0 flex-1'>
          <p className='font-semibold'>{expired ? t('expired') : t('waiting')}</p>
          <p className='text-muted-foreground text-sm text-pretty'>{t('waitingBody')}</p>
        </div>

        {expired ? (
          <Button onClick={() => regenerate.mutate()} disabled={regenerate.isPending}>
            {t('regenerate')}
          </Button>
        ) : (
          <div className='text-right'>
            <p className='text-muted-foreground text-xs'>{t('expiresIn')}</p>
            <p className='text-primary-strong font-mono text-2xl font-bold'>{label}</p>
          </div>
        )}
      </section>

      <div className='grid gap-5 lg:grid-cols-2'>
        <section className='bg-card rounded-2xl border p-5 text-center'>
          <h2 className='font-semibold'>{t('qrTitle')}</h2>

          <div ref={qrRef} className='mt-4 flex justify-center'>
            {/* Bốn góc ngoặc xanh như ảnh, thay cho khung viền kín. */}
            <div className='relative bg-white p-4'>
              <span
                aria-hidden
                className='border-primary absolute top-0 left-0 size-7 rounded-tl-lg border-t-[3px] border-l-[3px]'
              />
              <span
                aria-hidden
                className='border-primary absolute top-0 right-0 size-7 rounded-tr-lg border-t-[3px] border-r-[3px]'
              />
              <span
                aria-hidden
                className='border-primary absolute bottom-0 left-0 size-7 rounded-bl-lg border-b-[3px] border-l-[3px]'
              />
              <span
                aria-hidden
                className='border-primary absolute right-0 bottom-0 size-7 rounded-br-lg border-r-[3px] border-b-[3px]'
              />
              <QRCodeCanvas value={order.transfer.qrPayload} size={200} level='M' />
            </div>
          </div>

          <p className='mt-4 text-2xl font-bold tracking-tight'>{formatCurrency(order.total, locale)}</p>
          <p className='text-muted-foreground font-mono text-xs'>#{order.id}</p>

          <div className='mt-4 flex flex-wrap justify-center gap-2'>
            <Button variant='outline' size='sm' onClick={downloadQr}>
              <Download className='size-4' />
              {t('downloadQr')}
            </Button>
            <Button variant='outline' size='sm' onClick={() => copy(order.id)}>
              <Copy className='size-4' />
              {t('copyOrder')}
            </Button>
          </div>

          <ol className='mt-5 space-y-2 border-t pt-4 text-left'>
            {[t('guide1'), t('guide2'), t('guide3')].map((step, index) => (
              <li key={step} className='flex items-start gap-2.5 text-sm'>
                <span className='bg-primary text-primary-foreground mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold'>
                  {index + 1}
                </span>
                <span className='text-pretty'>{step}</span>
              </li>
            ))}
          </ol>
        </section>

        <div className='space-y-5'>
          <section className='bg-card rounded-2xl border p-5'>
            <h2 className='text-center font-semibold'>{t('manualTitle')}</h2>
            <p className='text-muted-foreground mt-1 text-center text-sm text-pretty'>{t('manualBody')}</p>

            <dl className='mt-4 space-y-2'>
              {rows.map((row) => (
                <div
                  key={row.label}
                  className={cn(
                    'flex items-center gap-3 rounded-lg border px-3 py-2.5',
                    row.highlight && 'border-warning/50 bg-warning/10'
                  )}
                >
                  <div className='min-w-0 flex-1'>
                    <dt className='text-muted-foreground text-[11px]'>{row.label}</dt>
                    <dd className={cn('truncate font-medium', row.highlight && 'text-warning-strong')}>{row.value}</dd>
                  </div>
                  {row.copyable ? (
                    <button
                      type='button'
                      aria-label={`${t('copy')} ${row.label}`}
                      onClick={() => copy(row.value)}
                      className='text-muted-foreground hover:text-foreground transition-colors'
                    >
                      <Copy className='size-4' />
                    </button>
                  ) : null}
                </div>
              ))}
            </dl>

            <p className='text-muted-foreground bg-warning/10 mt-4 flex items-start gap-2 rounded-lg p-3 text-xs'>
              <Info className='text-warning-strong mt-0.5 size-3.5 shrink-0' />
              <span className='text-pretty'>{t('keepContent')}</span>
            </p>
          </section>

          <div className='flex flex-wrap gap-2'>
            <Button
              className='flex-1'
              onClick={() => markTransferred.mutate()}
              disabled={markTransferred.isPending || expired}
            >
              <Check className='size-4' />
              {t('transferred')}
            </Button>
            <Button variant='outline' onClick={() => toast.info(t('supportToast'))}>
              <Headset className='size-4' />
              {t('support')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
