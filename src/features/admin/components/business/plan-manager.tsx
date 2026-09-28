'use client'

import { CloudUploadOutlined, StopOutlined } from '@ant-design/icons'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Alert,
  App,
  Button,
  Card,
  Checkbox,
  Col,
  Descriptions,
  Empty,
  Form,
  Image,
  Input,
  InputNumber,
  Row,
  Select,
  Space,
  Spin,
  Switch,
  Tag,
  Tooltip,
  Typography,
  type FormInstance
} from 'antd'
import { useLocale, useTranslations } from 'next-intl'
import { useState } from 'react'

import type { Locale } from '@/i18n/routing'
import { isApiError } from '@/shared/lib/api'
import { formatCurrency } from '@/shared/utils'
import { adminKeys } from '../../api/admin.keys'
import {
  bmtPlansApi,
  type BmtAdminPlanItem,
  type BmtBenefitDefinition,
  type BmtPlanDetail,
  type BmtPlanDraftContent,
  type BmtRevisionSummary,
  type BmtRevisionView,
  type PlanKind,
  type PlanOfferKey,
  type PlanQuotaCode,
  type PlanSaleState
} from '../../api/bmt/plans.api'
import { ApiResourceManager, type ApiRowContext } from '../common/api-resource-manager'
import { ImageUrlField } from '../common/field-kit'

const { Text, Paragraph } = Typography

/** Giới hạn độ dài theo validator của API (TDD-SUB-001/Notes). */
const CODE_MAX = 100
const NAME_MAX = 200
const DESCRIPTION_MAX = 4000
/** Giới hạn mềm cho các trường trình bày thẻ (phía client). */
const HIGHLIGHT_LABEL_MAX = 100
const GIFT_TEXT_MAX = 1000

const SALE_TAG: Record<PlanSaleState, string> = { NotPublished: 'default', OnSale: 'green', Stopped: 'red' }
const SALE_STATES: readonly PlanSaleState[] = ['NotPublished', 'OnSale', 'Stopped']

interface QuotaRow {
  code: PlanQuotaCode
  included: boolean
  monthUnlimited: boolean
  monthLimit: number | null
  yearUnlimited: boolean
  yearLimit: number | null
}

interface BenefitRow {
  code: string
  included: boolean
  enabled: boolean
  displayText: string
  sortOrder: number
}

interface PlanFormValues {
  expectedVersion?: number
  code?: string
  kind: PlanKind
  name: string
  description?: string
  consultationText?: string
  monthPrice?: number
  yearPrice?: number
  sitePrice?: number
  quotas?: QuotaRow[]
  benefits?: BenefitRow[]
  /** Năm trường trình bày thẻ gói — gửi phẳng trong thân request. */
  coverImageUrl?: string
  isHighlighted?: boolean
  highlightLabel?: string
  giftDescription?: string
  giftConditions?: string
}

const designDefinitions = (definitions: BmtBenefitDefinition[], kind: BmtBenefitDefinition['kind']) =>
  definitions.filter((item) => item.scope === 'Design' && item.kind === kind)

const priceOf = (revision: BmtRevisionView | null | undefined, key: PlanOfferKey) =>
  revision?.offers?.find((offer) => offer.offerKey === key)?.price

/** Bản nháp đang mở, nếu không có thì bản đang công bố — đây là nội dung sửa tiếp. */
const workingRevision = (plan: BmtPlanDetail) => plan.draft ?? plan.publishedRevision ?? null

/** Bản rút gọn để hiển thị trong bảng: ưu tiên bản công bố, không có thì bản nháp. */
const workingSummary = (plan: BmtAdminPlanItem): BmtRevisionSummary | null =>
  plan.publishedRevision ?? plan.draft ?? null

