import { ROUTES } from '@/shared/constants/routes'

/**
 * Cột 3 "Liên kết nhanh" và cột 4 "Chính sách" của footer (mục II.2).
 *
 * `href: null` = màn hình chưa dựng (hiện chỉ còn Chính sách thanh toán).
 * Mục đó vẫn hiện trong footer nhưng làm mờ và không
 * bấm được, để footer phản ánh đúng cấu trúc Bên A duyệt mà không tạo link
 * chết. Khi màn hình tương ứng lên route, chỉ cần thay `null` bằng route đó.
 */
/** Khoá dịch dưới namespace `footer.links`. */
export type FooterLinkKey = 'design' | 'handbook' | 'guide' | 'plans' | 'consult' | 'privacy' | 'terms' | 'payment'

export interface FooterLink {
  labelKey: FooterLinkKey
  href: string | null
}

/** Cột 3 — Liên kết nhanh. Thứ tự theo mục II.2. */
export const FOOTER_QUICK_LINKS: readonly FooterLink[] = [
  { labelKey: 'design', href: ROUTES.DESIGN },
  { labelKey: 'handbook', href: ROUTES.HANDBOOK },
  { labelKey: 'guide', href: ROUTES.GUIDE },
  { labelKey: 'plans', href: ROUTES.PLANS },
  { labelKey: 'consult', href: ROUTES.CONSULT }
] as const

/** Cột 4 — Chính sách. "Chính sách thanh toán" chưa có trang. */
export const FOOTER_POLICY_LINKS: readonly FooterLink[] = [
  { labelKey: 'privacy', href: ROUTES.PRIVACY },
  { labelKey: 'terms', href: ROUTES.TERMS },
  { labelKey: 'payment', href: null }
] as const
