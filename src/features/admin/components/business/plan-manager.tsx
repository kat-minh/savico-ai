'use client'

import {
  Alert,
  App,
  Button,
  Card,
  Col,
  Descriptions,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Space,
  Switch,
  Tag,
  Typography,
  type FormInstance
} from 'antd'
import { useLocale, useTranslations } from 'next-intl'
import { useState } from 'react'

import type { Locale } from '@/i18n/routing'
import {
  PLAN_BENEFIT_TEXT_MAX,
  PLAN_TOGGLE_GROUPS,
  PLAN_TOGGLE_KEYS,
  isBenefitEnabled,
  type PlanBenefits,
  type PlanHighlightKey,
  type SubscriptionPlan
} from '@/shared/cms'
import { formatCurrency } from '@/shared/utils'
import {
  useAdminCollection,
  useAdminDocument,
  useSaveAdminDocument,
  useSaveAdminItem
} from '../../hooks/use-admin-data'
import { ImageUrlField } from '../common/field-kit'
import { ResourceManager } from '../common/resource-manager'

const { Text } = Typography

const LEVELS = {
  layout: ['none', 'basic', '2d3d', '2d3dPlus', 'custom'],
  interiorEstimate: ['none', 'rough', 'detailed', 'optimized', 'custom'],
  advisory: ['none', 'online', 'priority', 'expert', 'custom']
} as const

type LevelKey = keyof typeof LEVELS

/**
 * Nhãn cấp độ của một quyền lợi. Tách theo từng loại để khóa dịch luôn là một
 * cặp HỢP LỆ — ghép `${field}.${level}` tự do sinh tích chéo mà next-intl bắt lỗi.
 */
function useLevelLabel() {
  const t = useTranslations('admin.plans.levels')
  return (field: LevelKey, level: string): string => {
    if (field === 'layout') return t(`layout.${level as (typeof LEVELS)['layout'][number]}`)
    if (field === 'interiorEstimate') {
      return t(`interiorEstimate.${level as (typeof LEVELS)['interiorEstimate'][number]}`)
    }
    return t(`advisory.${level as (typeof LEVELS)['advisory'][number]}`)
  }
}

/** Mã gói: chữ in hoa, số, gạch ngang, gạch dưới. */
const CODE_PATTERN = /^[A-Z0-9_-]+$/

/**
 * GÓI THIẾT KẾ (epic DesignPackageManagement).
 *
 * Ba gói CỐ ĐỊNH BASIC / PLUS / PRO — không thêm, không xóa. Admin cập nhật
 * tổng quan, giá, quota, trạng thái, toàn bộ quyền lợi (dùng chung cho thẻ gói
 * và bảng so sánh), quyền lợi nổi bật và quà tặng. Chu kỳ sử dụng là cấu hình
 * DÙNG CHUNG ở khối phía trên. Đơn đã tạo giữ snapshot — đổi cấu hình chỉ áp
 * dụng cho đơn tạo sau.
 */
