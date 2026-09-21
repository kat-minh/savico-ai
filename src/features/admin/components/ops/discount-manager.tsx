'use client'

import { Col, DatePicker, Form, Input, InputNumber, Progress, Radio, Row, Select, Switch, Tag, Typography } from 'antd'
import dayjs, { type Dayjs } from 'dayjs'
import { useLocale, useTranslations } from 'next-intl'
import { useMemo } from 'react'

import type { Locale } from '@/i18n/routing'
import { discountUsage, normalizeDiscountCode, type CmsDiscountCode } from '@/shared/cms'
import { formatCurrency } from '@/shared/utils'
import { useAdminCollection } from '../../hooks/use-admin-data'
import { newAdminId, todayKey } from '../../services/admin.service'
import { ResourceManager } from '../common/resource-manager'
import { useProductLabel } from './use-product-label'

const { Text } = Typography

/** Trạng thái hiệu lực suy ra từ cấu hình + hôm nay — không lưu, để không bao giờ lệch. */
type Validity = 'active' | 'disabled' | 'scheduled' | 'expired' | 'exhausted'

const VALIDITY_TAG: Record<Validity, string> = {
  active: 'green',
  disabled: 'default',
  scheduled: 'blue',
  expired: 'default',
  exhausted: 'orange'
}

interface FormValues extends Omit<CmsDiscountCode, 'startsAt' | 'endsAt'> {
  period?: [Dayjs | null, Dayjs | null] | null
}

/**
 * MÃ GIẢM GIÁ — ô "Mã giảm giá" ở S03 đọc thẳng bảng này.
 *
 * Luật áp mã (`evaluateDiscount` ở `shared/cms`) là MỘT hàm dùng chung cho ô nhập
 * mã của khách, lúc tạo đơn và cột "Đã dùng" ở đây — nên cấu hình gì ở đây thì
 * khách gặp đúng như vậy.
 *
 * "Đã dùng" đếm từ đơn ĐÃ THANH TOÁN, không lưu thành số riêng. Mã đã có người
 * dùng thì tắt đi chứ không xóa: đơn cũ còn tham chiếu tới mã.
 */
