'use client'

import { motion } from 'motion/react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

import { revealEase } from '@/shared/components/common'
import { useMediaQuery } from '@/shared/hooks'
import { cn } from '@/shared/lib/utils'
import { HOME_BRAND_LOGOS, HOME_BRANDS } from '../constants/landing.constants'

/**
 * Dải "được tin tưởng bởi" — logo sáu thương hiệu vật liệu do khách cung cấp.
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
              <BrandItem key={`${brand}-${index}`} src={HOME_BRAND_LOGOS[brand]} label={t(`items.${brand}`)} />
            ))}
          </div>
        </div>
      ) : (
        <ul className='bg-card mt-3 grid grid-cols-2 items-center gap-x-6 gap-y-4 rounded-2xl border px-6 py-5 sm:grid-cols-3 lg:grid-cols-6'>
          {HOME_BRANDS.map((brand, index) => (
            <motion.li
              key={brand}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, amount: 0.6 }}
              transition={{ duration: 0.4, delay: index * 0.06, ease: revealEase }}
            >
              <BrandItem src={HOME_BRAND_LOGOS[brand]} label={t(`items.${brand}`)} />
            </motion.li>
          ))}
        </ul>
      )}
    </section>
  )
}

function BrandItem({ src, label }: { src: string; label: string }) {
  return (
    // Khung cố định 8rem × 3rem, logo co vừa khung: logo vuông (Viglacera, Hòa
    // Phát) cao hết khung, logo ngang (CADIVI) rộng hết khung — nhìn cân nhau.
    <span className='flex h-12 w-32 items-center justify-center'>
      {/* eslint-disable-next-line @next/next/no-img-element -- logo nhỏ, tỉ lệ khác nhau; `h` cố định, bề ngang tự theo ảnh */}
      <img
        src={src}
        alt={label}
        loading='lazy'
        className='max-h-full max-w-full object-contain transition-transform duration-300 hover:scale-105'
      />
    </span>
  )
}
