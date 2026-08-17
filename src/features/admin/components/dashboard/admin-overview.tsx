'use client'

import {
  AppstoreOutlined,
  CalendarOutlined,
  DollarOutlined,
  FileTextOutlined,
  ProjectOutlined,
  UserOutlined
} from '@ant-design/icons'
import { Alert, Card, Col, Progress, Row, Skeleton, Space, Statistic, Tag, Typography } from 'antd'
import { useLocale, useTranslations } from 'next-intl'
import type { ReactNode } from 'react'

import { Link } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { ADMIN_ROUTES } from '@/shared/constants'
import { formatCurrency, formatNumber } from '@/shared/utils'
import { useAdminStats } from '../../hooks/use-admin-data'
import { AdminPage } from '../common/admin-page'

const { Text } = Typography

/** Một ô số liệu, bấm vào là sang đúng màn quản lý tương ứng. */
function StatTile({
  icon,
  label,
  value,
  suffix,
  href
}: {
  icon: ReactNode
  label: string
  value: string | number
  suffix?: string
  href: string
}) {
  return (
    <Link href={href} style={{ display: 'block', height: '100%' }}>
      <Card hoverable styles={{ body: { padding: 18 } }} style={{ height: '100%' }}>
        <Space align='start' size={12}>
          <span
            style={{
              display: 'grid',
              placeItems: 'center',
              width: 40,
              height: 40,
              borderRadius: 10,
              background: 'var(--admin-tint)',
              color: '#16a34a',
              fontSize: 18
            }}
          >
            {icon}
          </span>
          <Statistic title={label} value={value} suffix={suffix} />
        </Space>
      </Card>
    </Link>
  )
}

/**
 * Trang Tổng quan — con số đếm trực tiếp từ kho nội dung nên luôn khớp với các
 * màn quản lý bên dưới, không có bảng thống kê riêng nào để lệch nhau.
 */
export function AdminOverview() {
  const t = useTranslations('admin')
  const locale = useLocale() as Locale
  const { data, isPending } = useAdminStats()

  if (isPending || !data) {
    return (
      <AdminPage title={t('nav.dashboard')} description={t('dashboard.description')}>
        <Skeleton active paragraph={{ rows: 8 }} />
      </AdminPage>
    )
  }

  // Chia theo TỔNG chứ không theo mục lớn nhất: lấy mục lớn nhất thì mọi trạng
  // thái bằng nhau đều ra thanh đầy 100%, nhìn như không có thông tin gì.
  const totalProjects = Math.max(
    1,
    data.projectsByStatus.reduce((sum, row) => sum + row.count, 0)
  )

  return (
    <AdminPage title={t('nav.dashboard')} description={t('dashboard.description')}>
      {data.pendingBookings > 0 ? (
        <Alert
          type='warning'
          showIcon
          title={t('dashboard.pendingBookingsAlert', { count: data.pendingBookings })}
          action={<Link href={ADMIN_ROUTES.BOOKINGS}>{t('dashboard.reviewNow')}</Link>}
        />
      ) : null}

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} xl={6}>
          <StatTile
            icon={<UserOutlined />}
            label={t('dashboard.customers')}
            value={formatNumber(data.customers, locale)}
            href={ADMIN_ROUTES.CUSTOMERS}
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <StatTile
            icon={<ProjectOutlined />}
            label={t('dashboard.projects')}
            value={formatNumber(data.projects, locale)}
            href={ADMIN_ROUTES.PROJECTS}
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <StatTile
            icon={<CalendarOutlined />}
            label={t('dashboard.pendingBookings')}
            value={formatNumber(data.pendingBookings, locale)}
            href={ADMIN_ROUTES.BOOKINGS}
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <StatTile
            icon={<DollarOutlined />}
            label={t('dashboard.revenue')}
            value={formatCurrency(data.revenue, locale)}
            href={ADMIN_ROUTES.PLANS}
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card title={t('dashboard.projectsByStatus')} style={{ height: '100%' }}>
            <Space orientation='vertical' size={14} style={{ width: '100%' }}>
              {data.projectsByStatus.map((row) => (
                <div key={row.status}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text>{t(`projectStatus.${row.status}`)}</Text>
                    <Text strong>{formatNumber(row.count, locale)}</Text>
                  </div>
                  <Progress
                    percent={Math.round((row.count / totalProjects) * 100)}
                    size='small'
                    strokeColor={{ from: '#006400', to: '#9acd32' }}
                  />
                </div>
              ))}
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          <Card title={t('dashboard.customersByPlan')} style={{ height: '100%' }}>
            <Space orientation='vertical' size={12} style={{ width: '100%' }}>
              {data.customersByPlan.map((row) => (
                <div key={row.plan} style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Tag color={row.plan === 'none' ? 'default' : 'green'}>{t(`planTier.${row.plan}`)}</Tag>
                  <Text strong>{formatNumber(row.count, locale)}</Text>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8 }}>
                <Text type='secondary'>{t('dashboard.subscribers')}</Text>
                <Text strong>{formatNumber(data.subscribers, locale)}</Text>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12}>
          <StatTile
            icon={<AppstoreOutlined />}
            label={t('dashboard.templates')}
            value={formatNumber(data.templates, locale)}
            href={ADMIN_ROUTES.TEMPLATES}
          />
        </Col>
        <Col xs={24} sm={12}>
          <StatTile
            icon={<FileTextOutlined />}
            label={t('dashboard.articles')}
            value={formatNumber(data.articles, locale)}
            href={ADMIN_ROUTES.ARTICLES}
          />
        </Col>
      </Row>
    </AdminPage>
  )
}
