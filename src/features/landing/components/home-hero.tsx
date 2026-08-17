'use client'

import { BookOpen, ShieldCheck, Sparkles, Target, Zap, type LucideIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Link } from '@/i18n/navigation'
import { cmsText, useCmsDocument } from '@/shared/cms'
import { Button } from '@/shared/components/ui/button'
import { ROUTES } from '@/shared/constants/routes'
import { HERO_PROMISES, type HeroPromise } from '../constants/landing.constants'
import { HeroShowcase } from './hero-showcase'

/** Biểu tượng cho từng điểm cam kết dưới CTA hero (mục II.2). */
const PROMISE_ICON: Record<HeroPromise, LucideIcon> = {
  fast: Zap,
  accurate: Target,
  secure: ShieldCheck
}

/**
 * Khối hero trang chủ, chia 2 cột (mục II.2).
 *
 * Cột trái: thông điệp chính (dòng 2 nhấn màu thương hiệu), mô tả ngắn, 2 nút và
 * dải 3 điểm cam kết. Cột phải: khung minh họa sản phẩm tương tác 4 tab.
 */
export function HomeHero({ onCreateProject }: { onCreateProject?: () => void }) {
  const t = useTranslations('landing.hero')
  // Chữ trên hero do admin sửa được (mục X); bỏ trống thì dùng bản dịch i18n.
  const home = useCmsDocument('home')
  const promiseCopy = (promise: HeroPromise) => home.promises.find((item) => item.id === promise)

  return (
    <section className='mx-auto grid w-full max-w-[90rem] items-center gap-10 px-4 py-16 lg:grid-cols-[9fr_10fr] lg:gap-10 lg:px-8 lg:py-24'>
      <div className='space-y-8'>
        <div className='space-y-5'>
          <h1 className='text-3xl leading-[1.15] font-bold tracking-tight sm:text-4xl lg:text-[2.5rem]'>
            {cmsText(home.heroTitleLead, t('titleLead'))}
            <br />
            <span className='brand-gradient-text'>{cmsText(home.heroTitleAccent, t('titleAccent'))}</span>
          </h1>
          <p className='text-muted-foreground max-w-md text-lg text-pretty'>
            {cmsText(home.heroSubtitle, t('subtitle'))}
          </p>
        </div>

        <div className='flex flex-col gap-3 sm:flex-row'>
          <Button size='lg' className='rounded-xl' onClick={onCreateProject}>
            <Sparkles className='size-4' />
            {cmsText(home.heroPrimaryCta, t('primaryCta'))}
          </Button>
          <Button asChild size='lg' variant='outline' className='rounded-xl'>
            <Link href={ROUTES.GUIDE}>
              <BookOpen className='size-4' />
              {cmsText(home.heroSecondaryCta, t('secondaryCta'))}
            </Link>
          </Button>
        </div>

        <ul className='flex flex-wrap gap-x-8 gap-y-4'>
          {HERO_PROMISES.map((promise) => {
            const Icon = PROMISE_ICON[promise]
            const copy = promiseCopy(promise)
            return (
              <li key={promise} className='flex items-center gap-3'>
                <span className='bg-primary/10 text-primary flex size-11 shrink-0 items-center justify-center rounded-full'>
                  <Icon className='size-5.5' />
                </span>
                <span className='flex flex-col leading-tight'>
                  <span className='text-base font-semibold'>
                    {cmsText(copy?.title, t(`promises.${promise}.title`))}
                  </span>
                  <span className='text-muted-foreground text-sm'>
                    {cmsText(copy?.hint, t(`promises.${promise}.hint`))}
                  </span>
                </span>
              </li>
            )
          })}
        </ul>
      </div>

      <HeroShowcase />
    </section>
  )
}
