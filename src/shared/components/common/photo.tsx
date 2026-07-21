import Image from 'next/image'

import { cn } from '@/shared/lib/utils'

interface PhotoProps {
  /** Local path under `/public` or a remote URL allowed in `next.config.ts`. */
  src: string
  alt: string
  className?: string
  /** Responsive size hint passed to next/image. */
  sizes?: string
  /** Render above the fold (hero) — skips lazy loading. */
  priority?: boolean
}

/**
 * A real photo filling its container.
 *
 * Replaces the old blueprint-grid placeholder: every call site now points at an
 * image chosen to match its subject (see `shared/lib/imagery.ts`). The wrapper
 * owns the aspect ratio; the image covers it.
 */
export function Photo({ src, alt, className, sizes = '(max-width: 768px) 100vw, 400px', priority }: PhotoProps) {
  return (
    <div className={cn('bg-muted relative overflow-hidden', className)}>
      <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className='object-cover' />
    </div>
  )
}
