'use client'

import {
  AppstoreOutlined,
  AuditOutlined,
  BookOutlined,
  CalculatorOutlined,
  CalendarOutlined,
  DashboardOutlined,
  DiffOutlined,
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
  ScheduleOutlined,
  SendOutlined,
  SettingOutlined,
  StarOutlined,
  TagOutlined,
  TeamOutlined,
  ThunderboltOutlined,
  ToolOutlined,
  TranslationOutlined,
  UserOutlined
} from '@ant-design/icons'
import type { ComponentType } from 'react'

import { ADMIN_ROUTES, ROUTES, type AdminRoute, type AppRoute } from '@/shared/constants'

/**
 * Menu trái — dựng quanh VIỆC VẬN HÀNH HẰNG NGÀY, theo thứ tự ưu tiên.
 *
 *   · Tổng quan         — hàng đợi việc hôm nay.
 *   · Thanh toán        — tra cứu đơn, mã giảm giá, sổ giao dịch (trạng thái do BE cập nhật).
 *   · Tìm nhà thầu      — lời mời & lịch khảo sát (một màn), danh bạ nhà thầu.
 *   · Giám sát thi công — xác nhận giai đoạn, yêu cầu sửa đổi.
 *   · Tư vấn 1:1        — lịch hẹn.
 *   · Khách hàng        — tài khoản, dự án thiết kế, kiểm duyệt review / báo cáo.
 *   · Thư viện          — kho mẫu 2D/3D và video hướng dẫn.
 *   · Cấu hình          — CON SỐ điều khiển hệ thống: giá gói, hạn mức, danh mục, đơn giá.
 *
 * Nhóm theo LUỒNG của khách chứ không theo kiểu dữ liệu: nhận cuộc gọi "tôi mời
 * nhà thầu rồi mà chưa ai gọi lại" thì mọi thứ của luồng đó nằm cạnh nhau.
 *
 * Nhóm "Nội dung site" (CMS theo trang) tạm GỠ khỏi menu — nội dung trang công
 * khai đang sửa thẳng ở FE. Route `/admin/content/[page]` và `admin-pages.config`
 * vẫn còn nguyên để bật lại khi làm CMS.
 *
 * "Kỳ đăng ký gói" (gia hạn / hủy tay) cũng gỡ khỏi menu: kích hoạt và hết hạn gói do
 * backend xử lý; gói hiện tại của khách xem ở "Tài khoản khách".
 *
 * `key` là hậu tố khóa dịch dưới namespace `admin.nav`.
 */
export const ADMIN_NAV = [
  {
    key: 'overview',
    icon: DashboardOutlined,
    items: [{ key: 'dashboard', href: ADMIN_ROUTES.DASHBOARD, icon: DashboardOutlined }]
  },
  {
    key: 'payments',
    icon: DollarOutlined,
    items: [
      { key: 'orders', href: ADMIN_ROUTES.ORDERS, icon: DollarOutlined },
      { key: 'discounts', href: ADMIN_ROUTES.DISCOUNTS, icon: TagOutlined },
      { key: 'transactions', href: ADMIN_ROUTES.TRANSACTIONS, icon: FileTextOutlined }
    ]
  },
  {
    key: 'contractorFlow',
    icon: TeamOutlined,
    items: [
      { key: 'invitations', href: ADMIN_ROUTES.INVITATIONS, icon: SendOutlined },
      { key: 'contractors', href: ADMIN_ROUTES.CONTRACTORS, icon: TeamOutlined }
    ]
  },
  {
    key: 'supervision',
    icon: SafetyCertificateOutlined,
    items: [
      { key: 'inspections', href: ADMIN_ROUTES.INSPECTIONS, icon: SafetyCertificateOutlined },
      { key: 'changeRequests', href: ADMIN_ROUTES.CHANGE_REQUESTS, icon: DiffOutlined }
    ]
  },
  {
    key: 'consult',
    icon: CalendarOutlined,
    items: [{ key: 'bookings', href: ADMIN_ROUTES.BOOKINGS, icon: CalendarOutlined }]
  },
  {
    key: 'people',
    icon: UserOutlined,
    items: [
      { key: 'customers', href: ADMIN_ROUTES.CUSTOMERS, icon: UserOutlined },
      { key: 'projects', href: ADMIN_ROUTES.PROJECTS, icon: ProjectOutlined },
      { key: 'reviews', href: ADMIN_ROUTES.REVIEWS, icon: StarOutlined },
      { key: 'reports', href: ADMIN_ROUTES.REPORTS, icon: FlagOutlined }
    ]
  },
  {
    key: 'library',
    icon: BookOutlined,
    items: [
      { key: 'templates', href: ADMIN_ROUTES.TEMPLATES, icon: BookOutlined },
      { key: 'guideVideos', href: ADMIN_ROUTES.GUIDE_VIDEOS, icon: PlayCircleOutlined }
    ]
  },
  {
    key: 'config',
    icon: SettingOutlined,
    items: [
      { key: 'planTable', href: ADMIN_ROUTES.PLAN_TABLE, icon: GiftOutlined },
      { key: 'supervisionPackages', href: ADMIN_ROUTES.SUPERVISION_PACKAGES, icon: AuditOutlined },
      { key: 'consultPackages', href: ADMIN_ROUTES.CONSULT_PACKAGES, icon: ScheduleOutlined },
      { key: 'quotas', href: ADMIN_ROUTES.QUOTAS, icon: ThunderboltOutlined },
      { key: 'catalog', href: ADMIN_ROUTES.CATALOG, icon: AppstoreOutlined },
      { key: 'pricing', href: ADMIN_ROUTES.PRICING, icon: CalculatorOutlined }
    ]
  }
] as const satisfies readonly {
  key: string
  /** Biểu tượng của hàng cha trong menu gập. */
  icon: ComponentType
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
