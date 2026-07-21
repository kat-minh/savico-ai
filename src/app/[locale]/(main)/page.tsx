import { setRequestLocale } from 'next-intl/server'

import type { Locale } from '@/i18n/routing'
import { AmbientAura } from '@/shared/components/common'
import { HomeSteps } from '@/features/landing'
import { GuideHighlights } from '@/features/guide'
import { HomeHeroSection } from './home-hero-section'

interface PageProps {
  params: Promise<{ locale: Locale }>
}

/** Màn hình 1 — Trang chủ (mục II.2). */
export default async function HomePage({ params }: PageProps) {
  const { locale } = await params
  setRequestLocale(locale)

  return (
    <div className='relative'>
      <AmbientAura className='fixed' />
      <HomeHeroSection />
      <HomeSteps />
      <GuideHighlights />
    </div>
  )
}
