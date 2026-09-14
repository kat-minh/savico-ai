'use client'

import { motion } from 'motion/react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

import { revealEase } from '@/shared/components/common'
import { useMediaQuery } from '@/shared/hooks'
import { cn } from '@/shared/lib/utils'
import { HOME_BRANDS } from '../constants/landing.constants'

/**
 * Dải "SAVICO được tin tưởng bởi" — bảy thương hiệu vật liệu.
 *
 * Hiện dựng bằng CHỮ (wordmark) chứ không nhúng logo: file logo là tài sản của
 * bên thứ ba, phải do khách cung cấp bản được phép dùng. Tên nằm trong i18n nên
 * đổi danh sách không cần deploy; khi có file logo thì thay `<span>` bằng ảnh.
 *
 * ★ Desktop đứng yên (logo hiện lần lượt, rê thì có màu + to nhẹ); mobile —
 * hoặc khi danh sách dài hơn 7 — đổi sang dải chạy ngang chậm, chạm/rê là dừng.
 */
export function HomeBrands() {
  const t = useTranslations('landing.brands')
  const isMobile = useMediaQuery('(max-width: 639px)')
  const [paused, setPaused] = useState(false)
  const marquee = isMobile || HOME_BRANDS.length > 7

  return (
    <section className='mx-auto w-full max-w-[90rem] px-4 lg:px-8'>
      <p className='text-primary text-xs font-semibold tracking-[0.16em] uppercase'>{t('label')}</p>

      {marquee ? (
        <div
          className='bg-card mt-3 overflow-hidden rounded-2xl border py-5'
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onTouchStart={() => setPaused(true)}
          onTouchEnd={() => setPaused(false)}
        >
          <div className={cn('animate-marquee flex w-max gap-10 px-6', paused && 'paused')}>
            {[...HOME_BRANDS, ...HOME_BRANDS].map((brand, index) => (
              <BrandItem key={`${brand}-${index}`} label={t(`items.${brand}`)} />
            ))}
          </div>
        </div>
      ) : (
        <ul className='bg-card mt-3 grid grid-cols-2 items-center gap-x-6 gap-y-4 rounded-2xl border px-6 py-5 sm:grid-cols-4 lg:grid-cols-7'>
          {HOME_BRANDS.map((brand, index) => (
            <motion.li
              key={brand}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, amount: 0.6 }}
              transition={{ duration: 0.4, delay: index * 0.06, ease: revealEase }}
            >
              <BrandItem label={t(`items.${brand}`)} />
            </motion.li>
          ))}
        </ul>
      )}
    </section>
  )
}

function BrandItem({ label }: { label: string }) {
  return (
    <span className='text-muted-foreground hover:text-foreground inline-block text-center text-sm font-bold tracking-wide whitespace-nowrap uppercase transition-[color,transform] hover:scale-105'>
      {label}
    </span>
  )
}
