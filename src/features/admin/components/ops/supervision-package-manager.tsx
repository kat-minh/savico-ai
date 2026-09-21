'use client'

import { Col, Form, Input, InputNumber, Row, Switch, Tag, Typography } from 'antd'
import { useLocale, useTranslations } from 'next-intl'

import type { Locale } from '@/i18n/routing'
import type { SupervisionPackage } from '@/shared/cms'
import { formatCurrency } from '@/shared/utils'
import { StringListField } from '../common/field-kit'
import { ResourceManager } from '../common/resource-manager'
import { useProductLabel } from './use-product-label'

const { Text } = Typography

/**
 * GÓI GIÁM SÁT — giá, thời hạn, số lượt kỹ sư kiểm tra (S19).
 *
 * Ba lựa chọn cố định (Tự quản lý / An Tâm / Toàn Diện) nên màn này CHỈ SỬA,
 * không thêm, không xóa: luồng "Chọn cách quản lý thi công" (R8) và bảng điều
 * khiển giám sát đều gọi gói theo đúng ba mã này. Giá đổi ở đây chỉ áp cho đơn
 * MỚI — đơn cũ giữ bản chụp giá lúc đặt.
 */
export function SupervisionPackageManager() {
  const t = useTranslations('admin')
  const locale = useLocale() as Locale
  const productLabel = useProductLabel()

  return (
    <ResourceManager
      collection='supervisionPackages'
      title={t('nav.supervisionPackages')}
      description={t('supervisionPackages.description')}
      allowDelete={false}
      columns={[
        {
          title: t('supervisionPackages.tier'),
          dataIndex: 'tier',
          width: 180,
          render: (_, record) => (
            <span>
              <Tag color='purple'>{productLabel('supervision', record.id)}</Tag>
              {record.recommended ? <Tag color='gold'>{t('supervisionPackages.recommended')}</Tag> : null}
            </span>
          )
        },
        {
          title: t('supervisionPackages.price'),
          dataIndex: 'price',
          width: 150,
          render: (price: number) => <Text strong>{formatCurrency(price, locale)}</Text>
        },
        {
          title: t('supervisionPackages.duration'),
          dataIndex: 'durationMonths',
          width: 120,
          render: (months: number) => t('supervisionPackages.durationValue', { months })
        },
        {
          title: t('supervisionPackages.inspections'),
          dataIndex: 'inspections',
          width: 140,
          render: (inspections: number | null) => (inspections === null ? '—' : inspections)
        },
        { title: t('supervisionPackages.fitLine'), dataIndex: 'fitLine', width: 320, ellipsis: true }
      ]}
      fromFormValues={(values, current): SupervisionPackage => ({
        ...current,
        ...(values as Partial<SupervisionPackage>),
        // Gói tự quản lý không có kỹ sư — giữ `null` thay vì 0 để thẻ không in "0 lượt".
        inspections: current.tier === 'self' ? null : ((values.inspections as number | null) ?? 0)
      })}
      renderForm={(form) => (
        <>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item name='price' label={t('supervisionPackages.price')}>
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
            <Col xs={24} md={12}>
              <Form.Item name='durationMonths' label={t('supervisionPackages.duration')}>
                <InputNumber min={1} max={36} addonAfter={t('supervisionPackages.months')} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item noStyle shouldUpdate>
                {() =>
                  form.getFieldValue('tier') === 'self' ? null : (
                    <Form.Item name='inspections' label={t('supervisionPackages.inspections')}>
                      <InputNumber min={0} max={100} style={{ width: '100%' }} />
                    </Form.Item>
                  )
                }
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name='recommended' label={t('supervisionPackages.recommended')} valuePropName='checked'>
                <Switch />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name='fitLine' label={t('supervisionPackages.fitLine')}>
            <Input />
          </Form.Item>
          <StringListField name='benefits' label={t('supervisionPackages.benefits')} />
        </>
      )}
    />
  )
}
