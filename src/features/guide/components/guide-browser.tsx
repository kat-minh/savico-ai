'use client'

import { ChevronLeft, ChevronRight, Search } from 'lucide-react'
import { useState } from 'react'
import { useTranslations } from 'next-intl'

import { EmptyState, Photo } from '@/shared/components/common'
import { Input } from '@/shared/components/ui/input'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { useDebouncedValue } from '@/shared/hooks'
import { GUIDE_PAGE_SIZE } from '../constants/guide.constants'
import { useGuideArticles, useGuideVideos } from '../hooks/use-guide'
import type { GuideVideo } from '../types/guide.types'
import { VideoCard } from './video-card'
import { VideoLightbox } from './video-lightbox'

/**
 * Trang Hướng dẫn (mục VI, Hình 12).
 *
 * Ô tìm lớn giữa đầu trang, rồi CAROUSEL thẻ video đánh số: mũi tên trái/phải
 * hai bên lưới 3 cột × 2 hàng, chấm phân trang bên dưới. Bấm thẻ mở trình phát
 * phóng to ngay trên trang (★ lightbox), không điều hướng đi đâu. Bài viết
 * hướng dẫn chỉ hiện khi đang tìm kiếm.
 *
 * ★ mục VI còn "đề xuất" một video nổi bật cỡ lớn đầu trang, nhưng yêu cầu tối
 * thiểu của Giai đoạn 1 là GIỮ CAROUSEL như demo — nên bám Hình 12; video admin
 * đánh dấu nổi bật chỉ được đẩy lên vị trí đầu carousel.
 *
 * Mỗi topic có `id` neo để nút "?" trong luồng 3 bước deep-link tới đúng chỗ.
 */
