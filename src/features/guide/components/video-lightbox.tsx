'use client'

import { Clapperboard } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Photo } from '@/shared/components/common'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'
import type { GuideVideo } from '../types/guide.types'
import { formatDuration } from './video-card'

interface VideoLightboxProps {
  /** Video đang mở; `null` là đóng. */
  video: GuideVideo | null
  onClose: () => void
}

/**
 * Trình phát phóng to mở ngay trên trang Hướng dẫn (★ mục VI): bấm thẻ video là
 * mở lightbox chứ KHÔNG điều hướng sang trang khác.
 */
export function VideoLightbox({ video, onClose }: VideoLightboxProps) {
  const t = useTranslations('guide')

  return (
    <Dialog open={Boolean(video)} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className='sm:max-w-3xl'>
        <DialogHeader>
          <DialogTitle>{video?.title}</DialogTitle>
          <DialogDescription>
            {video ? `${video.description} · ${formatDuration(video.durationSeconds)}` : null}
          </DialogDescription>
        </DialogHeader>

        <div className='bg-muted relative aspect-video w-full overflow-hidden rounded-xl'>
          {video?.videoUrl ? (
            <video src={video.videoUrl} controls autoPlay className='size-full object-contain' />
          ) : video ? (
            <>
              {/* Chưa có file video thật (admin sẽ upload — mục X, #3): hiện ảnh
                  bìa mờ kèm ghi chú, thay vì một khung phát trống báo lỗi. */}
              <Photo className='size-full opacity-40' src={video.thumbnailUrl} alt={video.title} sizes='768px' />
              <div className='text-muted-foreground absolute inset-0 flex flex-col items-center justify-center gap-2 text-center'>
                <Clapperboard className='size-8' />
                <p className='text-sm font-medium'>{t('videoComingSoon')}</p>
              </div>
            </>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  )
}
