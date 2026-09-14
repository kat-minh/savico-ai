'use client'

import { ChevronLeft, ChevronRight, Search, X } from 'lucide-react'
import { AnimatePresence, motion, type PanInfo, type Variants } from 'motion/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'

import { EmptyState, Photo, revealEase } from '@/shared/components/common'
import { Input } from '@/shared/components/ui/input'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/components/ui/tooltip'
import { useDebouncedValue } from '@/shared/hooks'
import { cn } from '@/shared/lib/utils'
import { GUIDE_PAGE_SIZE, GUIDE_TOPICS } from '../constants/guide.constants'
import { useGuideArticles, useGuideVideos } from '../hooks/use-guide'
import { useGuideProgressStore } from '../store/guide-progress.store'
import { matchesQuery } from '../services/guide.service'
import type { GuideVideo } from '../types/guide.types'
import { HighlightedText, VideoCard, type VideoCardOrigin } from './video-card'
import { VideoLightbox } from './video-lightbox'

const gridItemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: (index: number) => ({ opacity: 1, y: 0, transition: { duration: 0.4, delay: index * 0.06, ease: revealEase } })
}

const SUGGESTED_TOPICS = GUIDE_TOPICS.slice(0, 4)

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
  const [pageDirection, setPageDirection] = useState(1)
  const [playing, setPlaying] = useState<GuideVideo | null>(null)
  const [playOrigin, setPlayOrigin] = useState<VideoCardOrigin | null>(null)
  const [searchFocused, setSearchFocused] = useState(false)
  const [clearPulse, setClearPulse] = useState(0)
  const [justCompletedTopicId, setJustCompletedTopicId] = useState<string | null>(null)
  const [nextCardPulse, setNextCardPulse] = useState(0)
  const query = useDebouncedValue(term, 300).trim()

  const inputRef = useRef<HTMLInputElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const getProgress = useGuideProgressStore((s) => s.getProgress)

  const { data: videos, isPending: videosPending } = useGuideVideos()
  const { data: articles, isPending: articlesPending } = useGuideArticles()

  const visibleArticles = (articles ?? []).filter((a) => matchesQuery(a.title, query) || matchesQuery(a.excerpt, query))

  // Giữ NGUYÊN thứ tự API trả về — đó là thứ tự admin sắp (mục X, #3) và cũng là
  // thứ tự đánh số trong Hình 12; video được đánh dấu nổi bật đứng đầu.
  const allVideos = useMemo(
    () => [...(videos ?? [])].sort((a, b) => Number(b.featured ?? false) - Number(a.featured ?? false)),
    [videos]
  )
  const visibleVideos = allVideos.filter((v) => matchesQuery(v.title, query) || matchesQuery(v.description, query))

  // Chữ gợi ý luân phiên theo NỘI DUNG THẬT — vài giây một lần, dừng khi ô có
  // tiêu điểm; đứng yên nếu chưa có dữ liệu.
  const placeholderPool = useMemo(() => allVideos.slice(0, 6).map((v) => v.title), [allVideos])
  const [placeholderIndex, setPlaceholderIndex] = useState(0)
  useEffect(() => {
    if (searchFocused || placeholderPool.length < 2) return
    const id = setInterval(() => setPlaceholderIndex((i) => (i + 1) % placeholderPool.length), 2800)
    return () => clearInterval(id)
  }, [searchFocused, placeholderPool.length])

  // Phím "/" lấy tiêu điểm ô tìm — trừ khi đang gõ vào một ô nhập khác.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== '/') return
      const tag = document.activeElement?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      event.preventDefault()
      inputRef.current?.focus()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  // Neo cho nút "?" trong luồng: đặt ở video đầu tiên của mỗi bước.
  const topicAnchors = new Map<string, string>()
  for (const video of visibleVideos) if (!topicAnchors.has(video.topic)) topicAnchors.set(video.topic, video.id)

  const pageCount = Math.max(1, Math.ceil(visibleVideos.length / GUIDE_PAGE_SIZE))
  const safePage = Math.min(page, pageCount - 1)
  const pageVideos = visibleVideos.slice(safePage * GUIDE_PAGE_SIZE, (safePage + 1) * GUIDE_PAGE_SIZE)
  const singlePage = pageCount <= 1

  function goTo(next: number, direction: number) {
    setPageDirection(direction)
    setPage(Math.min(Math.max(0, next), pageCount - 1))
  }

  function onDragEnd(_: unknown, info: PanInfo) {
    const threshold = 60
    if (info.offset.x <= -threshold && safePage < pageCount - 1) goTo(safePage + 1, 1)
    else if (info.offset.x >= threshold && safePage > 0) goTo(safePage - 1, -1)
  }

  function openVideo(video: GuideVideo, origin: VideoCardOrigin | null) {
    setPlaying(video)
    setPlayOrigin(origin)
  }

  function closeVideo() {
    // Vừa xem xong thì đóng popup → thẻ CHƯA XEM kế tiếp cùng chủ đề sáng viền
    // một nhịp (mục 3, "đóng popup sau khi xem xong").
    if (playing && getProgress(playing.id)?.completed) {
      const next = visibleVideos.find(
        (v) => v.id !== playing.id && v.topic === playing.topic && !getProgress(v.id)?.completed
      )
      if (next) {
        setJustCompletedTopicId(next.id)
        setNextCardPulse((n) => n + 1)
        setTimeout(() => setJustCompletedTopicId(null), 1000)
      }
    }
    setPlaying(null)
    setPlayOrigin(null)
  }

  const showEmpty = !videosPending && visibleVideos.length === 0 && visibleArticles.length === 0
  const searching = query.length > 0

  return (
    <div className='mx-auto w-full max-w-6xl px-4 py-10 lg:px-8'>
      {/* Hình 12 không có tiêu đề trang — ô tìm là thứ đầu tiên. Giữ h1 ẩn để
          trang vẫn có tiêu đề cho trình đọc màn hình và SEO. */}
      <h1 className='sr-only'>{t('title')}</h1>

      <motion.div
        initial={{ opacity: 0, y: -14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: revealEase }}
        className='relative mx-auto mb-8 w-full max-w-2xl'
      >
        <Search
          className={cn(
            'pointer-events-none absolute top-1/2 left-5 size-5 -translate-y-1/2 transition-colors',
            searchFocused ? 'text-primary' : 'text-muted-foreground'
          )}
        />

        {term === '' && placeholderPool[placeholderIndex] ? (
          <div className='pointer-events-none absolute inset-y-0 right-13 left-13 overflow-hidden'>
            <AnimatePresence initial={false}>
              <motion.span
                key={placeholderIndex}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.3 }}
                className='text-muted-foreground absolute inset-0 flex items-center truncate text-base'
              >
                {placeholderPool[placeholderIndex]}
              </motion.span>
            </AnimatePresence>
          </div>
        ) : null}

        <Input
          ref={inputRef}
          type='search'
          value={term}
          onChange={(event) => {
            setTerm(event.target.value)
            setPage(0)
          }}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
            } else if (event.key === 'Escape') {
              if (term) {
                event.stopPropagation()
                setTerm('')
              } else {
                inputRef.current?.blur()
              }
            }
          }}
          placeholder={t('searchPlaceholder')}
          aria-label={t('searchPlaceholder')}
          className='[&::-webkit-search-cancel-button]:appearance-none h-14 rounded-full pl-13 pr-13 text-base placeholder:text-transparent transition-shadow hover:shadow-md'
        />

        {term ? (
          <button
            type='button'
            onClick={() => {
              setTerm('')
              setPage(0)
              setClearPulse((n) => n + 1)
              inputRef.current?.focus()
            }}
            aria-label={t('search.clear')}
            className='text-muted-foreground hover:text-foreground group absolute top-1/2 right-5 -translate-y-1/2'
          >
            <motion.span whileHover={{ rotate: 90 }} transition={{ duration: 0.2 }} className='flex'>
              <X className='size-5' />
            </motion.span>
          </button>
        ) : null}
      </motion.div>

      {videosPending ? (
        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className='h-64 w-full rounded-xl' />
          ))}
        </div>
      ) : showEmpty ? (
        <div className='space-y-6'>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
            <EmptyState title={t('empty.title')} description={t('empty.description')} />
          </motion.div>
          {searching ? (
            <div className='flex flex-wrap items-center justify-center gap-2'>
              <span className='text-muted-foreground text-sm'>{t('search.tryTopic')}</span>
              {SUGGESTED_TOPICS.map((topic) => (
                <button
                  key={topic}
                  type='button'
                  onClick={() => setTerm(t(`topics.${topic}`))}
                  className='bg-secondary text-secondary-foreground hover:bg-primary hover:text-primary-foreground rounded-full px-3 py-1 text-xs font-medium transition-colors'
                >
                  {t(`topics.${topic}`)}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ) : (
        <div ref={gridRef} className='scroll-mt-24 space-y-12'>
          {visibleVideos.length > 0 ? (
            <section aria-roledescription='carousel' aria-label={t('carouselLabel')} className='group/carousel'>
              <div className='relative'>
                {/* Mũi tên nằm NGOÀI lưới, canh giữa theo chiều dọc — mờ nghỉ,
                    rõ khi rê vào cả khối carousel, tắt hẳn nếu chỉ có 1 trang. */}
                {!singlePage ? (
                  <motion.button
                    type='button'
                    aria-label={t('prev')}
                    onClick={() => goTo(safePage - 1, -1)}
                    disabled={safePage === 0}
                    whileHover={{ x: -2 }}
                    whileTap={{ scale: 0.92 }}
                    className='bg-card hover:bg-accent absolute top-1/2 -left-3 z-10 flex size-10 -translate-y-1/2 items-center justify-center rounded-full border opacity-70 shadow-sm transition-[background-color,opacity] duration-300 group-hover/carousel:opacity-100 disabled:opacity-35 lg:-left-12'
                  >
                    <ChevronLeft className='size-5' />
                  </motion.button>
                ) : null}

                <div className='overflow-hidden'>
                  <AnimatePresence mode='wait' initial={false} custom={pageDirection}>
                    <motion.div
                      key={`${safePage}-${clearPulse}`}
                      custom={pageDirection}
                      drag={pageCount > 1 ? 'x' : false}
                      dragConstraints={{ left: 0, right: 0 }}
                      dragElastic={0.12}
                      onDragEnd={onDragEnd}
                      initial={{ opacity: 0, x: pageDirection * 40 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: pageDirection * -40, transition: { duration: 0.15 } }}
                      transition={{ duration: 0.3, ease: revealEase }}
                      className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'
                    >
                      {pageVideos.map((video, index) => (
                        <motion.div
                          key={video.id}
                          layout
                          custom={index}
                          variants={gridItemVariants}
                          initial='hidden'
                          animate='show'
                          exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.2 } }}
                        >
                          <VideoCard
                            video={video}
                            hideDescription
                            // Đánh số theo vị trí trong TOÀN BỘ danh sách chứ không
                            // theo trang — số phải khớp danh sách trong spec.
                            index={visibleVideos.indexOf(video) + 1}
                            onOpenVideo={openVideo}
                            query={query}
                            pulseKey={video.id === justCompletedTopicId ? nextCardPulse : undefined}
                            {...(topicAnchors.get(video.topic) === video.id ? { id: video.topic } : {})}
                            className='scroll-mt-32'
                          />
                        </motion.div>
                      ))}
                    </motion.div>
                  </AnimatePresence>
                </div>

                {!singlePage ? (
                  <motion.button
                    type='button'
                    aria-label={t('next')}
                    onClick={() => goTo(safePage + 1, 1)}
                    disabled={safePage === pageCount - 1}
                    whileHover={{ x: 2 }}
                    whileTap={{ scale: 0.92 }}
                    className='bg-card hover:bg-accent absolute top-1/2 -right-3 z-10 flex size-10 -translate-y-1/2 items-center justify-center rounded-full border opacity-70 shadow-sm transition-[background-color,opacity] duration-300 group-hover/carousel:opacity-100 disabled:opacity-35 lg:-right-12'
                  >
                    <ChevronRight className='size-5' />
                  </motion.button>
                ) : null}
              </div>

              {!singlePage ? (
                <div className='mt-6 flex items-center justify-center gap-2'>
                  {Array.from({ length: pageCount }, (_, index) => (
                    <Tooltip key={index}>
                      <TooltipTrigger asChild>
                        <button
                          type='button'
                          aria-label={t('goToPage', { page: index + 1 })}
                          aria-current={index === safePage ? 'true' : undefined}
                          onClick={() => goTo(index, index > safePage ? 1 : -1)}
                          className='relative isolate flex h-2.5 w-6 items-center justify-center'
                        >
                          {index === safePage ? (
                            <motion.span
                              layoutId='guide-page-dot'
                              transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                              className='bg-primary absolute inset-0 rounded-full'
                            />
                          ) : (
                            <span className='bg-muted-foreground/30 hover:bg-muted-foreground/50 size-2.5 rounded-full transition-colors' />
                          )}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>{t('goToPage', { page: index + 1 })}</TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              ) : null}
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
                      <h3 className='text-sm font-semibold'>
                        <HighlightedText text={article.title} query={query} />
                      </h3>
                      <p className='text-muted-foreground line-clamp-2 text-xs leading-relaxed'>
                        <HighlightedText text={article.excerpt} query={query} />
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      )}

      <VideoLightbox
        video={playing}
        onClose={closeVideo}
        related={visibleVideos}
        onSelect={(v) => setPlaying(v)}
        origin={playOrigin}
        getArticleHref={(video) => {
          const article = (articles ?? []).find((a) => a.topic === video.topic)
          return article ? `#${video.topic}` : undefined
        }}
      />
    </div>
  )
}
