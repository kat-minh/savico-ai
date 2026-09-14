'use client'

import * as DialogPrimitive from '@radix-ui/react-dialog'
import { Bell, BellRing, ChevronLeft, ChevronRight, Clapperboard, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

import { Photo, revealEase } from '@/shared/components/common'
import { Button } from '@/shared/components/ui/button'
import { useMediaQuery } from '@/shared/hooks'
import { cn } from '@/shared/lib/utils'
import type { GuideVideo } from '../types/guide.types'
import type { VideoCardOrigin } from './video-card'
import { VideoPlayer } from './video-player'

interface VideoLightboxProps {
  /** Video đang mở; `null` là đóng. */
  video: GuideVideo | null
  onClose: () => void
  /** Hàng đợi để chuyển qua lại (mũi tên, gợi ý xem tiếp) — thiếu thì chỉ có mỗi video đang mở. */
  related?: readonly GuideVideo[]
  /** Chuyển sang xem một video khác trong `related` ngay trong hộp đang mở. */
  onSelect?: (video: GuideVideo) => void
  /** "Tạo dự án ngay" sau khi xem xong — lớp app nối tới `features/design`. */
  onCreateProject?: () => void
  /** Rect của thẻ vừa bấm — hộp "bung" ra đúng từ đó (mục 7). */
  origin?: VideoCardOrigin | null
  /** Bài hướng dẫn thay thế khi video còn đang biên tập, nếu có. */
  getArticleHref?: (video: GuideVideo) => string | undefined
}

/**
 * Popup xem video "bung" ra ngay trên trang (mục VI, mục 7 ảnh 2) — KHÔNG
 * điều hướng sang trang khác.
 *
 * ★ Dựng thẳng trên `@radix-ui/react-dialog` (như modal đặt lịch tư vấn) để tự
 * vẽ animation "bung từ đúng vị trí + kích thước thẻ vừa bấm" — hộp thoại
 * dùng chung không làm được việc đó. Nội dung (tiêu đề, mô tả, nút đóng) hiện
 * TRƯỚC khung video một nhịp. Đóng thì thu lại y hệt, hơi lệch về phía thẻ.
 */
export function VideoLightbox({
  video,
  onClose,
  related = [],
  onSelect,
  onCreateProject,
  origin,
  getArticleHref
}: VideoLightboxProps) {
  const t = useTranslations('guide.lightbox')
  const isMobile = useMediaQuery('(max-width: 639px)')

  const queue = related.length > 0 ? related : video ? [video] : []
  const currentIndex = video ? queue.findIndex((item) => item.id === video.id) : -1
  const prevVideo = currentIndex > 0 ? queue[currentIndex - 1] : null
  const nextVideo = currentIndex >= 0 && currentIndex < queue.length - 1 ? queue[currentIndex + 1] : null

  const [direction, setDirection] = useState(1)

  function goTo(target: GuideVideo | null | undefined, dir: number) {
    if (!target) return
    setDirection(dir)
    onSelect?.(target)
  }

  const editing = video ? !video.videoUrl : false
  const articleHref = video ? getArticleHref?.(video) : undefined

  const dx = origin?.dx ?? 0
  const dy = origin?.dy ?? 0
  const initialScale = origin ? 0.2 : 0.94

  return (
    <DialogPrimitive.Root open={Boolean(video)} onOpenChange={(next) => !next && onClose()}>
      <DialogPrimitive.Portal forceMount>
        <AnimatePresence>
          {video ? (
            <>
              <DialogPrimitive.Overlay asChild forceMount>
                <motion.div
                  className='fixed inset-0 z-50 bg-black/60 backdrop-blur-sm'
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, transition: { duration: 0.25 } }}
                  exit={{ opacity: 0, transition: { duration: 0.15 } }}
                />
              </DialogPrimitive.Overlay>

              <DialogPrimitive.Content asChild forceMount>
                <div
                  className={cn(
                    'fixed inset-0 z-50 flex',
                    isMobile ? 'items-end justify-center' : 'items-center justify-center p-4'
                  )}
                  onClick={(event) => {
                    if (event.target === event.currentTarget) onClose()
                  }}
                >
                  <motion.div
                    drag={isMobile ? 'y' : false}
                    dragConstraints={{ top: 0, bottom: 0 }}
                    dragElastic={{ top: 0, bottom: 0.4 }}
                    onDragEnd={(_, info) => {
                      if (info.offset.y > 120) onClose()
                    }}
                    className={cn(
                      'bg-background relative overflow-hidden shadow-2xl',
                      isMobile ? 'max-h-[92vh] w-full rounded-t-2xl' : 'w-full max-w-3xl rounded-2xl p-5'
                    )}
                    initial={{
                      x: dx,
                      y: isMobile ? '100%' : dy,
                      scale: isMobile ? 1 : initialScale,
                      opacity: isMobile ? 1 : 0
                    }}
                    animate={{ x: 0, y: 0, scale: 1, opacity: 1 }}
                    exit={{
                      x: isMobile ? 0 : dx,
                      y: isMobile ? '100%' : dy,
                      scale: isMobile ? 1 : initialScale * 1.05,
                      opacity: isMobile ? 1 : 0,
                      transition: { duration: 0.2, ease: 'easeIn' }
                    }}
                    transition={
                      isMobile
                        ? { type: 'spring', stiffness: 340, damping: 34 }
                        : { type: 'spring', stiffness: 280, damping: 24, mass: 0.7 }
                    }
                  >
                    {isMobile ? (
                      <div aria-hidden className='flex justify-center py-2'>
                        <span className='bg-muted-foreground/40 h-1 w-10 rounded-full' />
                      </div>
                    ) : null}

                    <div className={isMobile ? 'flex max-h-[calc(92vh-1rem)] flex-col overflow-y-auto p-4 pt-0' : ''}>
                      <div className='mb-3 flex items-start justify-between gap-3'>
                        <div className='min-w-0 space-y-1'>
                          <DialogPrimitive.Title className='truncate text-lg leading-tight font-semibold'>
                            {video.title}
                          </DialogPrimitive.Title>
                          <DialogPrimitive.Description className='text-muted-foreground line-clamp-2 text-sm'>
                            {video.description}
                          </DialogPrimitive.Description>
                        </div>
                        <DialogPrimitive.Close asChild>
                          <button
                            type='button'
                            aria-label={t('close')}
                            className='text-muted-foreground hover:bg-muted flex size-8 shrink-0 items-center justify-center rounded-full transition-colors'
                          >
                            <motion.span whileHover={{ rotate: 90 }} transition={{ duration: 0.2 }} className='flex'>
                              <X className='size-4' />
                            </motion.span>
                          </button>
                        </DialogPrimitive.Close>
                      </div>

                      <AnimatePresence mode='wait' initial={false}>
                        <motion.div
                          key={video.id}
                          initial={{ opacity: 0, x: direction * 32 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: direction * -32, transition: { duration: 0.15 } }}
                          transition={{ duration: 0.25, ease: revealEase }}
                          className='relative'
                        >
                          {editing ? (
                            <EditingCover video={video} articleHref={articleHref} />
                          ) : (
                            <VideoPlayer
                              key={video.id}
                              video={video}
                              nextVideo={nextVideo}
                              onAdvance={(next) => goTo(next, 1)}
                              onReplay={() => onSelect?.(video)}
                              onCreateProject={onCreateProject}
                            />
                          )}

                          {/* Mũi tên trước/sau ở mép ngoài hộp — mờ nghỉ, rõ khi rê. */}
                          {prevVideo ? (
                            <button
                              type='button'
                              aria-label={t('prevVideo')}
                              onClick={() => goTo(prevVideo, -1)}
                              className='bg-background/90 absolute top-1/2 -left-3 flex size-9 -translate-x-full -translate-y-1/2 items-center justify-center rounded-full opacity-40 shadow transition-opacity hover:opacity-100 max-md:hidden'
                            >
                              <ChevronLeft className='size-5' />
                            </button>
                          ) : null}
                          {nextVideo ? (
                            <button
                              type='button'
                              aria-label={t('nextVideo')}
                              onClick={() => goTo(nextVideo, 1)}
                              className='bg-background/90 absolute top-1/2 -right-3 flex size-9 -translate-y-1/2 translate-x-full items-center justify-center rounded-full opacity-40 shadow transition-opacity hover:opacity-100 max-md:hidden'
                            >
                              <ChevronRight className='size-5' />
                            </button>
                          ) : null}
                        </motion.div>
                      </AnimatePresence>
                    </div>
                  </motion.div>
                </div>
              </DialogPrimitive.Content>
            </>
          ) : null}
        </AnimatePresence>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

/**
 * Video còn đang biên tập (mục 7): ảnh bìa phủ tối + trôi rất nhẹ, biểu tượng
 * clapper mờ vào rồi "đóng nắp" một lần, không thanh điều khiển, không tự
 * phát. "Nhận thông báo" đổi thành ✓ nảy nhẹ một lần sau khi bấm.
 */
function EditingCover({ video, articleHref }: { video: GuideVideo; articleHref?: string }) {
  const t = useTranslations('guide.lightbox')
  const [notifyRequested, setNotifyRequested] = useState(false)

  return (
    <div className='bg-muted relative aspect-video w-full overflow-hidden rounded-xl'>
      <motion.div
        aria-hidden
        animate={{ scale: [1, 1.04, 1], x: [0, 4, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        className='absolute inset-0'
      >
        <Photo className='size-full opacity-70' src={video.thumbnailUrl} alt={video.title} sizes='768px' />
      </motion.div>
      <div className='bg-foreground/55 absolute inset-0' />

      <div className='text-background absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center'>
        <motion.span
          initial={{ opacity: 0, scaleY: 1 }}
          animate={{ opacity: 1, scaleY: [1, 1, 0.2, 1] }}
          transition={{ opacity: { duration: 0.3 }, scaleY: { duration: 0.5, delay: 0.4, times: [0, 0.6, 0.8, 1] } }}
          className='origin-bottom'
        >
          <Clapperboard className='size-9' />
        </motion.span>
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.4 }}
          className='text-sm font-medium'
        >
          {video.title}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.4 }}
          className='flex flex-col items-center gap-2'
        >
          <Button
            size='sm'
            variant={notifyRequested ? 'secondary' : 'default'}
            disabled={notifyRequested}
            onClick={() => setNotifyRequested(true)}
            className='rounded-full'
          >
            {notifyRequested ? (
              <motion.span
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', bounce: 0.6, duration: 0.4 }}
                className='flex items-center gap-1.5'
              >
                <BellRing className='size-4' />
                {t('notifyMeConfirmed')}
              </motion.span>
            ) : (
              <span className='flex items-center gap-1.5'>
                <Bell className='size-4' />
                {t('notifyMe')}
              </span>
            )}
          </Button>
          {articleHref ? (
            <a href={articleHref} className='text-background/90 text-xs font-medium underline underline-offset-2'>
              {t('readArticleInstead')} →
            </a>
          ) : null}
        </motion.div>
      </div>
    </div>
  )
}
