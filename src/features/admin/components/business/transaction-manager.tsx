'use client'

import { useQuery } from '@tanstack/react-query'
import { Alert, Descriptions, Input, Select, Space, Spin, Tag, Typography } from 'antd'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

import { isApiError } from '@/shared/lib/api'
import { adminKeys } from '../../api/admin.keys'
import {
  bmtCommerceApi,
  type BankMatchState,
  type BankProcessingState,
  type BmtAdminBankTransactionSummary
} from '../../api/bmt/commerce.api'
import { ApiResourceManager } from '../common/api-resource-manager'
import {
  DateRangeFilter,
  MATCH_STATE_TAG,
  PROCESSING_STATE_TAG,
  rangeToUtc,
  stamp,
  useVnd,
  type DateRange
} from '../ops/commerce-kit'

const { Text, Paragraph } = Typography

const MATCH_STATES: BankMatchState[] = ['Pending', 'Matched', 'Unmatched', 'IgnoredDirection', 'ConnectionMismatch']
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * SỔ GIAO DỊCH NGÂN HÀNG — mọi giao dịch SePay backend đã tiếp nhận, CHỈ ĐỌC
 * (STORY-PAY-002, TDD-PAY-002). Kể cả giao dịch chưa khớp đơn ("Chưa xác định
 * đơn"). Không có thao tác gán tay giao dịch vào đơn.
 *
 * Nội dung chuyển khoản là chữ do ngân hàng gửi — luôn in dạng text, không bao
 * giờ render HTML.
 */
export function TransactionManager() {
  const t = useTranslations('admin.bmtCommerce')
  const tAdmin = useTranslations('admin')
  const vnd = useVnd()
  const searchParams = useSearchParams()
  const initialOrder = searchParams.get('orderId') ?? ''
  const [matchState, setMatchState] = useState<BankMatchState | 'all'>('all')
  const [providerTransactionId, setProviderTransactionId] = useState('')
  const [orderId] = useState(UUID_PATTERN.test(initialOrder) ? initialOrder : '')
  const [range, setRange] = useState<DateRange>(null)
  const filters = {
    matchState: matchState === 'all' ? undefined : matchState,
    providerTransactionId: providerTransactionId || undefined,
    orderId: orderId || undefined,
    ...rangeToUtc(range)
  }

  return (
    <ApiResourceManager<BmtAdminBankTransactionSummary>
      title={tAdmin('nav.transactions')}
      description={t('transactionsDescription')}
      queryKey={adminKeys.bmt('bank-transactions', filters)}
      fetchPage={({ pageIndex, pageSize }) => bmtCommerceApi.listBankTransactions({ pageIndex, pageSize, ...filters })}
      rowKey={(item) => item.id}
      drawerWidth={680}
      banner={
        <Space orientation='vertical' size={12}>
          {orderId ? <Alert type='info' showIcon title={t('filteredByOrder', { orderId })} /> : null}
          <Space wrap>
            <Select<BankMatchState | 'all'>
              value={matchState}
              onChange={setMatchState}
              style={{ minWidth: 200 }}
              options={[
                { value: 'all', label: t('allMatchStates') },
                ...MATCH_STATES.map((value) => ({ value, label: t(`matchStates.${value}`) }))
              ]}
            />
            <Input.Search
              allowClear
              placeholder={t('providerIdPlaceholder')}
              onSearch={(value) => setProviderTransactionId(value.trim())}
              style={{ width: 220 }}
            />
            <DateRangeFilter
              value={range}
              onChange={setRange}
              fromLabel={t('occurredFrom')}
              toLabel={t('occurredTo')}
            />
          </Space>
        </Space>
      }
      columns={[
        {
          title: t('occurredAt'),
          dataIndex: 'occurredAtUtc',
          width: 150,
          render: (value: string) => stamp(value)
        },
        {
          title: t('providerId'),
          dataIndex: 'providerTransactionId',
          width: 120,
          render: (value: number) => <Text code>{value}</Text>
        },
        {
          title: t('amount'),
          dataIndex: 'amountVnd',
          width: 150,
          align: 'right' as const,
          render: (value: string, item) => (
            <Text strong type={item.direction === 'out' ? 'danger' : undefined}>
              {item.direction === 'out' ? '−' : '+'}
              {vnd(value)}
            </Text>
          )
        },
        {
          title: t('transferContent'),
          dataIndex: 'content',
          width: 280,
          // Chuỗi ngân hàng gửi — React in dạng chữ, không bao giờ dangerouslySetInnerHTML.
          render: (value: string, item) => (
            <div style={{ maxWidth: 280 }}>
              <Text ellipsis={{ tooltip: value }}>{value}</Text>
              {item.code ? (
                <Text type='secondary' style={{ display: 'block', fontSize: 12 }}>
                  {t('codeLine', { code: item.code })}
                </Text>
              ) : null}
            </div>
          )
        },
        {
          title: t('matchState'),
          dataIndex: 'matchState',
          width: 170,
          render: (value: BankMatchState, item) => (
            <Space orientation='vertical' size={2}>
              <Tag color={MATCH_STATE_TAG[value]}>{t(`matchStates.${value}`)}</Tag>
              {item.matchLabel ? (
                <Text type='secondary' style={{ fontSize: 12 }}>
                  {item.matchLabel}
                </Text>
              ) : null}
            </Space>
          )
        },
        {
          title: t('buyer'),
          key: 'buyer',
          render: (_, item) =>
            item.buyerDisplayName || item.buyerEmail ? (
              <div style={{ minWidth: 0 }}>
                <Text strong style={{ display: 'block' }}>
                  {item.buyerDisplayName || '—'}
                </Text>
                <Text type='secondary' style={{ fontSize: 12 }}>
                  {item.buyerEmail || '—'}
                </Text>
              </div>
            ) : (
              <Text type='secondary'>{t('unknownBuyer')}</Text>
            )
        },
        {
          title: t('processingState'),
          dataIndex: 'processingState',
          width: 140,
          render: (value: BankProcessingState) => (
            <Tag color={PROCESSING_STATE_TAG[value]}>{t(`processingStates.${value}`)}</Tag>
          )
        }
      ]}
      renderView={(item) => <BankTransactionDetail transactionId={item.id} />}
    />
  )
}

function BankTransactionDetail({ transactionId }: { transactionId: string }) {
  const t = useTranslations('admin.bmtCommerce')
  const tAdmin = useTranslations('admin')
  const vnd = useVnd()
  const detail = useQuery({
    queryKey: adminKeys.bmt('bank-transactions', 'detail', transactionId),
    queryFn: () => bmtCommerceApi.getBankTransaction(transactionId)
  })

  if (detail.isPending) return <Spin />
  if (detail.isError) {
    return (
      <Alert
        type='error'
        showIcon
        title={isApiError(detail.error) ? detail.error.message : tAdmin('feedback.apiError')}
      />
    )
  }
  const item = detail.data

  return (
    <Descriptions
      size='small'
      column={1}
      bordered
      items={[
        { key: 'provider', label: t('providerId'), children: <Text code>{item.providerTransactionId}</Text> },
        { key: 'occurred', label: t('occurredAt'), children: stamp(item.occurredAtUtc) },
        { key: 'received', label: t('receivedAt'), children: stamp(item.receivedAtUtc) },
        {
          key: 'amount',
          label: t('amount'),
          children: (
            <Text strong>
              {item.direction === 'out' ? '−' : '+'}
              {vnd(item.amountVnd)}
            </Text>
          )
        },
        { key: 'direction', label: t('direction'), children: t(`directions.${item.direction}`) },
        {
          key: 'content',
          label: t('transferContent'),
          // In dạng chữ, giữ xuống dòng; không render HTML.
          children: <Paragraph style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{item.content}</Paragraph>
        },
        { key: 'code', label: t('code'), children: item.code || '—' },
        { key: 'reference', label: t('referenceCode'), children: item.referenceCode || '—' },
        { key: 'account', label: t('receivedAccount'), children: item.receivedAccountNumber },
        { key: 'gateway', label: t('receivedGateway'), children: item.receivedGateway },
        { key: 'sub', label: t('receivedSubAccount'), children: item.receivedSubAccount || '—' },
        {
          key: 'match',
          label: t('matchState'),
          children: (
            <Space size={4} wrap>
              <Tag color={MATCH_STATE_TAG[item.matchState]}>{t(`matchStates.${item.matchState}`)}</Tag>
              {item.matchLabel ? <Text type='secondary'>{item.matchLabel}</Text> : null}
            </Space>
          )
        },
        {
          key: 'processing',
          label: t('processingState'),
          children: (
            <Space size={4}>
              <Tag color={PROCESSING_STATE_TAG[item.processingState]}>
                {t(`processingStates.${item.processingState}`)}
              </Tag>
              <Text type='secondary'>{t('attempts', { count: item.attempts })}</Text>
            </Space>
          )
        },
        {
          key: 'order',
          label: t('paymentCode'),
          children: item.orderPaymentCode ? (
            <Text code copyable>
              {item.orderPaymentCode}
            </Text>
          ) : (
            '—'
          )
        },
        {
          key: 'buyer',
          label: t('buyer'),
          children:
            item.buyerDisplayName || item.buyerEmail
              ? [item.buyerDisplayName, item.buyerEmail].filter(Boolean).join(' · ')
              : t('unknownBuyer')
        }
      ]}
    />
  )
}
