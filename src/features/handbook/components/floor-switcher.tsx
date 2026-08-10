'use client'

import { cn } from '@/shared/lib/utils'
import type { HandbookFloor, HandbookTemplate } from '../types/handbook.types'
import { TemplateFigure } from './template-figure'

interface FloorSwitcherProps {
  template: HandbookTemplate
  activeId: string
  onChange: (floorId: string) => void
  /** Hiện dải ảnh xem trước dưới nhóm nút (trang chi tiết — Hình 7, Hình 8). */
  showThumbnails?: boolean
  className?: string
}

/**
 * Nhóm nút chuyển tầng + dải ảnh xem trước.
 *
 * Dùng chung cho popup xem nhanh (Hình 2) và trang chi tiết mẫu; popup chỉ bật
 * nhóm nút, trang chi tiết bật thêm dải ảnh.
 */
export function FloorSwitcher({ template, activeId, onChange, showThumbnails, className }: FloorSwitcherProps) {
  const { floors } = template

  return (
    <div className={cn('space-y-3', className)}>
      <div className='bg-muted/60 inline-flex flex-wrap gap-1 rounded-lg p-1'>
        {floors.map((floor) => (
          <button
            key={floor.id}
            type='button'
            onClick={() => onChange(floor.id)}
            aria-pressed={floor.id === activeId}
            className={cn(
              'rounded-md px-4 py-1.5 text-sm font-medium transition-colors',
              floor.id === activeId
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {floor.label}
          </button>
        ))}
      </div>

      {showThumbnails ? (
        <ul className='grid grid-cols-2 gap-3 sm:grid-cols-4'>
          {floors.map((floor) => (
            <li key={floor.id}>
              <button
                type='button'
                onClick={() => onChange(floor.id)}
                aria-pressed={floor.id === activeId}
                className={cn(
                  'block w-full overflow-hidden rounded-lg border-2 transition-colors',
                  floor.id === activeId ? 'border-primary' : 'border-transparent hover:border-border'
                )}
              >
                <TemplateFigure
                  template={template}
                  floor={floor}
                  // Bản vẽ nhà phố nằm ngang; để 4:3 thì thumbnail cao gấp đôi
                  // mockup và đẩy cả cột trái dài ra (Hình 7, Hình 8).
                  className={cn('w-full', template.kind === '3d' && 'aspect-16/9')}
                  autoHeight={template.kind === '2d'}
                  sizes='200px'
                />
                <span className='block py-1.5 text-center text-xs font-medium'>{floor.label}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

/** Tầng đang chọn, có fallback về tầng đầu tiên khi id không còn hợp lệ. */
export function resolveFloor(template: HandbookTemplate, floorId: string): HandbookFloor | undefined {
  return template.floors.find((floor) => floor.id === floorId) ?? template.floors[0]
}
