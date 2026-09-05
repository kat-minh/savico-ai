'use client'

import { Gift, Info } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'

import type { Locale } from '@/i18n/routing'
import type { SubscriptionPlan } from '@/shared/cms'
import { Button } from '@/shared/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/shared/components/ui/dialog'
import { formatCurrency } from '@/shared/utils'
import { giftValueInMillions } from '../services/plan-gift.service'

interface PlanGiftDialogProps {
  /** Gói đang mở popup quà tặng; `null` là đóng. */
  plan: SubscriptionPlan | null
  onClose: () => void
}

/**
 * S02 — Popup "Quà tặng đặc biệt".
 *
 * Đây là popup thật (nền mờ + nút đóng), khác với "popup 3 lựa chọn" của S08 —
 * cái đó bản mô tả gọi là popup nhưng vẽ ra là một phần của trang.
 *
 * Dựng theo Hình S02: nền kem, một DẢI RUY BĂNG cam vắt ngang đầu popup mang
 * dòng "QUÀ TẶNG ĐẶC BIỆT", tên quà in đậm, rồi CON SỐ giá trị quà cỡ rất lớn
 * màu cam tách khỏi đơn vị tiền. Bản dựng trước đây là hộp thoại trắng phẳng
 * tông vàng hổ phách nên không nhận ra là cùng một thiết kế.
 *
 * Nội dung quà tặng nằm trong bản ghi gói ở kho nội dung nên admin sửa được;
 * popup chỉ dựng lại, không giữ chữ riêng.
 */
export function PlanGiftDialog({ plan, onClose }: PlanGiftDialogProps) {
  const t = useTranslations('plans.gift')
  const locale = useLocale() as Locale
  const gift = plan?.gift

  // Ảnh (và cả bản mô tả S02) viết giá trị quà theo TRIỆU: "100" cỡ rất lớn,
  // "TRIỆU ĐỒNG" nhỏ bên dưới. Chỉ rút gọn khi số chia hết cho một triệu; quà
  // có giá trị lẻ thì in đầy đủ để không làm tròn sai.
  const millions = gift ? giftValueInMillions(gift.value) : null
  const valueNumber = gift ? (millions ?? formatCurrency(gift.value, locale)) : ''
  const valueUnit = millions ? t('valueMillionsUnit') : ''

  return (
    <Dialog open={Boolean(gift)} onOpenChange={(open) => (open ? undefined : onClose())}>
      <DialogContent className='max-w-lg gap-0 overflow-hidden bg-[oklch(0.985_0.012_75)] p-0'>
        {gift ? (
          <>
            {/* Dải ruy băng cam: hai mẩu gập ở hai đầu tạo cảm giác băng vải. */}
            <div className='relative pt-7 pb-2'>
              <DialogTitle className='bg-brand-orange text-brand-orange-foreground mx-auto flex w-fit items-center gap-2.5 px-8 py-2.5 text-base font-bold tracking-wide uppercase'>
                <Gift className='size-5' />
                {t('badge')}
              </DialogTitle>
              <span
                aria-hidden
                className='bg-brand-orange/70 absolute top-7 left-6 h-11 w-8 [clip-path:polygon(0_0,100%_0,100%_100%,0_70%)]'
              />
              <span
                aria-hidden
                className='bg-brand-orange/70 absolute top-7 right-6 h-11 w-8 [clip-path:polygon(0_0,100%_0,100%_70%,0_100%)]'
              />
            </div>

            <div className='space-y-4 px-6 pt-2 pb-6'>
              <div className='text-center'>
                <DialogDescription className='text-foreground text-lg font-bold text-pretty'>
                  {gift.title}
                </DialogDescription>
                <p className='text-muted-foreground mt-1 text-sm'>{t('valuePrefix')}</p>
                <p className='text-brand-orange mt-1 text-6xl leading-none font-extrabold tracking-tight tabular-nums'>
                  {valueNumber}
                </p>
                {valueUnit ? (
                  <p className='text-brand-orange mt-1 text-xl font-bold tracking-wide uppercase'>{valueUnit}</p>
                ) : null}
              </div>

              <section className='bg-brand-orange-soft flex items-start gap-3 rounded-2xl p-4'>
                <span className='bg-brand-orange text-brand-orange-foreground flex size-11 shrink-0 items-center justify-center rounded-full'>
                  <Gift className='size-5' />
                </span>
                <div className='min-w-0'>
                  <p className='text-brand-orange text-sm font-bold'>{gift.extraTitle}</p>
                  <p className='mt-1 text-sm text-pretty'>{gift.extraBody}</p>
                </div>
              </section>

              <Button className='h-12 w-full text-base' onClick={onClose}>
                {t('understood')}
              </Button>

              <p className='text-muted-foreground flex items-start gap-2 text-xs'>
                <Info className='mt-0.5 size-3.5 shrink-0' />
                <span className='text-pretty'>
                  {t('conditionsLabel')}: {gift.conditions}
                </span>
              </p>
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