/** Dựng giá trị form từ một phiên bản (hoặc form trống khi tạo gói mới). */
function toValues(
  definitions: BmtBenefitDefinition[],
  kind: PlanKind,
  revision: BmtRevisionView | null,
  extra: Partial<PlanFormValues> = {}
): PlanFormValues {
  const month = revision?.offers?.find((offer) => offer.offerKey === 'Month')
  const year = revision?.offers?.find((offer) => offer.offerKey === 'Year')
  return {
    ...extra,
    kind,
    name: revision?.name ?? '',
    description: revision?.description ?? '',
    consultationText: revision?.consultationText ?? '',
    coverImageUrl: revision?.coverImageUrl ?? '',
    isHighlighted: revision?.isHighlighted ?? false,
    highlightLabel: revision?.highlightLabel ?? '',
    giftDescription: revision?.giftDescription ?? '',
    giftConditions: revision?.giftConditions ?? '',
    monthPrice: month?.price,
    yearPrice: year?.price,
    sitePrice: priceOf(revision, 'ConstructionSite'),
    quotas: designDefinitions(definitions, 'Quota').map((definition): QuotaRow => {
      const inMonth = month?.quotas?.find((quota) => quota.code === definition.code)
      const inYear = year?.quotas?.find((quota) => quota.code === definition.code)
      return {
        code: definition.code as PlanQuotaCode,
        included: Boolean(inMonth || inYear),
        monthUnlimited: inMonth?.isUnlimited ?? false,
        monthLimit: inMonth?.limit ?? null,
        yearUnlimited: inYear?.isUnlimited ?? false,
        yearLimit: inYear?.limit ?? null
      }
    }),
    benefits: designDefinitions(definitions, 'Boolean').map((definition, index): BenefitRow => {
      const current = revision?.displayBenefits?.find((benefit) => benefit.code === definition.code)
      return {
        code: definition.code,
        included: Boolean(current),
        enabled: current?.enabled ?? true,
        displayText: current?.displayText ?? definition.label,
        sortOrder: current?.sortOrder ?? index + 1
      }
    })
  }
}

/**
 * Form → nội dung bản nháp đúng `PlanApi.SaveDraftRequest`. Gói giám sát chỉ có
 * lựa chọn `ConstructionSite`, không quyền lợi, không nội dung tư vấn — API từ
 * chối mọi thứ khác (422 `PlanConfigurationInvalid`). Năm trường trình bày thẻ
 * đi PHẲNG cho cả hai loại gói (BE nhận chung).
 */
function toDraft(values: PlanFormValues): BmtPlanDraftContent {
  const card = {
    coverImageUrl: values.coverImageUrl?.trim() || null,
    isHighlighted: values.isHighlighted ?? false,
    highlightLabel: values.highlightLabel?.trim() || null,
    giftDescription: values.giftDescription?.trim() || null,
    giftConditions: values.giftConditions?.trim() || null
  }
  const base = { name: values.name.trim(), description: values.description?.trim() ?? '' }
  if (values.kind === 'Supervision') {
    return {
      ...base,
      consultationText: '',
      offers: [{ offerKey: 'ConstructionSite', price: values.sitePrice ?? 0, currency: 'VND' }],
      displayBenefits: [],
      ...card
    }
  }
  const included = (values.quotas ?? []).filter((row) => row.included)
  const quotasFor = (cycle: 'month' | 'year') =>
    included.map((row) => {
      const isUnlimited = cycle === 'month' ? row.monthUnlimited : row.yearUnlimited
      const limit = cycle === 'month' ? row.monthLimit : row.yearLimit
      return { code: row.code, isUnlimited, limit: isUnlimited ? null : limit }
    })
  return {
    ...base,
    consultationText: values.consultationText?.trim() ?? '',
    offers: [
      { offerKey: 'Month', price: values.monthPrice ?? 0, currency: 'VND', quotas: quotasFor('month') },
      { offerKey: 'Year', price: values.yearPrice ?? 0, currency: 'VND', quotas: quotasFor('year') }
    ],
    displayBenefits: (values.benefits ?? [])
      .filter((row) => row.included)
      .map((row) => ({
        code: row.code,
        enabled: row.enabled,
        displayText: row.displayText.trim(),
        sortOrder: row.sortOrder
      })),
    ...card
  }
}

