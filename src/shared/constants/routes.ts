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
  CONSULT: '/consult', // Tư vấn 1:1 (mục VIII)
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

/**
 * Khu quản trị — route group `(admin)` riêng, không dùng chung khung với site
 * công khai. Mọi đường dẫn bắt đầu bằng `/admin` nên chỉ cần MỘT tiền tố trong
 * `PROTECTED_ROUTE_PREFIXES` là proxy chặn được cả khu.
 */
export const ADMIN_ROUTES = {
  /** Tổng quan — số liệu nhanh toàn hệ thống. */
  DASHBOARD: '/admin',

  /* ---------------------------------------------------------------------------
   * Nội dung site — MỘT MÀN CHO MỖI TRANG CÔNG KHAI.
   *
   * Chia theo trang chứ không theo loại thứ: sửa trang Cẩm nang thì chữ, ảnh và
   * các bảng của chính nó nằm chung một chỗ, không phải đi ba mục khác nhau.
   * Tất cả chạy qua route động `/admin/content/[page]` — xem
   * `features/admin/constants/admin-pages.config.ts`.
   * ------------------------------------------------------------------------ */
  PAGE_HOME: '/admin/content/home',
  PAGE_HANDBOOK: '/admin/content/handbook',
  PAGE_GUIDE: '/admin/content/guide',
  PAGE_PLANS: '/admin/content/plans',
  PAGE_CONSULT: '/admin/content/consult',
  PAGE_DESIGN: '/admin/content/design',
  PAGE_ACCOUNT: '/admin/content/account',
  PAGE_LEGAL: '/admin/content/legal',
  /** Thanh điều hướng, chân trang, thông báo lỗi + thông tin liên hệ & SEO. */
  PAGE_SHELL: '/admin/content/shell',
  /** Chữ không thuộc riêng trang nào — nút chung, popup đăng nhập, thông báo lỗi. */
  PAGE_COMMON: '/admin/content/common',

  /* ---------------------------------------------------------------------------
   * Cấu hình hệ thống — CON SỐ điều khiển cách hệ thống chạy, không phải chữ
   * khách đọc. Tách hẳn khỏi nhóm nội dung: sửa giá gói hay hạn mức lượt AI là
   * việc khác hẳn với sửa tiêu đề một trang, trộn chung thì không ai biết mình
   * đang đụng vào cái gì.
   * ------------------------------------------------------------------------ */
  PLAN_TABLE: '/admin/plans',
  QUOTAS: '/admin/quotas',
  CONSULT_PACKAGES: '/admin/consult-packages',

  // Vận hành — dữ liệu backend sinh ra, không phải nội dung biên tập
  BOOKINGS: '/admin/bookings',
  RESCHEDULE: '/admin/bookings/reschedule',
  SUBSCRIPTIONS: '/admin/subscriptions',
  TRANSACTIONS: '/admin/transactions',
  REVIEWS: '/admin/reviews',
  REPORTS: '/admin/reports',
  PROJECTS: '/admin/projects',
  CUSTOMERS: '/admin/customers',

  // Danh mục cấu hình — mục X, #6
  CATALOG: '/admin/catalog',
  PRICING: '/admin/pricing'
} as const

export type AdminRoute = (typeof ADMIN_ROUTES)[keyof typeof ADMIN_ROUTES]

/** Trang chi tiết một mẫu trong thư viện Cẩm nang (mẫu bản vẽ 2D / nội thất 3D). */
export const handbookTemplateRoute = (id: string) => `${ROUTES.HANDBOOK}/mau/${id}`

/** Trang bài viết trong Cẩm nang / Tin tức. */
export const handbookArticleRoute = (slug: string) => `${ROUTES.HANDBOOK}/bai-viet/${slug}`

/** Hồ sơ một kiến trúc sư + khối chọn khung giờ tư vấn (mục VIII.2). */
export const consultantRoute = (consultantId: string) => `${ROUTES.CONSULT}/${consultantId}`

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
export const PROTECTED_ROUTE_PREFIXES: readonly string[] = [ROUTES.DESIGN, ROUTES.ACCOUNT, ADMIN_ROUTES.DASHBOARD]

/**
 * Khu chỉ dành vai trò `admin`. Proxy chỉ biết "đã đăng nhập hay chưa" (nó đọc
 * cookie, không giải mã token) nên lớp chặn theo vai trò nằm ở `AdminGuard`
 * trong layout — và backend vẫn là nơi phân quyền thật sự.
 */
export const ADMIN_ROUTE_PREFIX: string = ADMIN_ROUTES.DASHBOARD
