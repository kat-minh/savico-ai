'use client'

import {
  AppstoreOutlined,
  BookOutlined,
  CalendarOutlined,
  DashboardOutlined,
  DollarOutlined,
  FileTextOutlined,
  HomeOutlined,
  LayoutOutlined,
  PlayCircleOutlined,
  ProjectOutlined,
  SettingOutlined,
  TeamOutlined,
  UserOutlined
} from '@ant-design/icons'
import type { ComponentType } from 'react'

import { ADMIN_ROUTES, type AdminRoute } from '@/shared/constants'

/**
 * Menu trái của khu quản trị.
 *
 * Nhóm theo đúng cách spec chia việc: Nội dung site (mục II, X) · Cẩm nang
 * (mục VI) · Hướng dẫn · Tư vấn 1:1 (mục VIII) · Kinh doanh & vận hành ·
 * Danh mục cấu hình (mục X, #6).
 *
 * `key` là hậu tố khóa dịch dưới namespace `admin.nav`.
 */
export const ADMIN_NAV = [
  {
    key: 'overview',
    items: [{ key: 'dashboard', href: ADMIN_ROUTES.DASHBOARD, icon: DashboardOutlined }]
  },
  {
    key: 'content',
    items: [
      { key: 'homeContent', href: ADMIN_ROUTES.HOME_CONTENT, icon: HomeOutlined },
      { key: 'staticPages', href: ADMIN_ROUTES.STATIC_PAGES, icon: LayoutOutlined },
      { key: 'settings', href: ADMIN_ROUTES.SETTINGS, icon: SettingOutlined }
    ]
  },
  {
    key: 'handbook',
    items: [
      { key: 'templates', href: ADMIN_ROUTES.TEMPLATES, icon: AppstoreOutlined },
      { key: 'articles', href: ADMIN_ROUTES.ARTICLES, icon: BookOutlined },
      { key: 'guide', href: ADMIN_ROUTES.GUIDE, icon: PlayCircleOutlined }
    ]
  },
  {
    key: 'consult',
    items: [
      { key: 'consultants', href: ADMIN_ROUTES.CONSULTANTS, icon: TeamOutlined },
      { key: 'bookings', href: ADMIN_ROUTES.BOOKINGS, icon: CalendarOutlined }
    ]
  },
  {
    key: 'business',
    items: [
      { key: 'plans', href: ADMIN_ROUTES.PLANS, icon: DollarOutlined },
      { key: 'projects', href: ADMIN_ROUTES.PROJECTS, icon: ProjectOutlined },
      { key: 'customers', href: ADMIN_ROUTES.CUSTOMERS, icon: UserOutlined }
    ]
  },
  {
    key: 'catalog',
    items: [
      { key: 'catalog', href: ADMIN_ROUTES.CATALOG, icon: AppstoreOutlined },
      { key: 'pricing', href: ADMIN_ROUTES.PRICING, icon: FileTextOutlined }
    ]
  }
] as const satisfies readonly {
  key: string
  items: readonly { key: string; href: AdminRoute; icon: ComponentType }[]
}[]

/**
 * Kiểu suy ra từ chính bảng trên nên `key` là hằng chuỗi cụ thể chứ không phải
 * `string` — nhờ vậy `t(`nav.${item.key}`)` được next-intl kiểm khóa dịch.
 */
export type AdminNavGroup = (typeof ADMIN_NAV)[number]
export type AdminNavItem = AdminNavGroup['items'][number]

/** Mọi mục menu, phẳng — dùng để tra tiêu đề trang theo pathname. */
export const ADMIN_NAV_ITEMS: readonly AdminNavItem[] = ADMIN_NAV.flatMap<AdminNavItem>((group) => [...group.items])