/**
 * DANH MỤC GÓI BÁN — gói thiết kế (tháng / năm) và gói giám sát (theo công
 * trình) trên BMT API (STORY-SUB-002, TDD-SUB-001).
 *
 * Sửa gói là sửa BẢN NHÁP; website vẫn hiện bản đang công bố cho tới khi bấm
 * Công bố ở dòng của gói. Quyền lợi chọn từ danh mục hệ thống — không tự tạo
 * quyền mới. Ngừng bán chỉ chặn đơn mới, gói khách đã mua giữ nguyên.
 */
export function PlanManager() {
  const t = useTranslations('admin.bmtPlans')
  const tAdmin = useTranslations('admin')
  const { message, modal } = App.useApp()
  const queryClient = useQueryClient()
  const [kind, setKind] = useState<PlanKind | 'all'>('all')
  const [saleState, setSaleState] = useState<PlanSaleState | 'all'>('all')

  const definitionsQuery = useQuery({
    queryKey: adminKeys.bmt('benefit-definitions'),
    queryFn: bmtPlansApi.listBenefitDefinitions,
    staleTime: 5 * 60_000
  })
  const definitions = definitionsQuery.data ?? []
  const loadDefinitions = () =>
    queryClient.ensureQueryData({
      queryKey: adminKeys.bmt('benefit-definitions'),
      queryFn: bmtPlansApi.listBenefitDefinitions
    })

  const kindLabel = (value: PlanKind) => t(`kinds.${value}`)
  const errorText = (err: unknown) => (isApiError(err) ? err.message : tAdmin('feedback.apiError'))

  function confirmAction(plan: BmtAdminPlanItem, action: 'publish' | 'stop', ctx: ApiRowContext) {
    const name = workingSummary(plan)?.name || plan.code
    modal.confirm({
      title: action === 'publish' ? t('publishConfirmTitle', { name }) : t('stopConfirmTitle', { name }),
      content: action === 'publish' ? t('publishConfirmBody') : t('stopConfirmBody'),
      okText: action === 'publish' ? t('publish') : t('stopSelling'),
      okButtonProps: action === 'stop' ? { danger: true } : undefined,
      cancelText: tAdmin('actions.cancel'),
      onOk: async () => {
        try {
          if (action === 'publish') await bmtPlansApi.publish(plan.planId, plan.version)
          else await bmtPlansApi.stopSelling(plan.planId, plan.version)
          message.success(action === 'publish' ? t('published') : t('stopped'))
          await ctx.refresh()
        } catch (err) {
          message.error(errorText(err))
          await ctx.refresh()
        }
      }
    })
  }

  return (
    <ApiResourceManager<BmtAdminPlanItem>
      title={tAdmin('nav.planTable')}
      description={t('description')}
      queryKey={adminKeys.bmt('plans', kind, saleState)}
      fetchPage={({ pageIndex, pageSize }) =>
        bmtPlansApi.listForAdmin({
          kind: kind === 'all' ? undefined : kind,
          saleState: saleState === 'all' ? undefined : saleState,
          pageIndex,
          pageSize
        })
      }
      rowKey={(plan) => plan.planId}
      drawerWidth={820}
      banner={
        <Space wrap>
          <Select<PlanKind | 'all'>
            value={kind}
            onChange={setKind}
            style={{ minWidth: 200 }}
            options={[
              { value: 'all', label: t('allKinds') },
              { value: 'Design', label: kindLabel('Design') },
              { value: 'Supervision', label: kindLabel('Supervision') }
            ]}
          />
          <Select<PlanSaleState | 'all'>
            value={saleState}
            onChange={setSaleState}
            style={{ minWidth: 200 }}
            options={[
              { value: 'all', label: t('allSaleStates') },
              ...SALE_STATES.map((value) => ({ value, label: t(`saleStates.${value}`) }))
            ]}
          />
        </Space>
      }
      columns={[
        {
          title: t('name'),
          key: 'name',
          render: (_, plan) => {
            const summary = workingSummary(plan)
            return (
              <Space size={12}>
                {summary?.coverImageUrl ? (
                  <Image
                    src={summary.coverImageUrl}
                    alt=''
                    width={40}
                    height={30}
                    style={{ objectFit: 'cover', borderRadius: 6 }}
                    preview={false}
                  />
                ) : null}
                <div style={{ minWidth: 0 }}>
                  <Space size={6}>
                    <Text strong>{summary?.name || '—'}</Text>
                    {summary?.isHighlighted ? <Tag color='gold'>{t('highlightedBadge')}</Tag> : null}
                  </Space>
                  <Text type='secondary' style={{ display: 'block', fontSize: 12 }}>
                    {plan.code}
                  </Text>
                </div>
              </Space>
            )
          }
        },
        {
          title: t('kind'),
          dataIndex: 'kind',
          width: 130,
          render: (value: PlanKind) => <Tag color={value === 'Design' ? 'green' : 'purple'}>{kindLabel(value)}</Tag>
        },
        {
          title: t('saleState'),
          key: 'saleState',
          width: 200,
          render: (_, plan) => (
            <Space orientation='vertical' size={2}>
              <Tag color={SALE_TAG[plan.saleState]}>{t(`saleStates.${plan.saleState}`)}</Tag>
              {plan.draft ? (
                <Text type='warning' style={{ fontSize: 12 }}>
                  {t('hasDraft', { number: plan.draft.number })}
                </Text>
              ) : null}
            </Space>
          )
        },
        {
          title: t('revision'),
          key: 'revision',
          width: 150,
          render: (_, plan) =>
            plan.publishedRevision ? t('revisionNumber', { number: plan.publishedRevision.number }) : '—'
        }
      ]}
      rowActions={(plan, ctx) => (
        <>
          {plan.draft && plan.saleState !== 'Stopped' ? (
            <Tooltip title={t('publish')}>
              <Button
                type='text'
                size='small'
                icon={<CloudUploadOutlined />}
                aria-label={t('publish')}
                onClick={() => confirmAction(plan, 'publish', ctx)}
              />
            </Tooltip>
          ) : null}
          {plan.saleState === 'OnSale' ? (
            <Tooltip title={t('stopSelling')}>
              <Button
                type='text'
                size='small'
                danger
                icon={<StopOutlined />}
                aria-label={t('stopSelling')}
                onClick={() => confirmAction(plan, 'stop', ctx)}
              />
            </Tooltip>
          ) : null}
        </>
      )}
      renderView={(plan) => <PlanDetailView planId={plan.planId} />}
      createValues={() => toValues(definitions, 'Design', null) as unknown as Record<string, unknown>}
      onCreate={async (raw) => {
        const values = raw as unknown as PlanFormValues
        await bmtPlansApi.createPlan({ code: values.code?.trim() ?? '', kind: values.kind, ...toDraft(values) })
      }}
      toFormValues={async (plan) => {
        const [detail, defs] = await Promise.all([bmtPlansApi.getPlan(plan.planId), loadDefinitions()])
        return toValues(defs, detail.kind, workingRevision(detail), {
          expectedVersion: detail.version
        }) as unknown as Record<string, unknown>
      }}
      onUpdate={async (raw, plan) => {
        const values = raw as unknown as PlanFormValues
        await bmtPlansApi.saveDraft(plan.planId, {
          expectedVersion: values.expectedVersion ?? plan.version,
          ...toDraft({ ...values, kind: plan.kind })
        })
      }}
      renderForm={(form, { isNew, item }) => (
        <PlanFields
          form={form}
          isNew={isNew}
          plan={item}
          definitions={definitions}
          definitionsError={definitionsQuery.isError ? errorText(definitionsQuery.error) : null}
        />
      )}
    />
  )
}

