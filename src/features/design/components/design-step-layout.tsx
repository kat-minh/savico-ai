'use client'

import type { ReactNode } from 'react'

import { cn } from '@/shared/lib/utils'

interface DesignStepLayoutProps {
  /** Nội dung chính: tiến độ AI khi đang chờ, kết quả khi đã sinh xong. */
  children: ReactNode
  /**
   * Bảng "Cẩm nang cá nhân hóa" ở cột phải. `features/design` không import
   * `features/handbook`, nên lớp app truyền vào.
   */
  sidePanel?: ReactNode
  /**
   * Panel đang thu nhỏ thành nút nổi — cột phải biến mất và nội dung chính co
   * lại về bề rộng dễ đọc thay vì kéo dài hết khung.
   */
  sidePanelCollapsed?: boolean
}

/**
 * Bố cục chung của Bước 2 và Bước 3 (mục III.3a, III.4b).
 *
 * Panel cẩm nang là thành phần cố định của cả hai bước, KHÔNG biến mất khi AI
 * sinh xong: theo spec người dùng chủ động thu nhỏ nó để đọc dự toán. Vì vậy
 * màn chờ và màn kết quả dùng chung một khung, chỉ đổi nội dung cột trái.
 */
export function DesignStepLayout({ children, sidePanel, sidePanelCollapsed = false }: DesignStepLayoutProps) {
  const twoColumn = Boolean(sidePanel) && !sidePanelCollapsed

  return (
    <div
      className={cn(
        'mx-auto grid w-full max-w-6xl gap-8 px-4 py-8 lg:px-8',
        twoColumn && 'lg:grid-cols-[minmax(0,1fr)_360px]'
      )}
    >
      <div className={cn('min-w-0', !twoColumn && 'mx-auto w-full max-w-4xl')}>{children}</div>
      {/* Khi thu nhỏ, panel tự render thành nút nổi nên vẫn phải được mount. */}
      {twoColumn ? <div className='lg:sticky lg:top-40 lg:self-start'>{sidePanel}</div> : sidePanel}
    </div>
  )
}
