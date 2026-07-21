'use client'

import { Check, Plus } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Link } from '@/i18n/navigation'
import { Button } from '@/shared/components/ui/button'
import { ROUTES } from '@/shared/constants/routes'
import { HERO_PROMISES } from '../constants/landing.constants'
import { HeroShowcase } from './hero-showcase'

/**
 * Khối hero trang chủ, chia 2 cột (mục II.2).
 *
 * Cột trái: thông điệp chính, mô tả ngắn, 2 nút và dải 3 điểm cam kết.
 * Cột phải: khung minh họa sản phẩm tương tác 4 tab.
 */
export function HomeHero({ onCreateProject }: { onCreateProject?: () => void }) {
  const t = useTranslations('landing.hero')

  return (
    <section className='mx-auto grid w-full max-w-6xl items-center gap-12 px-4 py-16 lg:grid-cols-2 lg:gap-16 lg:px-8 lg:py-24'>
      <div className='space-y-8'>
        <div className='space-y-4'>
          <h1 className='text-4xl font-semibold tracking-tight text-balance sm:text-5xl'>{t('title')}</h1>
          <p className='text-muted-foreground text-lg text-pretty'>{t('subtitle')}</p>
        </div>

        <div className='flex flex-col gap-3 sm:flex-row'>
          <Button size='lg' className='rounded-full' onClick={onCreateProject}>
            <Plus className='size-4' />
            {t('primaryCta')}
          </Button>
          <Button asChild size='lg' variant='outline' className='rounded-full'>
            <Link href={ROUTES.GUIDE}>{t('secondaryCta')}</Link>
          </Button>
        </div>

        <ul className='flex flex-wrap gap-x-6 gap-y-2'>
          {HERO_PROMISES.map((promise) => (
            <li key={promise} className='flex items-center gap-2 text-sm font-medium'>
              <span className='bg-primary/10 text-primary flex size-5 items-center justify-center rounded-full'>
                <Check className='size-3' />
              </span>
              {t(`promises.${promise}`)}
            </li>
          ))}
        </ul>
      </div>

      <HeroShowcase />
    </section>
  )
}