/** Ngăn kéo xem chi tiết: đọc bản đầy đủ (offers + quyền lợi + trình bày) theo id. */
function PlanDetailView({ planId }: { planId: string }) {
  const t = useTranslations('admin.bmtPlans')
  const tAdmin = useTranslations('admin')
  const detailQuery = useQuery({
    queryKey: adminKeys.bmt('plan', planId),
    queryFn: () => bmtPlansApi.getPlan(planId)
  })

  if (detailQuery.isPending) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', padding: 48 }}>
        <Spin />
      </div>
    )
  }
  if (detailQuery.isError || !detailQuery.data) {
    return (
      <Alert
        type='error'
        showIcon
        title={isApiError(detailQuery.error) ? detailQuery.error.message : tAdmin('feedback.apiError')}
      />
    )
  }

  const plan = detailQuery.data
  return (
    <Space orientation='vertical' size={16} style={{ width: '100%' }}>
      <Descriptions
        size='small'
        column={1}
        bordered
        items={[
          { key: 'code', label: t('code'), children: <Text code>{plan.code}</Text> },
          { key: 'id', label: t('planId'), children: <Text copyable>{plan.planId}</Text> },
          { key: 'kind', label: t('kind'), children: t(`kinds.${plan.kind}`) },
          {
            key: 'state',
            label: t('saleState'),
            children: <Tag color={SALE_TAG[plan.saleState]}>{t(`saleStates.${plan.saleState}`)}</Tag>
          }
        ]}
      />
      <RevisionBlock title={t('publishedBlock')} plan={plan} revision={plan.publishedRevision} />
      <RevisionBlock title={t('draftBlock')} plan={plan} revision={plan.draft} />
    </Space>
  )
}

