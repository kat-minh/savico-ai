import { Photo, PlanDrawing } from '@/shared/components/common'
import { cn } from '@/shared/lib/utils'
import type { HandbookFloor, HandbookTemplate } from '../types/handbook.types'

interface TemplateFigureProps {
  template: HandbookTemplate
  /** Tầng cần vẽ. Bỏ trống thì lấy ảnh bìa (hoặc tầng đầu tiên). */
  floor?: HandbookFloor
  className?: string
  sizes?: string
  priority?: boolean
  /** Đóng dấu bản quyền SAVICO — bật ở ảnh lớn, tắt ở thumbnail. */
  watermark?: boolean
}

/**
 * Khung hình của một mẫu.
 *
 * Mẫu 3D luôn có ảnh phối cảnh thật. Mẫu 2D chưa có file bản vẽ nên dựng bằng
 * SVG (`PlanDrawing`) theo `planVariant` của tầng — cùng một component sẽ hiển
 * thị ảnh thật ngay khi admin tải bản vẽ lên, không phải sửa nơi gọi.
 */
export function TemplateFigure({ template, floor, className, sizes, priority, watermark }: TemplateFigureProps) {
  const target = floor ?? template.floors[0]
  const src = floor?.imageUrl ?? (floor ? undefined : template.imageUrl) ?? target?.imageUrl

  if (src) {
    // Ảnh phối cảnh cũng đóng dấu bản quyền như bản vẽ (Hình 8) — chỉ khác là
    // dấu nằm đè lên ảnh nên phải có bóng chữ mới đọc được trên nền sáng.
    if (!watermark) {
      return <Photo className={className} src={src} alt={template.name} sizes={sizes} priority={priority} />
    }
    return (
      <div className={cn('relative', className)}>
        <Photo className='size-full' src={src} alt={template.name} sizes={sizes} priority={priority} />
        <span
          aria-hidden
          className='absolute right-3 bottom-2 text-lg font-bold tracking-widest text-white/70 drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)]'
        >
          SAVICO
        </span>
      </div>
    )
  }

  const lot = parseLot(template.specs.lotSize)

  return (
    <PlanDrawing
      className={className}
      variant={target?.planVariant ?? 'ground'}
      // Bản vẽ đặt chiều sâu lô nằm ngang, mặt tiền nằm dọc — đúng như bản vẽ
      // nhà phố thật, nên tỷ lệ khung là sâu/ngang.
      ratio={lot ? lot.depth / lot.frontage : undefined}
      dimensions={lot ? { width: toMillimetres(lot.depth), depth: toMillimetres(lot.frontage) } : undefined}
      watermark={watermark}
      seed={`${template.id}-${target?.id ?? ''}`}
    />
  )
}

/** Tách "5 × 20 m" của CMS thành số mét: mặt tiền và chiều sâu lô. */
function parseLot(lotSize: string | undefined): { frontage: number; depth: number } | undefined {
  if (!lotSize) return undefined

  const [frontage, depth] = lotSize
    .replace(/m/gi, '')
    .split('×')
    .map((part) => Number(part.trim().replace(',', '.')))

  if (!frontage || !depth) return undefined
  return { frontage, depth }
}

/** 5 → "5 000"; dấu cách nghìn theo quy ước ghi kích thước trên bản vẽ. */
function toMillimetres(metres: number): string {
  return String(Math.round(metres * 1000)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}
