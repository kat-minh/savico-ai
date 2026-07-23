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
  /** Số thứ tự hiển thị trước tiêu đề (vd 1 → "01."), dùng ở khu trang chủ. */
  index?: number
  /** 'row' = ảnh trái, chữ phải (khu trang chủ); 'stacked' = ảnh trên (trang Hướng dẫn). */
  layout?: 'stacked' | 'row'
}

/** Thẻ video hướng dẫn: ảnh bìa, thời lượng, tiêu đề, mô tả 1 dòng (mục II.2). */
export function VideoCard({ video, className, topicLabel, index, layout = 'stacked', ...props }: VideoCardProps) {
  const row = layout === 'row'
  return (
    <article
      {...props}
      className={cn(
        'group bg-card hover:border-primary/40 overflow-hidden rounded-xl border transition-colors',
        row ? 'flex items-stretch' : 'flex flex-col',
        className
      )}
    >
      <div className={cn('relative shrink-0', row ? 'w-[42%] min-h-[8.5rem]' : '')}>
        <Photo
          className={cn('size-full', row ? '' : 'aspect-video w-full')}
          src={video.thumbnailUrl}
          alt={video.title}
        />
        <span className='brand-gradient text-primary-foreground absolute inset-0 m-auto flex size-11 items-center justify-center rounded-full shadow-md transition-transform group-hover:scale-110'>
          <Play className='size-4.5 translate-x-0.5 fill-current' />
        </span>
        <span className='bg-foreground/80 text-background absolute bottom-2 left-2 rounded px-1.5 py-0.5 text-xs font-medium tabular-nums'>
          {formatDuration(video.durationSeconds)}
        </span>
      </div>
      <div className={cn('flex flex-1 flex-col gap-1 p-4', row && 'justify-center')}>
        {topicLabel ? (
          <p className='text-primary text-[0.7rem] font-semibold tracking-wide uppercase'>{topicLabel}</p>
        ) : null}
        <h3 className='text-sm font-semibold'>
          {index != null ? <span className='text-primary'>{String(index).padStart(2, '0')}. </span> : null}
          {video.title}
        </h3>
        <p className='text-muted-foreground line-clamp-2 text-xs leading-relaxed'>{video.description}</p>
      </div>
    </article>
  )
}
