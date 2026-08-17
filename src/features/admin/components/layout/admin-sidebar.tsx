'use client'

import { Layout, Menu } from 'antd'
import { useTranslations } from 'next-intl'
import { createElement, useMemo } from 'react'

import { Link, usePathname } from '@/i18n/navigation'
import { ADMIN_ROUTES } from '@/shared/constants'
import { ADMIN_NAV, ADMIN_NAV_ITEMS } from './admin-nav.config'
import { AdminBrand } from './admin-brand'

const { Sider } = Layout

/**
 * Menu trái. `usePathname` của next-intl đã bỏ tiền tố ngôn ngữ nên so khớp
 * được thẳng với `ADMIN_ROUTES`.
 *
 * Mục đang mở lấy đường dẫn KHỚP DÀI NHẤT chứ không phải khớp đầu tiên — nếu
 * không thì `/admin` (Tổng quan) sẽ luôn sáng ở mọi trang con.
 */
export function AdminSidebar({ collapsed, onCollapse }: { collapsed: boolean; onCollapse: (value: boolean) => void }) {
  const t = useTranslations('admin')
  const pathname = usePathname()

  const selectedKey = useMemo(() => {
    const matches = ADMIN_NAV_ITEMS.filter(
      (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
    ).sort((a, b) => b.href.length - a.href.length)
    return matches[0]?.href ?? ADMIN_ROUTES.DASHBOARD
  }, [pathname])

  const items = useMemo(
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

  return (
    <Sider
      width={244}
      collapsible
      collapsed={collapsed}
      onCollapse={onCollapse}
      breakpoint='lg'
      theme='light'
      style={{ borderInlineEnd: '1px solid var(--admin-border)', position: 'sticky', top: 0, height: '100svh' }}
    >
      <AdminBrand collapsed={collapsed} />
      <Menu mode='inline' selectedKeys={[selectedKey]} items={items} style={{ borderInlineEnd: 0 }} />
    </Sider>
  )
}