/** Một phiên bản (đang công bố hoặc nháp) ở ngăn kéo xem chi tiết. */
function RevisionBlock({
  title,
  plan,
  revision
}: {
  title: string
  plan: BmtPlanDetail
  revision: BmtRevisionView | null | undefined
}) {
  const t = useTranslations('admin.bmtPlans')
  const locale = useLocale() as Locale
  if (!revision) {
    return (
      <Card size='small' title={title}>
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('noRevision')} />
      </Card>
    )
  }
  const quotaText = (quota: { isUnlimited: boolean; limit?: number | null }) =>
    quota.isUnlimited ? t('unlimited') : t('limitValue', { limit: quota.limit ?? 0 })

  return (
    <Card size='small' title={`${title} · ${t('revisionNumber', { number: revision.number })}`}>
      <Descriptions
        size='small'
        column={1}
        items={[
          { key: 'name', label: t('name'), children: revision.name || '—' },
          {
            key: 'description',
            label: plan.kind === 'Supervision' ? t('serviceDescription') : t('descriptionField'),
            children: revision.description ? (
              <Paragraph style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{revision.description}</Paragraph>
            ) : (
              '—'
            )
          },
          ...(plan.kind === 'Design'
            ? [
                {
                  key: 'consultation',
                  label: t('consultationText'),
                  children: revision.consultationText ? (
                    <Paragraph style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{revision.consultationText}</Paragraph>
                  ) : (
                    '—'
                  )
                }
              ]
            : []),
          {
            key: 'offers',
            label: t('offers'),
            children: (
              <ul className='m-0 list-disc pl-4'>
                {(revision.offers ?? []).map((offer) => (
                  <li key={offer.offerKey}>
                    <Text strong>{t(`offerKeys.${offer.offerKey}`)}</Text>: {formatCurrency(offer.price, locale)}
                    {offer.quotas?.length ? (
                      <ul className='m-0 pl-4'>
                        {offer.quotas.map((quota) => (
                          <li key={quota.code}>
                            {quota.label || quota.code}: {quotaText(quota)}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </li>
                ))}
              </ul>
            )
          },
          ...(plan.kind === 'Design'
            ? [
                {
                  key: 'benefits',
                  label: t('displayBenefits'),
                  children: revision.displayBenefits?.length ? (
                    <Space size={4} wrap>
                      {[...revision.displayBenefits]
                        .sort((a, b) => a.sortOrder - b.sortOrder)
                        .map((benefit) => (
                          <Tag key={benefit.code} color={benefit.enabled ? 'green' : 'default'}>
                            {benefit.displayText || benefit.label} · {benefit.enabled ? t('on') : t('off')}
                          </Tag>
                        ))}
                    </Space>
                  ) : (
                    t('noBenefits')
                  )
                }
              ]
            : []),
          {
            key: 'highlight',
            label: t('isHighlighted'),
            children: revision.isHighlighted ? (
              <Space size={6}>
                <Tag color='gold'>{t('highlightedBadge')}</Tag>
                {revision.highlightLabel ? <Text>{revision.highlightLabel}</Text> : null}
              </Space>
            ) : (
              t('off')
            )
          },
          ...(revision.coverImageUrl
            ? [
                {
                  key: 'cover',
                  label: t('coverImage'),
                  children: <Image src={revision.coverImageUrl} alt='' width={120} style={{ borderRadius: 8 }} />
                }
              ]
            : []),
          ...(revision.giftDescription || revision.giftConditions
            ? [
                {
                  key: 'gift',
                  label: t('giftDescription'),
                  children: (
                    <div>
                      {revision.giftDescription ? (
                        <Paragraph style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{revision.giftDescription}</Paragraph>
                      ) : null}
                      {revision.giftConditions ? (
                        <Text type='secondary' style={{ whiteSpace: 'pre-wrap' }}>
                          {t('giftConditions')}: {revision.giftConditions}
                        </Text>
                      ) : null}
                    </div>
                  )
                }
              ]
            : [])
        ]}
      />
    </Card>
  )
}

function PlanFields({
  form,
  isNew,
  plan,
  definitions,
  definitionsError
}: {
  form: FormInstance
  isNew: boolean
  plan: BmtAdminPlanItem | null
  definitions: BmtBenefitDefinition[]
  definitionsError: string | null
}) {
  const t = useTranslations('admin.bmtPlans')
  const tAdmin = useTranslations('admin')
  const watchedKind = Form.useWatch('kind', form) as PlanKind | undefined
  const kind = plan?.kind ?? watchedKind ?? 'Design'
  const quotas = (Form.useWatch('quotas', form) as QuotaRow[] | undefined) ?? []
  const benefits = (Form.useWatch('benefits', form) as BenefitRow[] | undefined) ?? []
  const required = { required: true, whitespace: true, message: tAdmin('fields.requiredMessage') }
  const labelOf = (code: string) => definitions.find((item) => item.code === code)?.label ?? code
  const priceRules = [{ required: true, type: 'integer' as const, min: 1, message: t('priceRule') }]

  return (
    <>
      <Form.Item name='expectedVersion' hidden>
        <InputNumber />
      </Form.Item>
      {plan?.saleState === 'Stopped' ? (
        <Alert type='warning' showIcon style={{ marginBottom: 12 }} title={t('stoppedNote')} />
      ) : null}
      {!isNew ? <Alert type='info' showIcon style={{ marginBottom: 12 }} title={t('draftNote')} /> : null}

      <Row gutter={16}>
        <Col xs={24} md={12}>
          {isNew ? (
            <Form.Item
              name='code'
              label={t('code')}
              extra={t('codeHint')}
              rules={[required, { max: CODE_MAX, message: tAdmin('fields.maxLength', { max: CODE_MAX }) }]}
            >
              <Input maxLength={CODE_MAX} />
            </Form.Item>
          ) : (
            <Form.Item label={t('code')}>
              <Input value={plan?.code} disabled />
            </Form.Item>
          )}
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name='kind' label={t('kind')} extra={isNew ? t('kindHint') : undefined}>
            <Select
              disabled={!isNew}
              options={(['Design', 'Supervision'] as const).map((value) => ({ value, label: t(`kinds.${value}`) }))}
            />
          </Form.Item>
        </Col>
        <Col xs={24}>
          <Form.Item
            name='name'
            label={t('name')}
            rules={[required, { max: NAME_MAX, message: tAdmin('fields.maxLength', { max: NAME_MAX }) }]}
          >
            <Input maxLength={NAME_MAX} />
          </Form.Item>
        </Col>
        <Col xs={24}>
          <Form.Item
            name='description'
            label={kind === 'Supervision' ? t('serviceDescription') : t('descriptionField')}
            extra={kind === 'Supervision' ? t('serviceDescriptionHint') : undefined}
            rules={[{ max: DESCRIPTION_MAX, message: tAdmin('fields.maxLength', { max: DESCRIPTION_MAX }) }]}
          >
            <Input.TextArea rows={4} maxLength={DESCRIPTION_MAX} showCount />
          </Form.Item>
        </Col>
        {kind === 'Design' ? (
          <Col xs={24}>
            <Form.Item name='consultationText' label={t('consultationText')} extra={t('consultationHint')}>
              <Input.TextArea rows={2} />
            </Form.Item>
          </Col>
        ) : null}
      </Row>

      <Text strong style={{ display: 'block', margin: '8px 0 12px' }}>
        {t('offers')}
      </Text>
      {kind === 'Supervision' ? (
        <Form.Item name='sitePrice' label={t('offerKeys.ConstructionSite')} rules={priceRules}>
          <InputNumber min={1} step={100_000} precision={0} suffix='₫' style={{ width: '100%' }} />
        </Form.Item>
      ) : (
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item name='monthPrice' label={t('offerKeys.Month')} rules={priceRules}>
              <InputNumber min={1} step={1000} precision={0} suffix='₫' style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name='yearPrice' label={t('offerKeys.Year')} rules={priceRules}>
              <InputNumber min={1} step={1000} precision={0} suffix='₫' style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>
      )}

      {kind === 'Design' ? (
        <>
          {definitionsError ? (
            <Alert type='error' showIcon style={{ marginBottom: 12 }} title={definitionsError} />
          ) : null}

          <Text strong style={{ display: 'block', margin: '8px 0 4px' }}>
            {t('quotaSection')}
          </Text>
          <Text type='secondary' style={{ display: 'block', marginBottom: 12, fontSize: 12 }}>
            {t('quotaHint')}
          </Text>
          {quotas.map((row, index) => (
            <Card key={row.code} size='small' type='inner' style={{ marginBottom: 12 }}>
              <Form.Item name={['quotas', index, 'code']} hidden>
                <Input />
              </Form.Item>
              <Form.Item name={['quotas', index, 'included']} valuePropName='checked' style={{ marginBottom: 8 }}>
                <Checkbox>
                  <Text strong>{labelOf(row.code)}</Text>
                </Checkbox>
              </Form.Item>
              {row.included ? (
                <Row gutter={16}>
                  {(['month', 'year'] as const).map((cycle) => {
                    const unlimited = cycle === 'month' ? row.monthUnlimited : row.yearUnlimited
                    return (
                      <Col xs={24} md={12} key={cycle}>
                        <Text type='secondary' style={{ display: 'block', marginBottom: 4 }}>
                          {t(cycle === 'month' ? 'offerKeys.Month' : 'offerKeys.Year')}
                        </Text>
                        <Space align='start'>
                          <Form.Item
                            name={['quotas', index, `${cycle}Unlimited`]}
                            valuePropName='checked'
                            style={{ marginBottom: 8 }}
                          >
                            <Switch checkedChildren={t('unlimited')} unCheckedChildren={t('limited')} />
                          </Form.Item>
                          <Form.Item
                            name={['quotas', index, `${cycle}Limit`]}
                            style={{ marginBottom: 8 }}
                            rules={
                              unlimited ? [] : [{ required: true, type: 'integer', min: 1, message: t('limitRule') }]
                            }
                          >
                            <InputNumber
                              min={1}
                              precision={0}
                              disabled={unlimited}
                              placeholder={t('limitPlaceholder')}
                              style={{ width: 140 }}
                            />
                          </Form.Item>
                        </Space>
                      </Col>
                    )
                  })}
                </Row>
              ) : null}
            </Card>
          ))}

          <Text strong style={{ display: 'block', margin: '8px 0 4px' }}>
            {t('displayBenefits')}
          </Text>
          <Text type='secondary' style={{ display: 'block', marginBottom: 12, fontSize: 12 }}>
            {t('displayBenefitsHint')}
          </Text>
          {benefits.length === 0 ? (
            <Text type='secondary' style={{ display: 'block', marginBottom: 12 }}>
              {t('noBooleanDefinitions')}
            </Text>
          ) : null}
          {benefits.map((row, index) => (
            <Card key={row.code} size='small' type='inner' style={{ marginBottom: 12 }}>
              <Form.Item name={['benefits', index, 'code']} hidden>
                <Input />
              </Form.Item>
              <Form.Item name={['benefits', index, 'included']} valuePropName='checked' style={{ marginBottom: 8 }}>
                <Checkbox>
                  <Text strong>{labelOf(row.code)}</Text>
                </Checkbox>
              </Form.Item>
              {row.included ? (
                <Row gutter={12} align='middle'>
                  <Col xs={24} md={5}>
                    <Form.Item
                      name={['benefits', index, 'enabled']}
                      valuePropName='checked'
                      style={{ marginBottom: 8 }}
                    >
                      <Switch checkedChildren={t('on')} unCheckedChildren={t('off')} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={13}>
                    <Form.Item name={['benefits', index, 'displayText']} style={{ marginBottom: 8 }} rules={[required]}>
                      <Input placeholder={t('displayText')} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={6}>
                    <Form.Item
                      name={['benefits', index, 'sortOrder']}
                      style={{ marginBottom: 8 }}
                      rules={[{ required: true, type: 'integer', message: t('sortOrderRule') }]}
                    >
                      <InputNumber precision={0} prefix='#' style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                </Row>
              ) : null}
            </Card>
          ))}
        </>
      ) : (
        <Text type='secondary' style={{ display: 'block', fontSize: 12 }}>
          {t('supervisionNote')}
        </Text>
      )}

      <Text strong style={{ display: 'block', margin: '20px 0 4px' }}>
        {t('cardSection')}
      </Text>
      <Text type='secondary' style={{ display: 'block', marginBottom: 12, fontSize: 12 }}>
        {t('cardNote')}
      </Text>
      <ImageUrlField form={form} name='coverImageUrl' label={t('coverImage')} />
      <Text type='secondary' style={{ display: 'block', marginTop: -8, marginBottom: 16, fontSize: 12 }}>
        {t('coverImageHint')}
      </Text>
      <Row gutter={16}>
        <Col xs={24} md={8}>
          <Form.Item name='isHighlighted' label={t('isHighlighted')} valuePropName='checked'>
            <Switch />
          </Form.Item>
        </Col>
        <Col xs={24} md={16}>
          <Form.Item
            name='highlightLabel'
            label={t('highlightLabel')}
            extra={t('highlightLabelHint')}
            rules={[{ max: HIGHLIGHT_LABEL_MAX, message: tAdmin('fields.maxLength', { max: HIGHLIGHT_LABEL_MAX }) }]}
          >
            <Input maxLength={HIGHLIGHT_LABEL_MAX} />
          </Form.Item>
        </Col>
        <Col xs={24}>
          <Form.Item
            name='giftDescription'
            label={t('giftDescription')}
            rules={[{ max: GIFT_TEXT_MAX, message: tAdmin('fields.maxLength', { max: GIFT_TEXT_MAX }) }]}
          >
            <Input.TextArea rows={2} maxLength={GIFT_TEXT_MAX} showCount />
          </Form.Item>
        </Col>
        <Col xs={24}>
          <Form.Item
            name='giftConditions'
            label={t('giftConditions')}
            rules={[{ max: GIFT_TEXT_MAX, message: tAdmin('fields.maxLength', { max: GIFT_TEXT_MAX }) }]}
          >
            <Input.TextArea rows={2} maxLength={GIFT_TEXT_MAX} showCount />
          </Form.Item>
        </Col>
      </Row>

      <Text type='secondary' style={{ display: 'block', marginTop: 8, fontSize: 12 }}>
        {t('snapshotNote')}
      </Text>
    </>
  )
}
