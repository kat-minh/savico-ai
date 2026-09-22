import { ROUTES } from '@/shared/constants/routes'

/**
 * Ba cot lien ket cua footer (San pham - Ho tro - Ve SAVICO).
 *
 * `href: null` = man hinh chua dung (Thi cong tron goi la hop thoai chu khong
 * phai trang; Cau hoi thuong gap va Gioi thieu chua co route). Muc do van hien
 * nhung lam mo va khong bam duoc, de footer phan anh dung cau truc khach duyet
 * ma khong tao link chet. Co route roi thi thay `null` bang route do.
 */

/** Khoa dich duoi namespace `footer.links`. */
export type FooterLinkKey =
  | 'design'
  | 'services'
  | 'contractors'
  | 'supervision'
  | 'turnkey'
  | 'guide'
  | 'handbook'
  | 'consult'
  | 'faq'
  | 'about'
  | 'privacy'
  | 'terms'

export interface FooterLink {
  labelKey: FooterLinkKey
  href: string | null
}

/** Cot "San pham". */
export const FOOTER_PRODUCT_LINKS: readonly FooterLink[] = [
  { labelKey: 'design', href: ROUTES.DESIGN },
  { labelKey: 'services', href: ROUTES.PLANS },
  { labelKey: 'contractors', href: ROUTES.CONTRACTORS },
  { labelKey: 'supervision', href: ROUTES.PLANS_SUPERVISION },
  { labelKey: 'turnkey', href: null }
] as const

/** Cot "Ho tro". */
export const FOOTER_SUPPORT_LINKS: readonly FooterLink[] = [
  { labelKey: 'guide', href: ROUTES.GUIDE },
  { labelKey: 'handbook', href: ROUTES.HANDBOOK },
  { labelKey: 'consult', href: ROUTES.CONSULT },
  { labelKey: 'faq', href: null }
] as const

/** Cot "Ve SAVICO". */
export const FOOTER_ABOUT_LINKS: readonly FooterLink[] = [
  { labelKey: 'about', href: null },
  { labelKey: 'privacy', href: ROUTES.PRIVACY },
  { labelKey: 'terms', href: ROUTES.TERMS }
] as const
