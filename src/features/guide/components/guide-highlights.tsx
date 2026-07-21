'use client'

import { ArrowRight } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Link } from '@/i18n/navigation'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { ROUTES } from '@/shared/constants/routes'
import { HOME_GUIDE_HIGHLIGHT_COUNT } from '../constants/guide.constants'
import { useGuideVideos } from '../hooks/use-guide'
import { VideoCard } from './video-card'

/**
 * Khu "Hướng dẫn sử dụng" trên trang chủ (mục II.2):
 * 3 thẻ video nổi bật + liên kết "Xem tất cả" mở trang Hướng dẫn.
 */
export function GuideHighlights() {
  const t = useTranslations('guide.highlights')
  const { data: videos, isPending } = useGuideVideos()

  return (
    <section className='mx-auto w-full max-w-6xl px-4 py-16 lg:px-8'>
      <header className='mb-8 flex flex-wrap items-end justify-between gap-4'>
        <div className='space-y-2'>
          <h2 className='text-2xl font-semibold tracking-tight sm:text-3xl'>{t('title')}</h2>
          <p className='text-muted-foreground'>{t('subtitle')}</p>
        </div>
        <Link
          href={ROUTES.GUIDE}
          className='text-primary inline-flex items-center gap-1.5 text-sm font-medium hover:underline'
        >
          {t('viewAll')}
          <ArrowRight className='size-4' />
        </Link>
      </header>

      <div className='grid gap-5 sm:grid-cols-2 lg:grid-cols-3'>
        {isPending
          ? Array.from({ length: HOME_GUIDE_HIGHLIGHT_COUNT }, (_, i) => (
              <Skeleton key={i} className='h-56 w-full rounded-xl' />
            ))
          : videos?.slice(0, HOME_GUIDE_HIGHLIGHT_COUNT).map((video) => <VideoCard key={video.id} video={video} />)}
      </div>
    </section>
  )
}
