'use client'

import { Alert, Col, Form, Input, InputNumber, Row, Select, Switch, Tag, Typography } from 'antd'
import { useLocale, useTranslations } from 'next-intl'

import type { Locale } from '@/i18n/routing'
import type { PlanTier, SubscriptionPlan } from '@/shared/cms'
import { formatCurrency } from '@/shared/utils'
import { newAdminId } from '../../services/admin.service'
import { ResourceManager } from '../common/resource-manager'

const { Text } = Typography

const TIERS: PlanTier[] = ['basic', 'advanced', 'pro']

/**
 * Gói đăng ký (mục VII, Hình 13).
 *
 * Spec ghi rõ giá và số lượt do Bên A chốt, admin sửa được KHÔNG cần deploy
 * (mục X, #4) — nên đây là màn đầu tiên phải chạy được khi bàn giao. Lưu xong là
 * trang /plans của khách đổi theo ngay.
 */
export function PlanManager() {
  const t = useTranslations('admin')
  const locale = useLocale() as Locale

  return (
    <ResourceManager
      collection='plans'
      title={t('nav.planTable')}
      description={t('plans.description')}
      searchText={(item) => `${item.tier} ${item.perk} ${item.audience}`}
      createItem={(): SubscriptionPlan => ({
        id: newAdminId('plan'),
        tier: 'basic',
        price: 0,
        periodDays: 30,
        designCredits: 1,
        libraryCredits: 10,
        perk: '',
        audience: ''
      })}
      banner={<Alert type='info' showIcon title={t('plans.liveNote')} />}
      columns={[
        {
          title: t('plans.tier'),
          dataIndex: 'tier',
          width: 160,
          render: (tier: PlanTier, record) => (
            <span>
              <Tag color='green'>{t(`planTier.${tier}`)}</Tag>
              {record.popular ? <Tag color='gold'>{t('plans.popular')}</Tag> : null}
            </span>
          )
        },
        {
          title: t('plans.price'),
          dataIndex: 'price',
          width: 150,
          sorter: (a, b) => a.price - b.price,
          render: (price: number) => <Text strong>{formatCurrency(price, locale)}</Text>
        },
        {
          title: t('plans.period'),
          dataIndex: 'periodDays',
          width: 110,
          render: (days: number) => t('plans.periodValue', { days })
        },
        { title: t('plans.designCredits'), dataIndex: 'designCredits', width: 120 },
        { title: t('plans.libraryCredits'), dataIndex: 'libraryCredits', width: 130 },
        // Có `width` thì `ellipsis` mới cắt được: bảng chạy `scroll.x = max-content`
        // nên cột không khai bề rộng sẽ nở theo chữ rồi chui xuống dưới cột thao tác.
        { title: t('plans.perk'), dataIndex: 'perk', width: 280, ellipsis: true },
        { title: t('plans.audience'), dataIndex: 'audience', width: 220, ellipsis: true }
      ]}
      renderForm={() => (
        <>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item name='tier' label={t('plans.tier')} tooltip={t('plans.tierHint')}>
                <Select options={TIERS.map((value) => ({ label: t(`planTier.${value}`), value }))} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name='popular' label={t('plans.popular')} valuePropName='checked'>
                <Switch />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name='price' label={t('plans.price')}>
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
              <Form.Item name='periodDays' label={t('plans.period')}>
                <InputNumber min={1} max={730} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={12}>
              <Form.Item name='designCredits' label={t('plans.designCredits')}>
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={12}>
              <Form.Item name='libraryCredits' label={t('plans.libraryCredits')}>
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name='perk' label={t('plans.perk')} tooltip={t('plans.perkHint')}>
            <Input />
          </Form.Item>
          <Form.Item name='audience' label={t('plans.audience')} tooltip={t('plans.audienceHint')}>
            <Input />
          </Form.Item>
        </>
      )}
    />
  )
}
