import { ROUTES } from '@/shared/constants/routes'

/** Translation key under the `nav` namespace. */
export type NavLabelKey = 'design' | 'handbook' | 'guide'

export interface SiteNavItem {
  labelKey: NavLabelKey
  href: string
}

/**
 * Thanh công cụ — mục II.1 của bản mô tả giao diện.
 * Thứ tự cố định: Home (logo) → Thiết kế & Dự toán → Cẩm nang → Hướng dẫn.
 * Logo giữ vai trò mục Home nên không nằm trong mảng này.
 */
export const SITE_NAV: readonly SiteNavItem[] = [
  { labelKey: 'design', href: ROUTES.DESIGN },
  { labelKey: 'handbook', href: ROUTES.HANDBOOK },
  { labelKey: 'guide', href: ROUTES.GUIDE }
] as const
