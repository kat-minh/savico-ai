'use client'

import { Menu } from 'antd'
import type { MenuProps } from 'antd'
import { useTranslations } from 'next-intl'
import { createElement, useMemo } from 'react'

import { Link, usePathname } from '@/i18n/navigation'
import { ADMIN_ROUTES } from '@/shared/constants'
import { ADMIN_NAV, ADMIN_NAV_ITEMS } from './admin-nav.config'

type MenuItem = NonNullable<MenuProps['items']>[number]

/**
 * Danh sách mục điều hướng. Dùng chung cho `Sider` (màn rộng) và `Drawer`
 * (màn hẹp) nên phần menu tách riêng khỏi khung.
 *
 * Mỗi nhóm là một LUỒNG của khách (xem `admin-nav.config`). Nhóm "Nội dung
 * site" tạm không dựng — nội dung trang công khai đang sửa ở FE; khi làm CMS thì
 * dựng lại nhóm đó từ `admin-pages.config` như trước.
 */
export function AdminMenu() {
  const t = useTranslations('admin')
  const pathname = usePathname()

  const items = useMemo<MenuItem[]>(
    () =>
      ADMIN_NAV.map((group) => ({
        key: group.key,
        type: 'group' as const,
        label: t(`navGroups.${group.key}`),
        children: group.items.map((item) => ({
          key: item.href,
          icon: createElement(item.icon),
          label: <Link href={item.href}>{t(`nav.${item.key}`)}</Link>
        }))
      })),
    [t]
  )

  /** Mục khớp dài nhất thắng — `/admin/bookings/reschedule` không bôi luôn `/admin/bookings`. */
  const selectedKey = useMemo(() => {
    const matches = ADMIN_NAV_ITEMS.filter(
      (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
    ).sort((a, b) => b.href.length - a.href.length)
    return matches[0]?.href ?? ADMIN_ROUTES.DASHBOARD
  }, [pathname])

  return <Menu mode='inline' selectedKeys={[selectedKey]} items={items} style={{ borderInlineEnd: 0 }} />
}
