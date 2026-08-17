'use client'

import {
  ExportOutlined,
  GlobalOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  MoonOutlined,
  SunOutlined
} from '@ant-design/icons'
import { Button, Dropdown, Layout, Segmented, Space, Tooltip, Typography } from 'antd'
import { useLocale, useTranslations } from 'next-intl'
import { useTheme } from 'next-themes'
import type { ReactNode } from 'react'

import { Link, usePathname, useRouter } from '@/i18n/navigation'
import { LOCALES, type Locale } from '@/i18n/routing'
import { CMS_LOCALES } from '@/shared/cms'
import { ROUTES } from '@/shared/constants'
import { useCmsLocaleStore } from '../../store/cms-locale.store'
import { ADMIN_NAV_ITEMS } from './admin-nav.config'

const { Header } = Layout
const { Title, Text } = Typography

/**
 * Thanh trên cùng của khu quản trị.
 *
 * Có HAI công tắc ngôn ngữ, cố ý tách bạch:
 *   · "Nội dung" — bản dịch đang biên tập. Đây là thứ quyết định lưu vào ngăn
 *     nào của kho, nên để nổi bật nhất bên phải tiêu đề.
 *   · Quả địa cầu — ngôn ngữ của chính bảng điều khiển. Người vận hành người
 *     Việt vẫn giữ giao diện tiếng Việt trong khi soạn bản tiếng Anh.
 */
export function AdminHeader({
  collapsed,
  onToggle,
  userSlot
}: {
  collapsed: boolean
  onToggle: () => void
  userSlot?: ReactNode
}) {
  const t = useTranslations('admin')
  const pathname = usePathname()
  const router = useRouter()
  const uiLocale = useLocale()
  const { resolvedTheme, setTheme } = useTheme()

  const contentLocale = useCmsLocaleStore((state) => state.locale)
  const setContentLocale = useCmsLocaleStore((state) => state.setLocale)

  // Tiêu đề = mục menu khớp dài nhất, cùng quy tắc với thanh bên.
  const active = ADMIN_NAV_ITEMS.filter((item) => pathname === item.href || pathname.startsWith(`${item.href}/`)).sort(
    (a, b) => b.href.length - a.href.length
  )[0]

  return (
    <Header
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        position: 'sticky',
        top: 0,
        zIndex: 10,
        borderBottom: '1px solid var(--admin-border)'
      }}
    >
      <Button
        type='text'
        aria-label={t('shell.toggleSidebar')}
        icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        onClick={onToggle}
      />
      <Title level={5} style={{ margin: 0, flex: 1, minWidth: 0 }} ellipsis>
        {active ? t(`nav.${active.key}`) : t('shell.title')}
      </Title>

      <Space size={8}>
        <Tooltip title={t('shell.contentLocaleHint')}>
          <Space size={6}>
            <Text type='secondary' style={{ fontSize: 12, whiteSpace: 'nowrap' }} className='admin-hide-sm'>
              {t('shell.contentLocale')}
            </Text>
            <Segmented
              size='small'
              value={contentLocale}
              onChange={(value) => setContentLocale(value as Locale)}
              options={CMS_LOCALES.map((code) => ({ label: code.toUpperCase(), value: code }))}
            />
          </Space>
        </Tooltip>

        <Dropdown
          menu={{
            selectable: true,
            selectedKeys: [uiLocale],
            items: LOCALES.map((code) => ({
              key: code,
              label: t(`shell.uiLocaleOption.${code}`),
              onClick: () => router.replace(pathname, { locale: code })
            }))
          }}
        >
          <Button type='text' aria-label={t('shell.uiLocale')} icon={<GlobalOutlined />} />
        </Dropdown>

        <Tooltip title={t('shell.toggleTheme')}>
          <Button
            type='text'
            aria-label={t('shell.toggleTheme')}
            icon={resolvedTheme === 'dark' ? <SunOutlined /> : <MoonOutlined />}
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
          />
        </Tooltip>

        <Tooltip title={t('shell.viewSite')}>
          <Link href={ROUTES.HOME} target='_blank' rel='noreferrer'>
            <Button type='text' aria-label={t('shell.viewSite')} icon={<ExportOutlined />} />
          </Link>
        </Tooltip>

        {userSlot}
      </Space>
    </Header>
  )
}
