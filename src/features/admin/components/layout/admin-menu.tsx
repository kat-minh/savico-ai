'use client'

import { Menu } from 'antd'
import type { MenuProps } from 'antd'
import { useTranslations } from 'next-intl'
import { useSearchParams } from 'next/navigation'
import { createElement, useMemo } from 'react'

import { Link, usePathname } from '@/i18n/navigation'
import { ADMIN_ROUTES } from '@/shared/constants'
import { ADMIN_CONTENT_PAGES, contentPanelsOf } from '../../constants/admin-pages.config'
import { ADMIN_NAV, ADMIN_NAV_ITEMS, CONTENT_PAGE_ICON } from './admin-nav.config'

type MenuItem = NonNullable<MenuProps['items']>[number]

/**
 * Danh sách mục điều hướng. Dùng chung cho `Sider` (màn rộng) và `Drawer`
 * (màn hẹp) nên phần menu tách riêng khỏi khung.
 *
 * KHÔNG CÒN TAB. Mỗi khối sửa được của một trang là một mục menu con, mở sẵn
 * dưới tên trang — nhìn vào sidebar là thấy hết chỗ nào sửa được cái gì, không
 * phải bấm vào trang rồi mới biết bên trong có mấy tab.
 */
export function AdminMenu() {
  const t = useTranslations('admin')
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const tab = searchParams.get('tab') ?? ''

  /**
   * Nhóm "Nội dung site" dựng từ `admin-pages.config` chứ không khai tay: mục
   * con phải khớp CHÍNH XÁC các khối mà màn nội dung dựng ra, khai hai nơi là
   * sớm muộn lệch nhau.
   */
  const contentItems = useMemo<MenuItem[]>(
    () =>
      ADMIN_CONTENT_PAGES.map((page) => {
        const panels = contentPanelsOf(page)
        const icon = CONTENT_PAGE_ICON[page.key]

        const children = panels.map((panel) => ({
          key: `${page.route}?tab=${panel}`,
          label: <Link href={`${page.route}?tab=${panel}`}>{t(`workspace.panels.${panel}`)}</Link>
        }))

        // Trang chỉ có đúng một khối thì đừng bắt bấm mở rồi mới thấy nó.
        if (children.length <= 1) {
          return {
            key: `${page.route}?tab=${panels[0] ?? ''}`,
            icon: icon ? createElement(icon) : undefined,
            label: <Link href={page.route}>{t(`pages.${page.key}.title`)}</Link>
          }
        }

        return {
          key: page.route,
          icon: icon ? createElement(icon) : undefined,
          label: t(`pages.${page.key}.title`),
          children
        }
      }),
    [t]
  )

  const items = useMemo<MenuItem[]>(() => {
    const groups = ADMIN_NAV.map((group) => ({
      key: group.key,
      type: 'group' as const,
      label: t(`navGroups.${group.key}`),
      children: group.items.map((item) => ({
        key: item.href,
        icon: createElement(item.icon),
        label: <Link href={item.href}>{t(`nav.${item.key}`)}</Link>
      }))
    }))

    // Tổng quan đứng đầu, rồi Nội dung site, rồi tới Cấu hình và Vận hành.
    const [overview, ...rest] = groups
    return [
      ...(overview ? [overview] : []),
      { key: 'content', type: 'group' as const, label: t('navGroups.content'), children: contentItems },
      ...rest
    ]
  }, [t, contentItems])

  /**
   * Mục đang mở. Với nhóm nội dung, khối cũng nằm trong khóa (`…?tab=articles`)
   * nên phải khớp cả tham số; không có tham số thì lấy khối đầu của trang.
   */
  const selectedKey = useMemo(() => {
    const page = ADMIN_CONTENT_PAGES.find((item) => item.route === pathname)
    if (page) {
      const panels = contentPanelsOf(page)
      const active = panels.find((panel) => panel === tab) ?? panels[0]
      return `${page.route}?tab=${active ?? ''}`
    }

    const matches = ADMIN_NAV_ITEMS.filter(
      (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
    ).sort((a, b) => b.href.length - a.href.length)
    return matches[0]?.href ?? ADMIN_ROUTES.DASHBOARD
  }, [pathname, tab])

  return (
    <Menu
      mode='inline'
      selectedKeys={[selectedKey]}
      // Mở sẵn trang đang xem; các trang khác người dùng tự bung.
      defaultOpenKeys={[pathname]}
      items={items}
      style={{ borderInlineEnd: 0 }}
    />
  )
}
