import { Play } from 'lucide-react'
import type { ComponentProps } from 'react'

import { Photo } from '@/shared/components/common'
import { cn } from '@/shared/lib/utils'
import type { GuideVideo } from '../types/guide.types'

/** Format seconds as m:ss — durations here are always under a minute or two. */
function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

interface VideoCardProps extends Omit<ComponentProps<'article'>, 'children'> {
  video: GuideVideo
  /** Tên bước mà video thuộc về — thẻ tự mang nhãn nên lưới không cần tách nhóm. */
  topicLabel?: string
}

/** Thẻ video hướng dẫn: ảnh bìa, thời lượng, tiêu đề, mô tả 1 dòng (mục II.2). */
export function VideoCard({ video, className, topicLabel, ...props }: VideoCardProps) {
  return (
    <article
      {...props}
      className={cn(
        'group bg-card hover:border-primary/40 flex flex-col overflow-hidden rounded-xl border transition-colors',
        className
      )}
    >
      <div className='relative'>
        <Photo className='aspect-video w-full' src={video.thumbnailUrl} alt={video.title} />
        <span className='bg-background/85 absolute inset-0 m-auto flex size-12 items-center justify-center rounded-full backdrop-blur transition-transform group-hover:scale-110'>
          <Play className='fill-foreground size-5' />
        </span>
        <span className='bg-foreground/80 text-background absolute right-2 bottom-2 rounded px-1.5 py-0.5 text-xs font-medium tabular-nums'>
          {formatDuration(video.durationSeconds)}
        </span>
      </div>
      <div className='flex flex-1 flex-col gap-1 p-4'>
        {topicLabel ? (
          <p className='text-primary text-[0.7rem] font-semibold tracking-wide uppercase'>{topicLabel}</p>
        ) : null}
        <h3 className='text-sm font-semibold'>{video.title}</h3>
        <p className='text-muted-foreground line-clamp-2 text-xs leading-relaxed'>{video.description}</p>
      </div>
    </article>
  )
}
