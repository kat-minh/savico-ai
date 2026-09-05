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
  /**
   * Màn hình chờ (mục IV.4 Hình 07, IV.7 Hình 10): panel cẩm nang chiếm cột
   * TRÁI rộng, cột tiến độ AI hẹp bên phải. Màn kết quả thì ngược lại — nội
   * dung chính rộng bên trái.
   */
  waiting?: boolean
}

/**
 * Bố cục chung của Bước 2 và Bước 3 (mục III.3a, III.4b).
 *
 * Panel cẩm nang là thành phần cố định của cả hai bước, KHÔNG biến mất khi AI
 * sinh xong: theo spec người dùng chủ động thu nhỏ nó để đọc dự toán. Vì vậy
 * màn chờ và màn kết quả dùng chung một khung, chỉ đổi nội dung cột trái.
 */
export function DesignStepLayout({
  children,
  sidePanel,
  sidePanelCollapsed = false,
  waiting = false
}: DesignStepLayoutProps) {
  const twoColumn = Boolean(sidePanel) && !sidePanelCollapsed

  // Cột ngắn hơn là cột dính: màn chờ thì cột tiến độ dính để luôn thấy % khi
  // cuộn danh sách cẩm nang; màn kết quả thì ngược lại.
  const main = (
    <div
      className={cn(
        'min-w-0',
        waiting && twoColumn && 'lg:sticky lg:top-40 lg:self-start',
        // Khi panel cẩm nang thu nhỏ, cột nội dung phải TRẢI HẾT khung chung.
        // Bó lại `max-w-4xl` rồi canh giữa làm mép thẻ nội dung thụt vào so với
        // thanh tiến trình ngay phía trên, nhìn như bị lệch.
        !twoColumn && 'w-full'
      )}
    >
      {children}
    </div>
  )
  // Khi thu nhỏ, panel tự render thành nút nổi nên vẫn phải được mount.
  const aside = twoColumn ? (
    <div className={cn(!waiting && 'lg:sticky lg:top-40 lg:self-start')}>{sidePanel}</div>
  ) : (
    sidePanel
  )

  return (
    <div
      className={cn(
        'mx-auto grid w-full max-w-6xl gap-6 px-4 py-6 lg:px-8',
        twoColumn && (waiting ? 'lg:grid-cols-[minmax(0,1fr)_22rem]' : 'lg:grid-cols-[minmax(0,1fr)_360px]')
      )}
    >
      {/* Màn chờ: cẩm nang trước (cột trái rộng), tiến độ sau (cột phải hẹp). */}
      {waiting ? (
        <>
          {aside}
          {main}
        </>
      ) : (
        <>
          {main}
          {aside}
        </>
      )}
    </div>
  )
}
