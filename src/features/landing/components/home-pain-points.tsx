'use client'

import { ArrowRight, Clock, Coins, FileSearch, PencilRuler, UserRoundSearch, type LucideIcon } from 'lucide-react'
import { motion } from 'motion/react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

import { revealEase, ScribbleArrow } from '@/shared/components/common'
import { useScrollSnapIndex } from '@/shared/hooks'
import { scrollToAndFlash } from '@/shared/lib'
import { cn } from '@/shared/lib/utils'
import type { HomeJourneyStep } from '../constants/landing.constants'
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
 * Bấm thẻ → cuộn tới bước giải quyết tương ứng ở dải 5 bước (vùng 05, mục
 * II.2): chi phí & thiết kế đều giải quyết ở bước 02 (Thiết kế & Dự toán),
 * nhà thầu ở bước 04, hồ sơ ở bước 03, giám sát ở bước 05.
 */
const PAIN_TARGET_STEP: Record<HomePainPoint, HomeJourneyStep> = {
  budget: 'design',
  design: 'design',
  contractor: 'contractor',
  dossier: 'dossier',
  supervision: 'build'
}

const DIM_DELAY = ['delay-0', 'delay-75', 'delay-150', 'delay-200'] as const

/**
 * Dải xanh đậm "Khó là kiểm soát mọi thứ cùng lúc" — 5 nỗi đau của chủ nhà.
 *
 * Nền xanh đặc tràn hết bề ngang, chữ trắng; 5 thẻ trắng nằm trên nền đó. Đây là
 * khối DUY NHẤT của trang chủ đảo màu, nên nó cũng là ranh giới thị giác giữa
 * phần giới thiệu sản phẩm (hero) và phần bán hàng bên dưới.
 *
 * ★ Thẻ hiện lần lượt trái→phải, icon nhún 1 lần lúc hiện; rê thẻ thì 4 thẻ
 * còn lại mờ đi và lộ dòng "Xem cách SAVICO giải quyết →"; bấm thẻ cuộn tới
 * đúng bước giải quyết ở dải 5 bước. Mobile: cuộn ngang có chấm chỉ vị trí.
 */