export function GuideBrowser() {
  const t = useTranslations('guide')
  const [term, setTerm] = useState('')
  const [page, setPage] = useState(0)
  const [playing, setPlaying] = useState<GuideVideo | null>(null)
  const query = useDebouncedValue(term, 250).trim().toLowerCase()

  const { data: videos, isPending: videosPending } = useGuideVideos()
  const { data: articles, isPending: articlesPending } = useGuideArticles()

  const matches = (text: string) => !query || text.toLowerCase().includes(query)
  const visibleArticles = (articles ?? []).filter((a) => matches(a.title) || matches(a.excerpt))

  // Giữ NGUYÊN thứ tự API trả về — đó là thứ tự admin sắp (mục X, #3) và cũng là
  // thứ tự đánh số trong Hình 12; video được đánh dấu nổi bật đứng đầu.
  const allVideos = [...(videos ?? [])].sort((a, b) => Number(b.featured ?? false) - Number(a.featured ?? false))
  const visibleVideos = allVideos.filter((v) => matches(v.title) || matches(v.description))

  // Neo cho nút "?" trong luồng: đặt ở video đầu tiên của mỗi bước.
  const topicAnchors = new Map<string, string>()
  for (const video of visibleVideos) if (!topicAnchors.has(video.topic)) topicAnchors.set(video.topic, video.id)

  const pageCount = Math.max(1, Math.ceil(visibleVideos.length / GUIDE_PAGE_SIZE))
  const safePage = Math.min(page, pageCount - 1)
  const pageVideos = visibleVideos.slice(safePage * GUIDE_PAGE_SIZE, (safePage + 1) * GUIDE_PAGE_SIZE)

  const goTo = (next: number) => setPage(Math.min(Math.max(0, next), pageCount - 1))

  return (
    <div className='mx-auto w-full max-w-6xl px-4 py-10 lg:px-8'>
      {/* Hình 12 không có tiêu đề trang — ô tìm là thứ đầu tiên. Giữ h1 ẩn để
          trang vẫn có tiêu đề cho trình đọc màn hình và SEO. */}
      <h1 className='sr-only'>{t('title')}</h1>

      <div className='relative mx-auto mb-8 w-full max-w-2xl'>
        <Search className='text-muted-foreground pointer-events-none absolute top-1/2 left-5 size-5 -translate-y-1/2' />
        <Input
          type='search'
          value={term}
          onChange={(event) => {
            setTerm(event.target.value)
            setPage(0)
          }}
          placeholder={t('searchPlaceholder')}
          aria-label={t('searchPlaceholder')}
          className='h-14 rounded-full pl-13 text-base shadow-sm'
        />
      </div>

      {videosPending ? (
        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className='h-64 w-full rounded-xl' />
          ))}
        </div>
      ) : visibleVideos.length === 0 && visibleArticles.length === 0 ? (
        <EmptyState title={t('empty.title')} description={t('empty.description')} />
      ) : (
        <div className='space-y-12'>
          {visibleVideos.length > 0 ? (
            <section aria-roledescription='carousel' aria-label={t('carouselLabel')}>
              <div className='relative'>
                {/* Mũi tên nằm NGOÀI lưới, canh giữa theo chiều dọc — Hình 12
                    luôn hiển thị cặp mũi tên, vô hiệu khi ở đầu / cuối. */}
                <button
                  type='button'
                  aria-label={t('prev')}
                  onClick={() => goTo(safePage - 1)}
                  disabled={safePage === 0}
                  className='bg-card hover:bg-accent absolute top-1/2 -left-3 z-10 flex size-10 -translate-y-1/2 items-center justify-center rounded-full border shadow-sm transition-colors disabled:opacity-40 lg:-left-12'
                >
                  <ChevronLeft className='size-5' />
                </button>

                <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
                  {pageVideos.map((video) => (
                    <VideoCard
                      key={video.id}
                      video={video}
                      hideDescription
                      // Đánh số theo vị trí trong TOÀN BỘ danh sách chứ không
                      // theo trang — số phải khớp danh sách trong spec.
                      index={visibleVideos.indexOf(video) + 1}
                      onOpenVideo={setPlaying}
                      {...(topicAnchors.get(video.topic) === video.id ? { id: video.topic } : {})}
                      className='scroll-mt-32'
                    />
                  ))}
                </div>

                <button
                  type='button'
                  aria-label={t('next')}
                  onClick={() => goTo(safePage + 1)}
                  disabled={safePage === pageCount - 1}
                  className='bg-card hover:bg-accent absolute top-1/2 -right-3 z-10 flex size-10 -translate-y-1/2 items-center justify-center rounded-full border shadow-sm transition-colors disabled:opacity-40 lg:-right-12'
                >
                  <ChevronRight className='size-5' />
                </button>
              </div>

              <div className='mt-6 flex items-center justify-center gap-2'>
                {Array.from({ length: pageCount }, (_, index) => (
                  <button
                    key={index}
                    type='button'
                    aria-label={t('goToPage', { page: index + 1 })}
                    aria-current={index === safePage ? 'true' : undefined}
                    onClick={() => goTo(index)}
                    className={
                      index === safePage
                        ? 'bg-primary size-2.5 rounded-full'
                        : 'bg-muted-foreground/30 hover:bg-muted-foreground/50 size-2.5 rounded-full transition-colors'
                    }
                  />
                ))}
              </div>
            </section>
          ) : null}

          {/* Hình 12 chỉ có carousel video. Danh sách bài viết chỉ hiện khi
              người dùng gõ tìm — vì ô tìm hứa tìm cả "bài hướng dẫn". */}
          {articlesPending || !query ? null : visibleArticles.length > 0 ? (
            <section>
              <h2 className='mb-4 text-lg font-semibold tracking-tight'>{t('articlesTitle')}</h2>
              <div className='grid gap-4 sm:grid-cols-2'>
                {visibleArticles.map((article) => (
                  <article key={article.id} className='bg-card flex gap-3 overflow-hidden rounded-xl border p-3'>
                    <Photo
                      className='size-20 shrink-0 rounded-lg'
                      src={article.imageUrl}
                      alt={article.title}
                      sizes='80px'
                    />
                    <div className='min-w-0 space-y-1'>
                      <h3 className='text-sm font-semibold'>{article.title}</h3>
                      <p className='text-muted-foreground line-clamp-2 text-xs leading-relaxed'>{article.excerpt}</p>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      )}

      <VideoLightbox video={playing} onClose={() => setPlaying(null)} />
    </div>
  )
}