export function PlanManager() {
  const t = useTranslations('admin')
  const tRows = useTranslations('plans.comparison.rows')
  const locale = useLocale() as Locale
  const levelLabel = useLevelLabel()
  const { data: plans = [] } = useAdminCollection('plans')
  const { data: gifts = [] } = useAdminCollection('gifts')
  const { data: orders = [] } = useAdminCollection('orders')
  const save = useSaveAdminItem('plans')

  const hasOrders = (plan: SubscriptionPlan) => orders.some((order) => order.product.id === plan.id)
  const giftOf = (id: string | null) => gifts.find((gift) => gift.id === id)
  const labelOf = (key: PlanHighlightKey) =>
    key === 'designCredits'
      ? t('plans.designCredits')
      : key === 'libraryCredits'
        ? t('plans.libraryCredits')
        : tRows(key)

  /** Quy tắc chéo trước khi lưu (§3, §5, §6). */
  function problemOf(next: SubscriptionPlan, current: SubscriptionPlan): string | null {
    if (plans.some((plan) => plan.id !== next.id && plan.code === next.code)) return t('plans.duplicateCode')
    if (hasOrders(current) && next.code !== current.code) return t('plans.codeLocked')
    const disabled = next.highlights.filter((key) => !isBenefitEnabled(next, key))
    if (disabled.length) return t('plans.highlightDisabled', { items: disabled.map(labelOf).join(', ') })
    if (next.giftId) {
      const gift = giftOf(next.giftId)
      if (!gift || gift.status !== 'active') return t('plans.giftHidden')
      if (!next.giftConditions?.trim()) return t('plans.giftConditionsRequired')
    }
    return null
  }

  return (
    <div className='flex flex-col gap-6'>
      <PeriodSettings />
      <ResourceManager
        collection='plans'
        title={t('nav.planTable')}
        description={t('plans.description')}
        allowDelete={false}
        drawerWidth={820}
        banner={<Alert type='info' showIcon title={t('plans.fixedNote')} />}
        fromFormValues={(values, current) => {
          const next = { ...current, ...values } as SubscriptionPlan
          const benefits = values.benefits as PlanBenefits | undefined
          return {
            ...next,
            name: next.name.trim(),
            code: next.code.trim().toUpperCase(),
            shortLabel: next.shortLabel?.trim() || undefined,
            fitLine: next.fitLine.trim(),
            ctaLabel: next.ctaLabel.trim(),
            // Tắt một quyền lợi KHÔNG xóa nội dung cũ — trộn đè để bật lại là còn nguyên.
            benefits: benefits
              ? {
                  toggles: Object.fromEntries(
                    PLAN_TOGGLE_KEYS.map((key) => [key, { ...current.benefits.toggles[key], ...benefits.toggles[key] }])
                  ) as PlanBenefits['toggles'],
                  layout: { ...current.benefits.layout, ...benefits.layout },
                  interiorEstimate: { ...current.benefits.interiorEstimate, ...benefits.interiorEstimate },
                  advisory: { ...current.benefits.advisory, ...benefits.advisory }
                }
              : current.benefits,
            highlights: (values.highlights as PlanHighlightKey[] | undefined) ?? current.highlights,
            giftId: (values.giftId as string | undefined) || null,
            giftConditions: (values.giftId as string | undefined)
              ? (values.giftConditions as string | undefined)?.trim()
              : undefined
          }
        }}
        validate={problemOf}
        afterSave={async (saved) => {
          // Tối đa MỘT gói phổ biến: bật ở gói này thì tắt nhãn ở gói khác.
          if (!saved.popular) return
          await Promise.all(
            plans
              .filter((plan) => plan.id !== saved.id && plan.popular)
              .map((plan) => save.mutateAsync({ ...plan, popular: false }))
          )
        }}
        renderView={(plan) => {
          const gift = giftOf(plan.giftId)
          return (
            <Descriptions
              size='small'
              column={1}
              bordered
              items={[
                { key: 'name', label: t('plans.name'), children: plan.name },
                { key: 'code', label: t('plans.code'), children: <Text code>{plan.code}</Text> },
                { key: 'short', label: t('plans.shortLabel'), children: plan.shortLabel || '-' },
                { key: 'popular', label: t('plans.popular'), children: plan.popular ? t('plans.yes') : t('plans.no') },
                { key: 'price', label: t('plans.price'), children: formatCurrency(plan.price, locale) },
                { key: 'fit', label: t('plans.fitLine'), children: plan.fitLine },
                {
                  key: 'image',
                  label: t('plans.image'),
                  children: plan.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={plan.imageUrl} alt='' width={160} style={{ borderRadius: 8 }} />
                  ) : (
                    '-'
                  )
                },
                { key: 'cta', label: t('plans.ctaLabel'), children: plan.ctaLabel },
                { key: 'status', label: t('plans.status'), children: t(`planStatus.${plan.status}`) },
                { key: 'design', label: t('plans.designCredits'), children: plan.designCredits },
                { key: 'library', label: t('plans.libraryCredits'), children: plan.libraryCredits },
                {
                  key: 'highlights',
                  label: t('plans.highlights'),
                  children: (
                    <Space size={4} wrap>
                      {plan.highlights.map((key) => (
                        <Tag key={key}>{labelOf(key)}</Tag>
                      ))}
                    </Space>
                  )
                },
                {
                  key: 'benefits',
                  label: t('plans.benefits'),
                  children: (
                    <ul className='m-0 list-disc pl-4'>
                      {PLAN_TOGGLE_KEYS.map((key) => (
                        <li key={key}>
                          {tRows(key)}:{' '}
                          {plan.benefits.toggles[key].enabled
                            ? plan.benefits.toggles[key].text || t('plans.on')
                            : t('plans.off')}
                        </li>
                      ))}
                      {(Object.keys(LEVELS) as LevelKey[]).map((key) => (
                        <li key={key}>
                          {tRows(key)}:{' '}
                          {plan.benefits[key].level === 'custom'
                            ? plan.benefits[key].text
                            : levelLabel(key, plan.benefits[key].level)}
                        </li>
                      ))}
                    </ul>
                  )
                },
                { key: 'gift', label: t('plans.gift'), children: gift ? gift.title : t('plans.noGift') },
                { key: 'giftCond', label: t('plans.giftConditions'), children: plan.giftConditions || '-' }
              ]}
            />
          )
        }}
        columns={[
          {
            title: t('plans.name'),
            dataIndex: 'name',
            render: (_, record) => (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {record.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={record.imageUrl}
                    alt=''
                    width={52}
                    height={36}
                    style={{ objectFit: 'cover', borderRadius: 6 }}
                  />
                ) : null}
                <div>
                  <Text strong style={{ display: 'block' }}>
                    {record.name} {record.popular ? <Tag color='orange'>{t('plans.popularTag')}</Tag> : null}
                  </Text>
                  <Text type='secondary' style={{ fontSize: 12 }}>
                    {record.code}
                  </Text>
                </div>
              </div>
            )
          },
          {
            title: t('plans.price'),
            dataIndex: 'price',
            width: 140,
            render: (price: number) => formatCurrency(price, locale)
          },
          { title: t('plans.designCredits'), dataIndex: 'designCredits', width: 130 },
          { title: t('plans.libraryCredits'), dataIndex: 'libraryCredits', width: 130 },
          {
            title: t('plans.gift'),
            dataIndex: 'giftId',
            width: 200,
            render: (id: string | null) => giftOf(id)?.title ?? <Text type='secondary'>{t('plans.noGift')}</Text>
          },
          {
            title: t('plans.status'),
            dataIndex: 'status',
            width: 120,
            render: (status: SubscriptionPlan['status']) => (
              <Tag color={status === 'selling' ? 'green' : 'default'}>{t(`planStatus.${status}`)}</Tag>
            )
          }
        ]}
        renderForm={(form) => <PlanFields form={form} hasOrders={hasOrders} />}
      />
    </div>
  )
}

