'use client'

import { Col, Form, Input, InputNumber, Row, Switch, Tag, Typography } from 'antd'
import { useLocale, useTranslations } from 'next-intl'

import type { Locale } from '@/i18n/routing'
import type { CmsConsultPackage } from '@/shared/cms'
import { formatCurrency } from '@/shared/utils'
import { newAdminId } from '../../services/admin.service'
import { ResourceManager } from '../common/resource-manager'

const { Text } = Typography

/**
 * Gói tư vấn 1:1 — sản phẩm bán kèm của trang Tư vấn (số buổi, thời lượng, giá).
 *
 * Đây là DANH MỤC BÁN HÀNG nên đủ CRUD: thêm gói mới, sửa, tắt tạm (không xóa
 * khỏi lịch sử ai đã mua) hoặc xóa hẳn gói chưa ai dùng. Khác với ba gói
 * subscription (Bảng giá gói) — gói tư vấn mua lẻ từng lần, không theo kỳ.
 */
export function ConsultPackageManager() {
  const t = useTranslations('admin')
  const locale = useLocale() as Locale

  return (
    <ResourceManager
      collection='consultPackages'
      title={t('nav.consultPackages')}
      description={t('consultPackages.description')}
      drawerWidth={480}
      searchText={(item) => `${item.name} ${item.description}`}
      createItem={(): CmsConsultPackage => ({
        id: newAdminId('cpk'),
        name: '',
        sessions: 1,
        durationMinutes: 45,
        price: 0,
        description: '',
        enabled: true
      })}
      columns={[
        {
          title: t('consultPackages.name'),
          dataIndex: 'name',
          render: (_, record) => (
            <div style={{ minWidth: 0 }}>
              <Text strong style={{ display: 'block' }}>
                {record.name}
              </Text>
              <Text type='secondary' style={{ fontSize: 12 }} ellipsis={{ tooltip: record.description }}>
                {record.description}
              </Text>
            </div>
          )
        },
        {
          title: t('consultPackages.sessions'),
          dataIndex: 'sessions',
          width: 130,
          sorter: (a, b) => a.sessions - b.sessions,
          render: (_, record) =>
            t('consultPackages.sessionsValue', { sessions: record.sessions, minutes: record.durationMinutes })
        },
        {
          title: t('transactions.amount'),
          dataIndex: 'price',
          width: 150,
          align: 'right' as const,
          sorter: (a, b) => a.price - b.price,
          render: (price: number) =>
            price === 0 ? (
              <Tag color='green'>{t('consultPackages.free')}</Tag>
            ) : (
              <Text strong>{formatCurrency(price, locale)}</Text>
            )
        },
        {
          title: t('bookings.status'),
          dataIndex: 'enabled',
          width: 120,
          render: (enabled: boolean) =>
            enabled ? (
              <Tag color='green'>{t('consultPackages.enabled')}</Tag>
            ) : (
              <Tag>{t('consultPackages.disabled')}</Tag>
            )
        }
      ]}
      renderForm={() => (
        <>
          <Form.Item
            name='name'
            label={t('consultPackages.name')}
            rules={[{ required: true, message: t('fields.requiredMessage') }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name='description' label={t('consultPackages.descriptionLabel')}>
            <Input.TextArea autoSize={{ minRows: 2, maxRows: 4 }} />
          </Form.Item>
          <Row gutter={16}>
            <Col xs={12} md={8}>
              <Form.Item name='sessions' label={t('consultPackages.sessionsLabel')}>
                <InputNumber min={1} max={50} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={12} md={8}>
              <Form.Item name='durationMinutes' label={t('consultPackages.duration')}>
                <InputNumber
                  min={15}
                  max={480}
                  step={15}
                  style={{ width: '100%' }}
                  addonAfter={t('consultPackages.minutes')}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name='price' label={t('transactions.amount')} tooltip={t('consultPackages.priceHint')}>
                <InputNumber<number>
                  min={0}
                  step={100_000}
                  style={{ width: '100%' }}
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
                  parser={(value) => Number(`${value}`.replace(/\./g, ''))}
                  addonAfter='₫'
                />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name='enabled' label={t('consultPackages.enabledLabel')} valuePropName='checked'>
            <Switch />
          </Form.Item>
        </>
      )}
    />
  )
}
