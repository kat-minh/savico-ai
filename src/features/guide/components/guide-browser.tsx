'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'

import { EmptyState, Photo } from '@/shared/components/common'
import { Input } from '@/shared/components/ui/input'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { useDebouncedValue } from '@/shared/hooks'
import { GUIDE_TOPICS } from '../constants/guide.constants'
import { useGuideArticles, useGuideVideos } from '../hooks/use-guide'
import { VideoCard } from './video-card'

/**
 * Trang Hướng dẫn (màn hình 3, mục II.4).
 *
 * Chỉ chứa tài liệu hướng dẫn sử dụng: ô tìm kiếm, lưới video ngắn sắp theo
 * bước, và các bài hướng dẫn dạng chữ kèm ảnh. Mỗi nhóm topic có `id` để nút
 * "?" trong luồng 3 bước deep-link tới đúng chỗ.
 */
export function GuideBrowser() {
  const t = useTranslations('guide')
  const [term, setTerm] = useState('')
  const query = useDebouncedValue(term, 250).trim().toLowerCase()

  const { data: videos, isPending: videosPending } = useGuideVideos()
  const { data: articles, isPending: articlesPending } = useGuideArticles()

  const matches = (text: string) => !query || text.toLowerCase().includes(query)
  const visibleVideos = (videos ?? []).filter((v) => matches(v.title) || matches(v.description))
  const visibleArticles = (articles ?? []).filter((a) => matches(a.title) || matches(a.excerpt))

  // Sắp video theo thứ tự bước của luồng 3 bước; nhớ video đầu tiên của mỗi bước
  // để gắn neo cho nút "?" deep-link tới.
  const orderedVideos = GUIDE_TOPICS.flatMap((topic) => visibleVideos.filter((video) => video.topic === topic))
  const topicAnchors = new Map<string, string>()
  for (const video of orderedVideos) if (!topicAnchors.has(video.topic)) topicAnchors.set(video.topic, video.id)

  return (
    <div className='mx-auto w-full max-w-6xl px-4 py-10 lg:px-8'>
      <header className='mb-8 space-y-4'>
        <div className='space-y-2'>
          <h1 className='text-3xl font-semibold tracking-tight'>{t('title')}</h1>
          <p className='text-muted-foreground'>{t('subtitle')}</p>
        </div>
        <Input
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder={t('searchPlaceholder')}
          className='max-w-md'
        />
      </header>

      {videosPending ? (
        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className='h-56 w-full rounded-xl' />
          ))}
        </div>
      ) : visibleVideos.length === 0 && visibleArticles.length === 0 ? (
        <EmptyState title={t('empty.title')} description={t('empty.description')} />
      ) : (
        <div className='space-y-12'>
          {orderedVideos.length > 0 ? (
            <section>
              <h2 className='mb-4 text-lg font-semibold tracking-tight'>{t('videosTitle')}</h2>
              {/* MỘT lưới duy nhất, sắp theo thứ tự bước và mỗi thẻ tự mang nhãn
                  bước. Tách mỗi bước thành một section riêng để lại hai ô trống
                  bên cạnh mỗi video và kéo trang dài ra vô ích. */}
              <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
                {orderedVideos.map((video) => (
                  <VideoCard
                    key={video.id}
                    video={video}
                    topicLabel={t(`topics.${video.topic}`)}
                    // Neo cho nút "?" trong luồng: đặt ở video đầu tiên của bước.
                    {...(topicAnchors.get(video.topic) === video.id ? { id: video.topic } : {})}
                    className='scroll-mt-32'
                  />
                ))}
              </div>
            </section>
          ) : null}

          {articlesPending ? null : visibleArticles.length > 0 ? (
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
    </div>
  )
}