/** Chu kỳ sử dụng DÙNG CHUNG của mọi gói (§4) — snapshot vào đơn khi tạo đơn. */
function PeriodSettings() {
  const t = useTranslations('admin')
  const { message } = App.useApp()
  const { data } = useAdminDocument('planSettings')
  const save = useSaveAdminDocument('planSettings')
  const [draft, setDraft] = useState<number | null>(null)
  const value = draft ?? data?.periodDays ?? null

  return (
    <Card title={t('plans.periodTitle')}>
      <Space wrap align='start'>
        <InputNumber
          min={1}
          precision={0}
          value={value}
          onChange={(next) => setDraft(next)}
          suffix={t('plans.days')}
          style={{ width: 200 }}
        />
        <Button
          type='primary'
          disabled={!draft || draft === data?.periodDays}
          loading={save.isPending}
          onClick={async () => {
            if (!draft || draft < 1) return
            await save.mutateAsync({ periodDays: draft })
            setDraft(null)
            message.success(t('feedback.saved'))
          }}
        >
          {t('actions.save')}
        </Button>
        <Button disabled={draft === null} onClick={() => setDraft(null)}>
          {t('actions.cancel')}
        </Button>
      </Space>
      <Text type='secondary' style={{ display: 'block', marginTop: 8, fontSize: 12 }}>
        {t('plans.periodHint', { days: data?.periodDays ?? 90 })}
      </Text>
    </Card>
  )
}

