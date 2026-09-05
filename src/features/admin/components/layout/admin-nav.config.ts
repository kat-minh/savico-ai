'use client'

import {
  AppstoreOutlined,
  BookOutlined,
  CalendarOutlined,
  CreditCardOutlined,
  DashboardOutlined,
  DollarOutlined,
  FileTextOutlined,
  FlagOutlined,
  GiftOutlined,
  HomeOutlined,
  LayoutOutlined,
  MenuOutlined,
  PlayCircleOutlined,
  ProjectOutlined,
  SafetyCertificateOutlined,
  SendOutlined,
  StarOutlined,
  SwapOutlined,
  TeamOutlined,
  ThunderboltOutlined,
  ToolOutlined,
  TranslationOutlined,
  UserOutlined
} from '@ant-design/icons'
import type { ComponentType } from 'react'

import { ADMIN_ROUTES, ROUTES, type AdminRoute, type AppRoute } from '@/shared/constants'

/**
 * Menu trái, chia theo BẢN CHẤT của việc chứ không theo module.
 *
 *   · Nội dung site — chữ, ảnh, bài viết: thứ khách ĐỌC.
 *   · Cấu hình hệ thống — giá gói, hạn mức, danh mục, đơn giá: con số điều khiển
 *     cách hệ thống CHẠY.
 *   · Vận hành — lịch hẹn, dự án, người dùng: dữ liệu phát sinh hằng ngày.
 *
 * Trộn ba thứ này vào nhau — bảng giá gói từng nằm chung trang với chữ của trang
 * Gói đăng ký — là nguồn gốc của câu "không biết mình đang sửa cái gì".
 *
 * Nhóm "Nội dung site" KHÔNG khai ở đây: nó dựng từ `admin-pages.config` để chỉ
 * có một nguồn sự thật (xem `admin-menu.tsx`).
 *
 * `key` là hậu tố khóa dịch dưới namespace `admin.nav`.
 */
export const ADMIN_NAV = [
  {
    key: 'overview',
    items: [{ key: 'dashboard', href: ADMIN_ROUTES.DASHBOARD, icon: DashboardOutlined }]
  },
  {
    key: 'config',
    items: [
      { key: 'planTable', href: ADMIN_ROUTES.PLAN_TABLE, icon: DollarOutlined },
      { key: 'quotas', href: ADMIN_ROUTES.QUOTAS, icon: ThunderboltOutlined },
      { key: 'consultPackages', href: ADMIN_ROUTES.CONSULT_PACKAGES, icon: GiftOutlined },
      { key: 'catalog', href: ADMIN_ROUTES.CATALOG, icon: AppstoreOutlined },
      { key: 'pricing', href: ADMIN_ROUTES.PRICING, icon: FileTextOutlined }
    ]
  },
  {
    key: 'ops',
    items: [
      { key: 'bookings', href: ADMIN_ROUTES.BOOKINGS, icon: CalendarOutlined },
      { key: 'reschedule', href: ADMIN_ROUTES.RESCHEDULE, icon: SwapOutlined },
      { key: 'subscriptions', href: ADMIN_ROUTES.SUBSCRIPTIONS, icon: CreditCardOutlined },
      { key: 'transactions', href: ADMIN_ROUTES.TRANSACTIONS, icon: DollarOutlined },
      { key: 'reviews', href: ADMIN_ROUTES.REVIEWS, icon: StarOutlined },
      { key: 'reports', href: ADMIN_ROUTES.REPORTS, icon: FlagOutlined },
      { key: 'projects', href: ADMIN_ROUTES.PROJECTS, icon: ProjectOutlined },
      { key: 'invitations', href: ADMIN_ROUTES.INVITATIONS, icon: SendOutlined },
      { key: 'inspections', href: ADMIN_ROUTES.INSPECTIONS, icon: SafetyCertificateOutlined },
      { key: 'customers', href: ADMIN_ROUTES.CUSTOMERS, icon: UserOutlined }
    ]
  }
] as const satisfies readonly {
  key: string
  items: readonly { key: string; href: AdminRoute; icon: ComponentType }[]
}[]

export type AdminNavGroup = (typeof ADMIN_NAV)[number]
export type AdminNavItem = AdminNavGroup['items'][number]

/** Mọi mục ngoài nhóm nội dung, phẳng — dùng để tra tiêu đề trang theo pathname. */
export const ADMIN_NAV_ITEMS: readonly AdminNavItem[] = ADMIN_NAV.flatMap<AdminNavItem>((group) => [...group.items])

/** Icon của từng trang nội dung, tra theo `key` trong `admin-pages.config`. */
export const CONTENT_PAGE_ICON: Record<string, ComponentType> = {
  home: HomeOutlined,
  handbook: BookOutlined,
  guide: PlayCircleOutlined,
  plans: DollarOutlined,
  consult: TeamOutlined,
  design: ToolOutlined,
  account: UserOutlined,
  legal: LayoutOutlined,
  shell: MenuOutlined,
  common: TranslationOutlined
}

/** Trang công khai tương ứng — nút "Mở site" mở đúng trang đang sửa. */
export const CONTENT_PAGE_PUBLIC_HREF: Record<string, AppRoute> = {
  home: ROUTES.HOME,
  handbook: ROUTES.HANDBOOK,
  guide: ROUTES.GUIDE,
  plans: ROUTES.PLANS,
  consult: ROUTES.CONSULT,
  design: ROUTES.DESIGN,
  account: ROUTES.ACCOUNT,
  legal: ROUTES.TERMS
}
