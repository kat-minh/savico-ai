import { Play } from 'lucide-react'
import type { ComponentProps } from 'react'

import { Photo } from '@/shared/components/common'
import { cn } from '@/shared/lib/utils'
import type { GuideVideo } from '../types/guide.types'

/** Format seconds as m:ss — durations here are always under a minute or two. */
export function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

interface VideoCardProps extends Omit<ComponentProps<'article'>, 'children' | 'onClick'> {
  video: GuideVideo
  /** Tên bước mà video thuộc về — thẻ tự mang nhãn nên lưới không cần tách nhóm. */
  topicLabel?: string
  /** Số thứ tự hiển thị trước tiêu đề (vd 1 → "1."). */
  index?: number
  /** 'row' = ảnh trái, chữ phải (khu trang chủ); 'stacked' = ảnh trên (trang Hướng dẫn). */
  layout?: 'stacked' | 'row'
  /** Ẩn dòng mô tả — trang Hướng dẫn chỉ hiện tiêu đề đánh số (Hình 12). */
  hideDescription?: boolean
  /** Bấm thẻ mở trình phát phóng to ngay trên trang (mục VI). */
  onOpenVideo?: (video: GuideVideo) => void
}

/**
 * Thẻ video hướng dẫn (mục VI, Hình 12): ảnh bìa, nút play tròn trắng ở giữa,
 * nhãn thời lượng góc phải dưới ảnh, tiêu đề đánh số kèm thời lượng.
 */
export function VideoCard({
  video,
  className,
  topicLabel,
  index,
  layout = 'stacked',
  hideDescription = false,
  onOpenVideo,
  ...props
}: VideoCardProps) {
  const row = layout === 'row'
  const duration = formatDuration(video.durationSeconds)
  const interactive = Boolean(onOpenVideo)

  return (
    <article
      {...props}
      {...(interactive
        ? {
            role: 'button',
            tabIndex: 0,
            onClick: () => onOpenVideo?.(video),
            onKeyDown: (event: React.KeyboardEvent) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                onOpenVideo?.(video)
              }
            }
          }
        : {})}
      className={cn(
        'group bg-card hover:border-primary/40 overflow-hidden rounded-xl border transition-colors',
        row ? 'flex items-stretch' : 'flex flex-col',
        interactive && 'focus-visible:ring-ring cursor-pointer focus-visible:ring-2 focus-visible:outline-none',
        className
      )}
    >
      <div className={cn('relative shrink-0', row ? 'min-h-[8.5rem] w-[42%]' : '')}>
        <Photo
          className={cn('size-full', row ? '' : 'aspect-video w-full')}
          src={video.thumbnailUrl}
          alt={video.title}
        />
        {/* Hình 12: nút play NỀN TRẮNG, tam giác xanh — nổi rõ trên mọi ảnh bìa. */}
        <span className='bg-background text-primary absolute inset-0 m-auto flex size-12 items-center justify-center rounded-full shadow-lg transition-transform group-hover:scale-110'>
          <Play className='size-5 translate-x-0.5 fill-current' />
        </span>
        {/* Hình 12: nhãn thời lượng nền TỐI chữ trắng, góc phải dưới ảnh. */}
        <span className='bg-foreground/85 text-background absolute right-2 bottom-2 rounded px-1.5 py-0.5 text-xs font-semibold tabular-nums'>
          {duration}
        </span>
      </div>

      <div className={cn('flex flex-1 flex-col gap-1 p-4', row && 'justify-center')}>
        {topicLabel ? (
          <p className='text-primary text-[0.7rem] font-semibold tracking-wide uppercase'>{topicLabel}</p>
        ) : null}
        <h3 className='text-sm font-semibold'>
          {index != null ? <span>{index}. </span> : null}
          {video.title}
          {hideDescription ? <span className='text-muted-foreground font-normal'> ({duration})</span> : null}
        </h3>
        {hideDescription ? null : (
          <p className='text-muted-foreground line-clamp-2 text-xs leading-relaxed'>{video.description}</p>
        )}
      </div>
    </article>
  )
}