function PlanFields({ form, hasOrders }: { form: FormInstance; hasOrders: (plan: SubscriptionPlan) => boolean }) {
  const t = useTranslations('admin')
  const tRows = useTranslations('plans.comparison.rows')
  const { data: gifts = [] } = useAdminCollection('gifts')
  const current = form.getFieldsValue(true) as SubscriptionPlan
  const giftId = Form.useWatch('giftId', form) as string | null | undefined
  const benefits = Form.useWatch('benefits', form) as PlanBenefits | undefined
  const currentGift = gifts.find((gift) => gift.id === current.giftId)
  const codeLocked = current.id ? hasOrders(current) : false
  const required = { required: true, whitespace: true, message: t('fields.requiredMessage') }

  const highlightOptions = [
    'designCredits',
    'libraryCredits',
    'layout',
    'interiorEstimate',
    'advisory',
    ...PLAN_TOGGLE_KEYS
  ].map((key) => ({
    value: key,
    label:
      key === 'designCredits'
        ? t('plans.designCredits')
        : key === 'libraryCredits'
          ? t('plans.libraryCredits')
          : tRows(key as Exclude<PlanHighlightKey, 'designCredits' | 'libraryCredits'>),
    disabled: benefits ? !isBenefitEnabled({ benefits }, key as PlanHighlightKey) : false
  }))

  return (
    <>
      <Text strong style={{ display: 'block', marginBottom: 12 }}>
        {t('plans.overviewSection')}
      </Text>
      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Form.Item
            name='name'
            label={t('plans.name')}
            rules={[required, { max: 100, message: t('fields.maxLength', { max: 100 }) }]}
          >
            <Input maxLength={100} />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item
            name='code'
            label={t('plans.code')}
            extra={codeLocked ? t('plans.codeLocked') : undefined}
            normalize={(value: string) => value.toUpperCase()}
            rules={[required, { pattern: CODE_PATTERN, message: t('plans.codeRule') }]}
          >
            <Input disabled={codeLocked} />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item
            name='shortLabel'
            label={t('plans.shortLabel')}
            rules={[{ max: 50, message: t('fields.maxLength', { max: 50 }) }]}
          >
            <Input maxLength={50} />
          </Form.Item>
        </Col>
        <Col xs={24} md={6}>
          <Form.Item name='popular' label={t('plans.popular')} valuePropName='checked' tooltip={t('plans.popularHint')}>
            <Switch />
          </Form.Item>
        </Col>
        <Col xs={24} md={6}>
          <Form.Item
            name='price'
            label={t('plans.price')}
            rules={[
              { required: true, message: t('fields.requiredMessage') },
              { type: 'integer', min: 1000, message: t('plans.priceRule') }
            ]}
          >
            <InputNumber min={1000} step={1000} precision={0} suffix='₫' style={{ width: '100%' }} />
          </Form.Item>
        </Col>
        <Col xs={24}>
          <Form.Item
            name='fitLine'
            label={t('plans.fitLine')}
            rules={[required, { max: 200, message: t('fields.maxLength', { max: 200 }) }]}
          >
            <Input.TextArea rows={2} maxLength={200} showCount />
          </Form.Item>
        </Col>
      </Row>
      <ImageUrlField form={form} name='imageUrl' label={t('plans.image')} required />
      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Form.Item
            name='ctaLabel'
            label={t('plans.ctaLabel')}
            rules={[required, { max: 50, message: t('fields.maxLength', { max: 50 }) }]}
          >
            <Input maxLength={50} />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name='status' label={t('plans.status')} extra={t('plans.statusHint')}>
            <Select
              options={(['selling', 'hidden'] as const).map((value) => ({ value, label: t(`planStatus.${value}`) }))}
            />
          </Form.Item>
        </Col>
        <Col xs={12}>
          <Form.Item
            name='designCredits'
            label={t('plans.designCredits')}
            rules={[{ required: true, type: 'integer', min: 1, message: t('plans.positiveInt') }]}
          >
            <InputNumber min={1} precision={0} style={{ width: '100%' }} />
          </Form.Item>
        </Col>
        <Col xs={12}>
          <Form.Item
            name='libraryCredits'
            label={t('plans.libraryCredits')}
            rules={[{ required: true, type: 'integer', min: 1, message: t('plans.positiveInt') }]}
          >
            <InputNumber min={1} precision={0} style={{ width: '100%' }} />
          </Form.Item>
        </Col>
      </Row>

      <Text strong style={{ display: 'block', margin: '8px 0 4px' }}>
        {t('plans.benefits')}
      </Text>
      <Text type='secondary' style={{ display: 'block', marginBottom: 12, fontSize: 12 }}>
        {t('plans.benefitsHint')}
      </Text>
      {PLAN_TOGGLE_GROUPS.map((group) => (
        <Card
          key={group.group}
          size='small'
          type='inner'
          title={t(`plans.groups.${group.group}`)}
          style={{ marginBottom: 12 }}
        >
          {group.keys.map((key) => {
            const enabled = benefits?.toggles?.[key]?.enabled ?? false
            return (
              <Row key={key} gutter={12} align='middle' style={{ marginBottom: 4 }}>
                <Col xs={24} md={9}>
                  <Space>
                    <Form.Item name={['benefits', 'toggles', key, 'enabled']} valuePropName='checked' noStyle>
                      <Switch size='small' />
                    </Form.Item>
                    <Text>{tRows(key)}</Text>
                  </Space>
                </Col>
                <Col xs={24} md={15}>
                  <Form.Item
                    name={['benefits', 'toggles', key, 'text']}
                    style={{ marginBottom: 8 }}
                    rules={[
                      { max: PLAN_BENEFIT_TEXT_MAX, message: t('fields.maxLength', { max: PLAN_BENEFIT_TEXT_MAX }) }
                    ]}
                  >
                    <Input
                      disabled={!enabled}
                      placeholder={t('plans.optionalText')}
                      maxLength={PLAN_BENEFIT_TEXT_MAX}
                    />
                  </Form.Item>
                </Col>
              </Row>
            )
          })}
          {group.group === 'design' ? (
            <>
              <LevelRow form={form} field='layout' />
              <LevelRow form={form} field='interiorEstimate' />
            </>
          ) : null}
          {group.group === 'support' ? <LevelRow form={form} field='advisory' /> : null}
        </Card>
      ))}

      <Form.Item name='highlights' label={t('plans.highlights')} extra={t('plans.highlightsHint')}>
        <Select mode='multiple' options={highlightOptions} />
      </Form.Item>

      <Text strong style={{ display: 'block', margin: '8px 0 12px' }}>
        {t('plans.giftSection')}
      </Text>
      {currentGift && currentGift.status !== 'active' ? (
        <Alert type='warning' showIcon style={{ marginBottom: 12 }} title={t('plans.giftHidden')} />
      ) : null}
      <Form.Item name='giftId' label={t('plans.gift')}>
        <Select
          allowClear
          placeholder={t('plans.noGift')}
          options={gifts
            .filter((gift) => gift.status === 'active')
            .map((gift) => ({ value: gift.id, label: gift.title }))}
        />
      </Form.Item>
      {giftId ? (
        <Form.Item
          name='giftConditions'
          label={t('plans.giftConditions')}
          rules={[required, { max: 500, message: t('fields.maxLength', { max: 500 }) }]}
        >
          <Input.TextArea rows={3} maxLength={500} showCount />
        </Form.Item>
      ) : null}
      <Text type='secondary' style={{ fontSize: 12 }}>
        {t('plans.snapshotNote')}
      </Text>
    </>
  )
}