export function DiscountManager() {
  const t = useTranslations('admin')
  const locale = useLocale() as Locale
  const productLabel = useProductLabel()

  const { data: orders = [] } = useAdminCollection('orders')
  const { data: plans = [] } = useAdminCollection('plans')
  const { data: supervisionPackages = [] } = useAdminCollection('supervisionPackages')

  const productOptions = useMemo(
    () => [
      ...plans.map((plan) => ({ value: plan.id, label: productLabel('design', plan.id) })),
      ...supervisionPackages
        .filter((item) => item.price > 0)
        .map((item) => ({ value: item.id, label: productLabel('supervision', item.id) }))
    ],
    [plans, supervisionPackages, productLabel]
  )

  const today = todayKey()

  function validityOf(item: CmsDiscountCode): Validity {
    if (!item.enabled) return 'disabled'
    if (item.startsAt && today < item.startsAt) return 'scheduled'
    if (item.endsAt && today > item.endsAt) return 'expired'
    if (item.usageLimit && discountUsage(item.code, orders).total >= item.usageLimit) return 'exhausted'
    return 'active'
  }

  return (
    <ResourceManager
      collection='discountCodes'
      title={t('nav.discounts')}
      description={t('discounts.description')}
      // Không xóa mã: đơn cũ còn tham chiếu tới mã. Hết dùng thì tắt công tắc.
      allowDelete={false}
      searchText={(item) => `${item.code} ${item.note ?? ''}`}
      createItem={(): CmsDiscountCode => ({
        id: newAdminId('dc'),
        code: '',
        type: 'percent',
        value: 10,
        maxDiscount: null,
        minOrder: null,
        startsAt: today,
        endsAt: null,
        usageLimit: null,
        perAccountLimit: 1,
        productIds: [],
        enabled: true
      })}
      toFormValues={(item) => ({
        ...item,
        period: [item.startsAt ? dayjs(item.startsAt) : null, item.endsAt ? dayjs(item.endsAt) : null]
      })}
      fromFormValues={(values, current) => {
        const { period, ...rest } = values as unknown as FormValues
        const [start, end] = period ?? [null, null]
        return {
          ...current,
          ...rest,
          code: normalizeDiscountCode(rest.code),
          startsAt: start ? start.format('YYYY-MM-DD') : null,
          endsAt: end ? end.format('YYYY-MM-DD') : null,
          productIds: rest.productIds ?? []
        }
      }}
      columns={[
        {
          title: t('discounts.code'),
          dataIndex: 'code',
          render: (code: string, record) => (
            <div style={{ minWidth: 0 }}>
              <Text code strong copyable>
                {code}
              </Text>
              {record.note ? (
                <Text type='secondary' style={{ display: 'block', fontSize: 12 }} ellipsis={{ tooltip: record.note }}>
                  {record.note}
                </Text>
              ) : null}
            </div>
          )
        },
        {
          title: t('discounts.value'),
          key: 'value',
          width: 180,
          render: (_, record) => (
            <div>
              <Text strong>
                {record.type === 'percent' ? `−${record.value}%` : `−${formatCurrency(record.value, locale)}`}
              </Text>
              {record.type === 'percent' && record.maxDiscount ? (
                <Text type='secondary' style={{ display: 'block', fontSize: 12 }}>
                  {t('discounts.capped', { amount: formatCurrency(record.maxDiscount, locale) })}
                </Text>
              ) : null}
              {record.minOrder ? (
                <Text type='secondary' style={{ display: 'block', fontSize: 12 }}>
                  {t('discounts.minOrderShort', { amount: formatCurrency(record.minOrder, locale) })}
                </Text>
              ) : null}
            </div>
          )
        },
        {
          title: t('discounts.products'),
          dataIndex: 'productIds',
          width: 200,
          render: (ids: string[]) =>
            ids.length === 0 ? (
              <Text type='secondary'>{t('discounts.allProducts')}</Text>
            ) : (
              ids.map((id) => <Tag key={id}>{productOptions.find((option) => option.value === id)?.label ?? id}</Tag>)
            )
        },
        {
          title: t('discounts.period'),
          key: 'period',
          width: 190,
          render: (_, record) => (
            <Text>
              {record.startsAt ? dayjs(record.startsAt).format('DD/MM/YY') : '…'} →{' '}
              {record.endsAt ? dayjs(record.endsAt).format('DD/MM/YY') : '…'}
            </Text>
          )
        },
        {
          title: t('discounts.used'),
          key: 'used',
          width: 150,
          render: (_, record) => {
            const used = discountUsage(record.code, orders).total
            return record.usageLimit ? (
              <div style={{ minWidth: 110 }}>
                <Text>
                  {used}/{record.usageLimit}
                </Text>
                <Progress percent={Math.round((used / record.usageLimit) * 100)} size='small' showInfo={false} />
              </div>
            ) : (
              <Text>{t('discounts.usedUnlimited', { count: used })}</Text>
            )
          }
        },
        {
          title: t('discounts.state'),
          key: 'state',
          width: 130,
          render: (_, record) => {
            const validity = validityOf(record)
            return <Tag color={VALIDITY_TAG[validity]}>{t(`discountValidity.${validity}`)}</Tag>
          }
        }
      ]}
      renderForm={(form) => (
        <>
          <Row gutter={16}>
            <Col xs={24} sm={14}>
              <Form.Item
                name='code'
                label={t('discounts.code')}
                normalize={(value: string) => value.toUpperCase().replace(/\s/g, '')}
                rules={[
                  { required: true, message: t('fields.requiredMessage') },
                  { pattern: /^[A-Z0-9_-]{3,20}$/, message: t('discounts.codeRule') }
                ]}
              >
                <Input placeholder='KHAITRUONG' />
              </Form.Item>
            </Col>
            <Col xs={24} sm={10}>
              <Form.Item name='enabled' label={t('discounts.enabled')} valuePropName='checked'>
                <Switch />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name='type' label={t('discounts.type')}>
            <Radio.Group
              optionType='button'
              options={[
                { value: 'percent', label: t('discounts.typePercent') },
                { value: 'amount', label: t('discounts.typeAmount') }
              ]}
            />
          </Form.Item>

          <Form.Item noStyle shouldUpdate={(prev, next) => prev.type !== next.type}>
            {() => {
              const isPercent = form.getFieldValue('type') === 'percent'
              return (
                <Row gutter={16}>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      name='value'
                      label={t('discounts.value')}
                      rules={[{ required: true, message: t('fields.requiredMessage') }]}
                    >
                      <InputNumber
                        min={1}
                        max={isPercent ? 100 : 100_000_000}
                        step={isPercent ? 1 : 50_000}
                        addonAfter={isPercent ? '%' : '₫'}
                        style={{ width: '100%' }}
                      />
                    </Form.Item>
                  </Col>
                  {isPercent ? (
                    <Col xs={24} sm={12}>
                      <Form.Item
                        name='maxDiscount'
                        label={t('discounts.maxDiscount')}
                        extra={t('discounts.emptyUnlimited')}
                      >
                        <InputNumber min={0} step={50_000} addonAfter='₫' style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                  ) : null}
                </Row>
              )
            }}
          </Form.Item>

          <Form.Item name='productIds' label={t('discounts.products')} extra={t('discounts.productsHint')}>
            <Select mode='multiple' allowClear options={productOptions} placeholder={t('discounts.allProducts')} />
          </Form.Item>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item name='minOrder' label={t('discounts.minOrder')} extra={t('discounts.emptyUnlimited')}>
                <InputNumber min={0} step={100_000} addonAfter='₫' style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name='period' label={t('discounts.period')} extra={t('discounts.periodHint')}>
                <DatePicker.RangePicker format='DD/MM/YYYY' allowEmpty={[true, true]} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name='usageLimit' label={t('discounts.usageLimit')} extra={t('discounts.emptyUnlimited')}>
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name='perAccountLimit'
                label={t('discounts.perAccountLimit')}
                extra={t('discounts.emptyUnlimited')}
              >
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name='note' label={t('discounts.note')}>
            <Input.TextArea rows={2} />
          </Form.Item>
        </>
      )}
    />
  )
}
