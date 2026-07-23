'use client'

import { AmbientAura } from '@/shared/components/common'
import { useHomeBackdropStore } from './home-backdrop.store'

/**
 * Nền trang chủ: quầng động (mặc định) hoặc ẩn đi để lộ nền trơn `bg-background`
 * như bản client. Bật/tắt bằng nút switch cạnh CTA hero (xem `home-hero-section`).
 */
export function HomeBackdrop() {
  const plain = useHomeBackdropStore((s) => s.plain)
  if (plain) return null
  return <AmbientAura className='fixed' />
}
