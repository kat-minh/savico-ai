'use client'

import { AlertTriangle, Check } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { cn } from '@/shared/lib/utils'
import { CHECKOUT_STEPS, type CheckoutStep } from '../constants/checkout.constants'

interface CheckoutStepsProps {
  current: CheckoutStep
  /** Đơn đang lỗi — nấc hiện tại chuyển sang cảnh báo thay vì tích xanh. */
  error?: boolean
}

/**
 * Stepper 4 bước của luồng mua gói: Chọn gói → Xác nhận đơn hàng → Thanh toán →
 * Hoàn tất (S03, S04, S06, S07, S08).
 *
 * Bố cục theo Hình S03/S04: vòng tròn nằm TRÊN, nhãn nằm DƯỚI và canh giữa theo
 * vòng tròn, đường nối chạy ngang qua tâm hai vòng liền nhau; không bọc trong
 * thẻ viền. Bản dựng trước đây xếp nhãn nằm cạnh vòng tròn trong một khung
 * `rounded-2xl border` nên nhìn khác hẳn ảnh.
 *
 * Ba trạng thái nấc, không phải hai: đã xong (tích), đang làm (số, tô đậm), chưa
 * tới (mờ) — cộng một trạng thái lỗi. Bản demo tô xanh cả bốn nấc ngay ở màn
 * "đang chờ xác nhận" và cả ở màn thất bại, tức là báo cho khách rằng họ đã mua
 * xong trong khi tiền chưa về. Nhãn trạng thái vẫn còn nhưng để `sr-only`: ảnh
 * không vẽ nó, mà trình đọc màn hình thì cần.
 */
export function CheckoutSteps({ current, error = false }: CheckoutStepsProps) {
  const t = useTranslations('checkout.steps')
  const tState = useTranslations('checkout.stepState')
  const currentIndex = CHECKOUT_STEPS.indexOf(current)

  return (
    <ol className='mx-auto flex w-full max-w-3xl items-start'>
      {CHECKOUT_STEPS.map((step, index) => {
        const done = index < currentIndex
        const active = index === currentIndex
        const state = error && active ? 'error' : done ? 'done' : active ? 'current' : 'pending'

        return (
          <li key={step} className='relative flex min-w-0 flex-1 flex-col items-center gap-2'>
            {/* Đường nối vẽ bằng `::before` của nấc sau, kéo từ tâm nấc trước
                sang tâm nấc này — cách duy nhất giữ đường nối luôn nằm đúng
                giữa hai vòng tròn khi các cột co giãn theo nhau. */}
            {index > 0 ? (
              <span
                aria-hidden
                className={cn(
                  'absolute top-[1.125rem] -left-1/2 h-px w-full',
                  done || active ? 'bg-primary' : 'bg-border'
                )}
              />
            ) : null}

            <span
              className={cn(
                'relative z-10 flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold',
                state === 'done' && 'bg-primary text-primary-foreground',
                state === 'current' && 'bg-primary text-primary-foreground',
                state === 'error' && 'bg-destructive text-destructive-foreground',
                state === 'pending' && 'bg-muted text-muted-foreground border'
              )}
            >
              {state === 'done' ? (
                <Check className='size-4' strokeWidth={3} />
              ) : state === 'error' ? (
                <AlertTriangle className='size-4' />
              ) : (
                index + 1
              )}
            </span>

            <span className='min-w-0 text-center'>
              <span
                className={cn(
                  'block truncate text-sm',
                  state === 'pending' ? 'text-muted-foreground' : 'text-foreground font-semibold',
                  state === 'current' && 'text-primary-strong'
                )}
              >
                {t(step)}
              </span>
              <span className='sr-only'>{tState(state)}</span>
            </span>
          </li>
        )
      })}
    </ol>
  )
}