/** Quyền lợi theo cấp độ: Không có / các cấp / Nội dung khác (≤ 200 ký tự). */
function LevelRow({ form, field }: { form: FormInstance; field: LevelKey }) {
  const levelLabel = useLevelLabel()
  const t = useTranslations('admin')
  const tRows = useTranslations('plans.comparison.rows')
  const level = Form.useWatch(['benefits', field, 'level'], form) as string | undefined

  return (
    <Row gutter={12} align='middle' style={{ marginBottom: 4 }}>
      <Col xs={24} md={9}>
        <Text>{tRows(field)}</Text>
      </Col>
      <Col xs={24} md={7}>
        <Form.Item name={['benefits', field, 'level']} style={{ marginBottom: 8 }}>
          <Select options={LEVELS[field].map((value) => ({ value, label: levelLabel(field, value) }))} />
        </Form.Item>
      </Col>
      <Col xs={24} md={8}>
        <Form.Item
          name={['benefits', field, 'text']}
          style={{ marginBottom: 8 }}
          rules={
            level === 'custom'
              ? [
                  { required: true, whitespace: true, message: t('fields.requiredMessage') },
                  { max: PLAN_BENEFIT_TEXT_MAX, message: t('fields.maxLength', { max: PLAN_BENEFIT_TEXT_MAX }) }
                ]
              : []
          }
        >
          <Input disabled={level !== 'custom'} placeholder={t('plans.customText')} maxLength={PLAN_BENEFIT_TEXT_MAX} />
        </Form.Item>
      </Col>
    </Row>
  )
}