export function HomePainPoints() {
  const t = useTranslations('landing.painPoints')
  const [hovered, setHovered] = useState<HomePainPoint | null>(null)
  const hoveredIndex = hovered === null ? -1 : HOME_PAIN_POINTS.indexOf(hovered)
  const { ref: trackRef, active, scrollTo } = useScrollSnapIndex<HTMLUListElement>()

  return (
    <section id='home-pain-points' className='bg-primary-strong text-primary-foreground'>
      <div className='mx-auto w-full max-w-[90rem] px-4 py-10 lg:px-8 lg:py-12'>
        <div className='flex flex-wrap items-end justify-between gap-x-10 gap-y-4'>
          <div className='space-y-2'>
            <motion.p
              initial={{ opacity: 0, y: '35%' }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.6 }}
              transition={{ duration: 0.7, ease: revealEase }}
              className='text-primary-foreground/70 text-xs font-semibold tracking-[0.16em] uppercase'
            >
              {t('eyebrow')}
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: '35%' }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.6 }}
              transition={{ duration: 0.75, delay: 0.08, ease: revealEase }}
              className='text-2xl font-bold tracking-tight text-balance lg:text-[1.75rem]'
            >
              {t('title')}
            </motion.h2>
            {/* Chỗ xuống dòng nằm trong chính câu chữ (`messages/*.json`). */}
            <motion.p
              initial={{ opacity: 0, y: '35%' }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.6 }}
              transition={{ duration: 0.75, delay: 0.18, ease: revealEase }}
              className='text-primary-foreground/80 max-w-5xl text-sm whitespace-pre-line'
            >
              {t('subtitle')}
            </motion.p>
          </div>

          {/* Ghi chú viết tay + mũi tên vẽ tay chỉ xuống dải thẻ (ảnh mockup) —
              vẽ nét SAU CÙNG, đúng thứ tự mở màn của khối. */}
          <motion.div
            initial={{ opacity: 0, clipPath: 'inset(0 100% 0 0)' }}
            whileInView={{ opacity: 1, clipPath: 'inset(0 0% 0 0)' }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.6, delay: 0.9, ease: revealEase }}
            className='hidden flex-col items-end lg:flex lg:translate-y-2'
          >
            <p className='font-hand mr-14 max-w-[15rem] -rotate-9 text-left text-xl leading-snug whitespace-pre-line'>
              {t('note')}
            </p>
            {/* Giữ đúng chiều ảnh mẫu: nét cong đi lên từ trái rồi đổ xuống,
                đầu mũi chỉ xuống-phải về phía dải thẻ. */}
            <ScribbleArrow className='text-primary-foreground/85 -mt-3 mr-5 h-8 w-20 rotate-120' />
          </motion.div>
        </div>

        <ul
          ref={trackRef}
          className='mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-1 sm:grid sm:grid-cols-2 sm:overflow-visible lg:grid-cols-5'
        >
          {HOME_PAIN_POINTS.map((point, index) => {
            const Icon = PAIN_ICON[point]
            const isHovered = hovered === point
            const dimmed = hovered !== null && !isHovered
            const dimOrder = dimmed ? index - (index > hoveredIndex ? 1 : 0) : 0

            return (
              <motion.li
                key={point}
                initial={{ opacity: 0, y: '12%' }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.65, delay: index * 0.12, ease: revealEase }}
                onMouseEnter={() => setHovered(point)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => scrollToAndFlash(`home-journey-step-${PAIN_TARGET_STEP[point]}`)}
                className='flex w-[78%] shrink-0 cursor-pointer snap-start sm:w-auto sm:shrink'
              >
                <div
                  className={cn(
                    'bg-card text-card-foreground flex min-h-52 h-full w-full flex-col items-center gap-2.5 rounded-2xl border p-5 text-center transition-[opacity,transform,border-color,box-shadow] duration-500 ease-out motion-reduce:transform-none motion-reduce:transition-none',
                    dimmed ? cn('opacity-45', DIM_DELAY[dimOrder]) : 'delay-0 opacity-100',
                    isHovered && 'border-primary/50 ring-primary/15 -translate-y-1 shadow-md ring-4'
                  )}
                >
                  <motion.span
                    initial={{ scale: 1 }}
                    whileInView={{ scale: [1, 1.15, 1] }}
                    viewport={{ once: true, amount: 0.4 }}
                    transition={{ duration: 0.4, delay: index * 0.1 + 0.15 }}
                  >
                    <Icon className='text-primary size-7' strokeWidth={1.75} />
                  </motion.span>
                  <h3 className='text-sm leading-snug font-bold text-balance'>{t(`items.${point}.title`)}</h3>
                  <p className='text-muted-foreground text-xs leading-relaxed text-pretty'>
                    {t(`items.${point}.description`)}
                  </p>
                  <div className='mt-auto flex min-h-8 items-end justify-center pt-2'>
                    <span
                      className={cn(
                        'text-primary inline-flex items-center gap-1 text-xs font-medium whitespace-nowrap transition-[opacity,transform] duration-500 ease-out motion-reduce:transition-none',
                        isHovered ? 'translate-y-0 opacity-100' : 'translate-y-1 opacity-0'
                      )}
                    >
                      {t('solveHint')}
                      <ArrowRight className='size-3.5 shrink-0' />
                    </span>
                  </div>
                </div>
              </motion.li>
            )
          })}
        </ul>

        {/* Chấm chỉ vị trí — chỉ có ý nghĩa trên mobile (cuộn ngang). */}
        <div className='mt-4 flex items-center justify-center gap-2 sm:hidden'>
          {HOME_PAIN_POINTS.map((point, index) => (
            <button
              key={point}
              type='button'
              aria-label={t(`items.${point}.title`)}
              onClick={() => scrollTo(index)}
              className={cn(
                'size-1.5 rounded-full transition-colors',
                index === active ? 'bg-primary-foreground' : 'bg-primary-foreground/35'
              )}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
