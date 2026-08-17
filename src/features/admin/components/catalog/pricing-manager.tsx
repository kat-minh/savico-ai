'use client'

import { Alert, Col, Form, Input, InputNumber, Row, Select, Tag, Typography } from 'antd'
import { useLocale, useTranslations } from 'next-intl'

import type { Locale } from '@/i18n/routing'
import type { CmsUnitPrice } from '@/shared/cms'
import { formatCurrency } from '@/shared/utils'
import { newAdminId } from '../../services/admin.service'
import { ResourceManager } from '../common/resource-manager'

const { Text } = Typography

const SECTIONS: CmsUnitPrice['section'][] = ['structure', 'finishing', 'interior']

/**
 * Bảng đơn giá dự toán (mục III.3) — ba cột giá tương ứng ba nấc của slider
 * "Gói hoàn thiện & nội thất" ở Bước 1 (Cơ bản · Tiêu chuẩn · VIP).
 *
 * ⚠️ Công thức dự toán hiện chạy trong mock của `features/design`; bảng này là
 * nơi chốt số với Bên A và là dữ liệu backend sẽ dùng, chưa nối vào phép tính.
 */
export function PricingManager() {
  const t = useTranslations('admin')
  const locale = useLocale() as Locale

  const money = (value: number) => <Text>{formatCurrency(value, locale)}</Text>

  return (
    <ResourceManager
      collection='unitPrices'
      title={t('nav.pricing')}
      description={t('pricing.description')}
      banner={<Alert type='warning' showIcon title={t('pricing.notWiredNote')} />}
      searchText={(item) => `${item.label} ${item.unit}`}
      createItem={(): CmsUnitPrice => ({
        id: newAdminId('up'),
        section: 'structure',
        label: '',
        unit: 'm² sàn',
        basic: 0,
        standard: 0,
        vip: 0
      })}
      columns={[
        {
          title: t('pricing.section'),
          dataIndex: 'section',
          width: 150,
          filters: SECTIONS.map((value) => ({ text: t(`costSection.${value}`), value })),
          onFilter: (value, record) => record.section === value,
          render: (section: CmsUnitPrice['section']) => <Tag color='green'>{t(`costSection.${section}`)}</Tag>
        },
        { title: t('pricing.label'), dataIndex: 'label' },
        { title: t('pricing.unit'), dataIndex: 'unit', width: 110 },
        {
          title: t('packageTier.basic'),
          dataIndex: 'basic',
          width: 150,
          sorter: (a, b) => a.basic - b.basic,
          render: money
        },
        {
          title: t('packageTier.standard'),
          dataIndex: 'standard',
          width: 150,
          sorter: (a, b) => a.standard - b.standard,
          render: money
        },
        {
          title: t('packageTier.vip'),
          dataIndex: 'vip',
          width: 150,
          sorter: (a, b) => a.vip - b.vip,
          render: money
        }
      ]}
      renderForm={() => (
        <>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item name='section' label={t('pricing.section')}>
                <Select options={SECTIONS.map((value) => ({ label: t(`costSection.${value}`), value }))} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name='unit' label={t('pricing.unit')}>
                <Input placeholder='m² sàn' />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name='label'
            label={t('pricing.label')}
            rules={[{ required: true, message: t('fields.requiredMessage') }]}
          >
            <Input />
          </Form.Item>
          <Row gutter={16}>
            {(['basic', 'standard', 'vip'] as const).map((tier) => (
              <Col xs={24} md={8} key={tier}>
                <Form.Item name={tier} label={t(`packageTier.${tier}`)}>
                  <InputNumber<number>
                    min={0}
                    step={10_000}
                    style={{ width: '100%' }}
                    formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
                    parser={(value) => Number(`${value}`.replace(/\./g, ''))}
                    addonAfter='₫'
                  />
                </Form.Item>
              </Col>
            ))}
          </Row>
        </>
      )}
    />
  )
}
