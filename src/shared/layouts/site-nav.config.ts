import { ROUTES } from '@/shared/constants/routes'

/** Translation key under the `nav` namespace. */
export type NavLabelKey = 'design' | 'handbook' | 'guide' | 'plans' | 'consult'

export interface SiteNavItem {
  labelKey: NavLabelKey
  href: string
}

/**
 * Thanh công cụ — mục II.1 của bản mô tả giao diện.
 * Thứ tự cố định: Home (logo) → Thiết kế & Dự toán → Cẩm nang → Hướng dẫn →
 * Gói đăng ký → Tư vấn 1:1. Logo giữ vai trò mục Home nên không nằm trong mảng này.
 */
export const SITE_NAV: readonly SiteNavItem[] = [
  { labelKey: 'design', href: ROUTES.DESIGN },
  { labelKey: 'handbook', href: ROUTES.HANDBOOK },
  { labelKey: 'guide', href: ROUTES.GUIDE },
  { labelKey: 'plans', href: ROUTES.PLANS },
  { labelKey: 'consult', href: ROUTES.CONSULT }
] as const
