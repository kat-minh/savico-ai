'use client'

import {
  AimOutlined,
  AppstoreOutlined,
  AuditOutlined,
  BookOutlined,
  CalculatorOutlined,
  CalendarOutlined,
  DashboardOutlined,
  DollarOutlined,
  FileTextOutlined,
  GiftOutlined,
  HomeOutlined,
  OrderedListOutlined,
  PictureOutlined,
  PlayCircleOutlined,
  SafetyCertificateOutlined,
  ScheduleOutlined,
  SendOutlined,
  SettingOutlined,
  SkinOutlined,
  TagOutlined,
  TeamOutlined,
  ThunderboltOutlined,
  UserOutlined
} from '@ant-design/icons'
import type { ComponentType } from 'react'

import { ADMIN_ROUTES, type AdminRoute } from '@/shared/constants'

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
    key: 'packages',
    icon: GiftOutlined,
    items: [
      { key: 'planTable', href: ADMIN_ROUTES.PLAN_TABLE, icon: GiftOutlined },
      { key: 'gifts', href: ADMIN_ROUTES.GIFTS, icon: GiftOutlined },
      { key: 'supervisionPackages', href: ADMIN_ROUTES.SUPERVISION_PACKAGES, icon: AuditOutlined }
    ]
  },
  {
    key: 'contractorFlow',
    icon: TeamOutlined,
    items: [
      { key: 'contractors', href: ADMIN_ROUTES.CONTRACTORS, icon: TeamOutlined },
      { key: 'contractorMatching', href: ADMIN_ROUTES.CONTRACTOR_MATCHING, icon: AimOutlined },
      { key: 'surveySchedule', href: ADMIN_ROUTES.SURVEY_SCHEDULE, icon: ScheduleOutlined },
      { key: 'invitations', href: ADMIN_ROUTES.INVITATIONS, icon: SendOutlined }
    ]
  },
  {
    key: 'supervision',
    icon: SafetyCertificateOutlined,
    items: [
      { key: 'inspections', href: ADMIN_ROUTES.INSPECTIONS, icon: SafetyCertificateOutlined },
      { key: 'supervisionStages', href: ADMIN_ROUTES.SUPERVISION_STAGES, icon: OrderedListOutlined }
    ]
  },
  {
    key: 'consult',
    icon: CalendarOutlined,
    items: [
      { key: 'consultants', href: ADMIN_ROUTES.CONSULTANTS, icon: TeamOutlined },
      { key: 'bookings', href: ADMIN_ROUTES.BOOKINGS, icon: CalendarOutlined }
    ]
  },
  {
    key: 'people',
    icon: UserOutlined,
    items: [{ key: 'customers', href: ADMIN_ROUTES.CUSTOMERS, icon: UserOutlined }]
  },
  {
    key: 'catalog',
    icon: AppstoreOutlined,
    items: [
      { key: 'buildingTypes', href: ADMIN_ROUTES.BUILDING_TYPES, icon: AppstoreOutlined },
      { key: 'architectureStyles', href: ADMIN_ROUTES.ARCHITECTURE_STYLES, icon: HomeOutlined },
      { key: 'interiorStyles', href: ADMIN_ROUTES.INTERIOR_STYLES, icon: SkinOutlined }
    ]
  },
  {
    key: 'library',
    icon: BookOutlined,
    items: [
      { key: 'templates', href: ADMIN_ROUTES.TEMPLATES, icon: BookOutlined },
      { key: 'templates3d', href: ADMIN_ROUTES.TEMPLATES_3D, icon: PictureOutlined },
      { key: 'templateViews', href: ADMIN_ROUTES.TEMPLATE_VIEWS, icon: ThunderboltOutlined },
      { key: 'articles', href: ADMIN_ROUTES.ARTICLES, icon: FileTextOutlined },
      { key: 'articleLabels', href: ADMIN_ROUTES.ARTICLE_LABELS, icon: TagOutlined },
      { key: 'handbookSteps', href: ADMIN_ROUTES.HANDBOOK_STEPS, icon: OrderedListOutlined },
      { key: 'guideVideos', href: ADMIN_ROUTES.GUIDE_VIDEOS, icon: PlayCircleOutlined }
    ]
  },
  {
    key: 'config',
    icon: SettingOutlined,
    items: [
      { key: 'costGroups', href: ADMIN_ROUTES.COST_GROUPS, icon: AppstoreOutlined },
      { key: 'costItems', href: ADMIN_ROUTES.COST_ITEMS, icon: OrderedListOutlined },
      { key: 'materialPrices', href: ADMIN_ROUTES.MATERIAL_PRICES, icon: CalculatorOutlined },
      { key: 'estimateAdvice', href: ADMIN_ROUTES.ESTIMATE_ADVICE, icon: FileTextOutlined }
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
