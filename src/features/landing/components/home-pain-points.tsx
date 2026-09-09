'use client'

import { Clock, Coins, FileSearch, PencilRuler, UserRoundSearch, type LucideIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { ScribbleArrow } from '@/shared/components/common'
import { HOME_PAIN_POINTS, type HomePainPoint } from '../constants/landing.constants'

/** Biểu tượng theo ảnh mockup: tiền · thước-bút · kính lúp tìm người · hồ sơ · đồng hồ. */
const PAIN_ICON: Record<HomePainPoint, LucideIcon> = {
  budget: Coins,
  design: PencilRuler,
  contractor: UserRoundSearch,
  dossier: FileSearch,
  supervision: Clock
}

/**
 * Dải xanh đậm "Khó là kiểm soát mọi thứ cùng lúc" — 5 nỗi đau của chủ nhà.
 *
 * Nền xanh đặc tràn hết bề ngang, chữ trắng; 5 thẻ trắng nằm trên nền đó. Đây là
 * khối DUY NHẤT của trang chủ đảo màu, nên nó cũng là ranh giới thị giác giữa
 * phần giới thiệu sản phẩm (hero) và phần bán hàng bên dưới.
 */
export function HomePainPoints() {
  const t = useTranslations('landing.painPoints')

  return (
    <section className='bg-primary-strong text-primary-foreground'>
      <div className='mx-auto w-full max-w-[90rem] px-4 py-10 lg:px-8 lg:py-12'>
        <div className='flex flex-wrap items-end justify-between gap-x-10 gap-y-4'>
          <div className='space-y-2'>
            <p className='text-primary-foreground/70 text-xs font-semibold tracking-[0.16em] uppercase'>
              {t('eyebrow')}
            </p>
            <h2 className='text-2xl font-bold tracking-tight text-balance lg:text-[1.75rem]'>{t('title')}</h2>
            {/* Chỗ xuống dòng nằm trong chính câu chữ (`messages/*.json`). */}
            <p className='text-primary-foreground/80 max-w-5xl text-sm whitespace-pre-line'>{t('subtitle')}</p>
          </div>

          {/* Ghi chú viết tay + mũi tên vẽ tay chỉ xuống dải thẻ (ảnh mockup). */}
          <div className='hidden flex-col items-end lg:flex lg:translate-y-2'>
            <p className='font-hand mr-14 max-w-[15rem] -rotate-9 text-left text-xl leading-snug whitespace-pre-line'>
              {t('note')}
            </p>
            {/* Giữ đúng chiều ảnh mẫu: nét cong đi lên từ trái rồi đổ xuống,
                đầu mũi chỉ xuống-phải về phía dải thẻ. */}
            <ScribbleArrow className='text-primary-foreground/85 -mt-3 mr-5 h-8 w-20 rotate-120' />
          </div>
        </div>

        <ul className='mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5'>
          {HOME_PAIN_POINTS.map((point) => {
            const Icon = PAIN_ICON[point]
            return (
              <li
                key={point}
                className='bg-card text-card-foreground flex flex-col items-center gap-2.5 rounded-2xl border p-5 text-center'
              >
                <Icon className='text-primary size-7' strokeWidth={1.75} />
                <h3 className='text-sm leading-snug font-bold text-balance'>{t(`items.${point}.title`)}</h3>
                <p className='text-muted-foreground text-xs leading-relaxed text-pretty'>
                  {t(`items.${point}.description`)}
                </p>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
