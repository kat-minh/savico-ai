import { setRequestLocale } from 'next-intl/server'

import type { Locale } from '@/i18n/routing'
import { HomeSteps } from '@/features/landing'
import { ConsultantHighlights } from '@/features/consultation'
import { GuideHighlights } from '@/features/guide'
import { HomeBackdrop } from './home-backdrop'
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
      <HomeBackdrop />
      <HomeHeroSection />
      <HomeSteps />
      <GuideHighlights />
      {/* ★ Section Tư vấn 1:1 (mục III.2) — khối chuyển đổi cuối trang chủ. */}
      <ConsultantHighlights />
    </div>
  )
}
