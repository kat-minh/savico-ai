'use client'

import { Gift, Info } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'

import type { Locale } from '@/i18n/routing'
import type { SubscriptionPlan } from '@/shared/cms'
import { Photo } from '@/shared/components/common'
import { Button } from '@/shared/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/shared/components/ui/dialog'
import { cn } from '@/shared/lib/utils'
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
      <DialogContent
        className={cn(
          'max-h-[92vh] gap-0 overflow-y-auto bg-[oklch(0.985_0.012_75)] p-0 sm:max-w-lg',
          // Hình S02: nút đóng là một VÒNG TRÒN TRẮNG có bóng, không phải dấu ✕ trần.
          '[&>[data-slot=dialog-close]]:bg-card [&>[data-slot=dialog-close]]:text-foreground [&>[data-slot=dialog-close]]:flex [&>[data-slot=dialog-close]]:size-7 [&>[data-slot=dialog-close]]:items-center [&>[data-slot=dialog-close]]:justify-center [&>[data-slot=dialog-close]]:rounded-full [&>[data-slot=dialog-close]]:opacity-100 [&>[data-slot=dialog-close]]:shadow-md'
        )}
      >
        {gift ? (
          <>
            {/* Hình S02 — khối đầu popup:
                - Ảnh quà là một KHUNG VUÔNG thụt vào hai bên, bắt đầu từ giữa dải
                  ruy-băng; nó nằm TRONG luồng nên chiếm đúng chiều cao của mình.
                - Ruy-băng và cụm chữ (tên quà · "trị giá" · số · đơn vị) nằm ĐÈ
                  lên khung ảnh đó.

                CHỖ CHỜ ASSET: đổ ảnh vào `gift.imageUrl` là khung có ảnh ngay. */}
            <div className='relative'>
              <div className='mx-3 mt-[46px] aspect-[16/12] overflow-hidden rounded-lg'>
                {gift.imageUrl ? (
                  <Photo src={gift.imageUrl} alt='' className='size-full' sizes='576px' />
                ) : (
                  <div className='border-brand-orange/30 bg-brand-orange-soft/40 relative size-full rounded-lg border-2 border-dashed'>
                    <span className='text-brand-orange/70 absolute inset-x-0 bottom-3 text-center text-[11px] font-medium'>
                      {t('imageSlot')}
                    </span>
                  </div>
                )}
              </div>

              <div className='absolute inset-x-0 top-0'>
                <div className='flex justify-center pt-6 pb-1'>
                  <span
                    aria-hidden
                    className='bg-brand-orange/70 h-11 w-10 [clip-path:polygon(0_0,100%_0,100%_100%,0_72%)]'
                  />
                  <DialogTitle className='bg-brand-orange text-brand-orange-foreground -mx-px flex items-center gap-2.5 px-8 py-2.5 text-base font-bold tracking-wide uppercase'>
                    <Gift className='size-5' />
                    {t('badge')}
                  </DialogTitle>
                  <span
                    aria-hidden
                    className='bg-brand-orange/70 h-11 w-10 [clip-path:polygon(0_0,100%_0,100%_72%,0_100%)]'
                  />
                </div>

                <div className='px-6 pt-2 text-center'>
                  <DialogDescription className='text-foreground text-base font-bold text-pretty'>
                    {gift.title}
                  </DialogDescription>
                  <p className='text-muted-foreground mt-1 text-xs'>{t('valuePrefix')}</p>
                  <p className='text-brand-orange mt-1 text-5xl leading-none font-extrabold tracking-tight tabular-nums'>
                    {valueNumber}
                  </p>
                  {valueUnit ? (
                    <p className='text-brand-orange mt-1 text-lg font-bold tracking-wide uppercase'>{valueUnit}</p>
                  ) : null}
                </div>
              </div>
            </div>

            <div className='space-y-3 px-6 pt-1 pb-5'>
              {/* Hình S02: khối này nền CAM NHẠT (không phải trắng), icon hộp quà to
                  trong vòng tròn trắng. */}
              <section className='bg-brand-orange-soft flex items-center gap-4 rounded-2xl p-4'>
                <span className='bg-card text-brand-orange flex size-14 shrink-0 items-center justify-center rounded-full shadow-sm'>
                  <Gift className='size-8' strokeWidth={2.25} />
                </span>
                <div className='min-w-0'>
                  <p className='text-brand-orange text-base font-bold tracking-wide uppercase'>{gift.extraTitle}</p>
                  <p className='mt-1.5 text-sm leading-relaxed text-pretty'>{gift.extraBody}</p>
                </div>
              </section>

              <Button className='brand-green-button h-12 w-full text-base' onClick={onClose}>
                {t('understood')}
              </Button>

              <p className='text-muted-foreground flex items-start gap-2 text-xs'>
                <Info className='mt-0.5 size-3.5 shrink-0' />
                {/* Hình S02: dòng cuối chỉ là câu điều kiện, không có nhãn
                    "Điều kiện áp dụng:" đứng trước. */}
                <span className='text-pretty'>{gift.conditions}</span>
              </p>
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
