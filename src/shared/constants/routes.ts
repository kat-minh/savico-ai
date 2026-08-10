/**
 * Centralized, type-safe route map (locale-agnostic).
 *
 * next-intl's `Link`/`useRouter` add the locale prefix automatically, so
 * paths here are written WITHOUT a leading locale segment.
 *
 * Screen numbering in the comments matches "Mô tả giao diện web SAVICO AI",
 * mục V — Danh mục màn hình.
 */
export const ROUTES = {
  // Public site (screens 1–3)
  HOME: '/', // 1. Trang chủ
  HANDBOOK: '/handbook', // 2. Cẩm nang
  GUIDE: '/guide', // 3. Hướng dẫn
  PLANS: '/plans', // Gói đăng ký (mục VII)
  TERMS: '/terms',
  PRIVACY: '/privacy',

  // Auth
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',

  // Thiết kế & Dự toán — luồng 3 bước (screens 4–10)
  DESIGN: '/design',

  // Account (screen 11)
  ACCOUNT: '/account'
} as const

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES]

/** Trang chi tiết một mẫu trong thư viện Cẩm nang (mẫu bản vẽ 2D / nội thất 3D). */
export const handbookTemplateRoute = (id: string) => `${ROUTES.HANDBOOK}/mau/${id}`

/** Trang bài viết trong Cẩm nang / Tin tức. */
export const handbookArticleRoute = (slug: string) => `${ROUTES.HANDBOOK}/bai-viet/${slug}`

/** Bước 1 — Nhập liệu. */
export const designInputRoute = (projectId: string) => `${ROUTES.DESIGN}/${projectId}/input`

/** Bước 2 — Nhận dự toán (màn chờ + kết quả dùng chung một route). */
export const designEstimateRoute = (projectId: string) => `${ROUTES.DESIGN}/${projectId}/estimate`

/** Bước 3 — Hồ sơ thi công (chưa render / đang render / hoàn tất). */
export const designDossierRoute = (projectId: string) => `${ROUTES.DESIGN}/${projectId}/dossier`

/** Public, no-login dossier view opened from a share link. */
export const shareRoute = (token: string) => `/share/${token}`

/**
 * Routes a guest may NOT access once authenticated (redirect home).
 * Login/register are a popup rather than pages, so only the standalone
 * password-reset screen remains guest-only.
 */
export const GUEST_ONLY_ROUTES: readonly string[] = [ROUTES.FORGOT_PASSWORD]

/** Route prefixes that require authentication. */
export const PROTECTED_ROUTE_PREFIXES: readonly string[] = [ROUTES.DESIGN, ROUTES.ACCOUNT]
