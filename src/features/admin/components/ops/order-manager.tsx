'use client'

import { DatePicker, Descriptions, Select, Space, Table, Tag, Typography } from 'antd'
import dayjs, { type Dayjs } from 'dayjs'
import { useSearchParams } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { useState } from 'react'

import type { Locale } from '@/i18n/routing'
import type { CmsOrder, CmsOrderKind, CmsOrderStatus, CmsTransaction } from '@/shared/cms'
import { formatCurrency } from '@/shared/utils'
import { useAdminCollection } from '../../hooks/use-admin-data'
import { ResourceManager } from '../common/resource-manager'
import { useProductLabel } from './use-product-label'

const { Text } = Typography

/** Sáu trạng thái thanh toán của spec — "Chờ thanh toán" gộp `awaiting` và `verifying`. */
type PaymentState = 'pending' | 'paid' | 'failed' | 'expired' | 'cancelled' | 'refunded'

const PAYMENT_STATES: PaymentState[] = ['pending', 'paid', 'failed', 'expired', 'cancelled', 'refunded']

const STATE_TAG: Record<PaymentState, string> = {
  pending: 'gold',
  paid: 'green',
  failed: 'red',
  expired: 'default',
  cancelled: 'default',
  refunded: 'blue'
}

function paymentState(status: CmsOrderStatus): PaymentState {
  return status === 'awaiting' || status === 'verifying' ? 'pending' : status
}

function stamp(value?: string): string {
  return value ? dayjs(value).format('DD/MM/YYYY HH:mm') : '-'
}

/**
 * ĐƠN MUA GÓI (epic OrderManagement) — TRA CỨU, chỉ đọc.
 *
 * Giá, mã giảm giá, tổng tiền và trạng thái thanh toán do backend xác định và
 * snapshot lúc tạo đơn; admin không tạo, sửa, xóa đơn, không đổi trạng thái
 * thanh toán và không kích hoạt gói thủ công. Chi tiết đơn hiện snapshot gói,
 * thông tin thanh toán và mọi giao dịch thuộc đơn.
 */
export function OrderManager() {
  const t = useTranslations('admin')
  const locale = useLocale() as Locale
  const productLabel = useProductLabel()
  const searchParams = useSearchParams()

  const { data: orders = [] } = useAdminCollection('orders')
  const { data: transactions = [] } = useAdminCollection('transactions')

  const [kind, setKind] = useState<'all' | CmsOrderKind>('all')
  const [product, setProduct] = useState<string>('all')
  const [state, setState] = useState<'all' | PaymentState>('all')
  const [range, setRange] = useState<[Dayjs | null, Dayjs | null] | null>(null)

  const productOptions = [...new Map(orders.map((order) => [order.product.id, order.product])).values()].map(
    (item) => ({ value: item.id, label: productLabel(item.kind, item.id) })
  )
  const money = (value: number) => formatCurrency(value, locale)
  const nameOf = (order: CmsOrder) => productLabel(order.product.kind, order.product.id)

  const matches = (order: CmsOrder) => {
    if (kind !== 'all' && order.product.kind !== kind) return false
    if (product !== 'all' && order.product.id !== product) return false
    if (state !== 'all' && paymentState(order.status) !== state) return false
    const [from, to] = range ?? [null, null]
    const created = dayjs(order.createdAt)
    if (from && created.isBefore(from.startOf('day'))) return false
    if (to && created.isAfter(to.endOf('day'))) return false
    return true
  }

  const stateTag = (status: CmsOrderStatus) => {
    const value = paymentState(status)
    return (
      <Space orientation='vertical' size={2}>
        <Tag color={STATE_TAG[value]}>{t(`orderPayment.${value}`)}</Tag>
        {status === 'verifying' ? (
          <Text type='secondary' style={{ fontSize: 12 }}>
            {t('orders.customerReportedTransfer')}
          </Text>
        ) : null}
      </Space>
    )
  }

  return (
    <ResourceManager
      collection='orders'
      title={t('nav.orders')}
      description={t('orders.description')}
      allowDelete={false}
      allowEdit={false}
      drawerWidth={680}
      initialViewId={searchParams.get('order')}
      searchText={(item) => `${item.id} ${item.buyer.name} ${item.buyer.email} ${item.buyer.phone} ${nameOf(item)}`}
      filterItems={matches}
      filterKey={`${kind}|${product}|${state}|${range?.[0]?.valueOf() ?? ''}|${range?.[1]?.valueOf() ?? ''}`}
      banner={
        <Space wrap>
          <Select<'all' | CmsOrderKind>
            value={kind}
            onChange={setKind}
            style={{ minWidth: 170 }}
            options={[
              { value: 'all', label: t('orders.allKinds') },
              { value: 'design', label: t('customers.packageKinds.design') },
              { value: 'supervision', label: t('customers.packageKinds.supervision') }
            ]}
          />
          <Select
            value={product}
            onChange={setProduct}
            style={{ minWidth: 170 }}
            options={[{ value: 'all', label: t('orders.allPlans') }, ...productOptions]}
          />
          <Select<'all' | PaymentState>
            value={state}
            onChange={setState}
            style={{ minWidth: 190 }}
            options={[
              { value: 'all', label: t('orders.allStates') },
              ...PAYMENT_STATES.map((value) => ({ value, label: t(`orderPayment.${value}`) }))
            ]}
          />
          <DatePicker.RangePicker
            value={range}
            onChange={(value) => setRange(value as [Dayjs | null, Dayjs | null] | null)}
            format='DD/MM/YYYY'
            allowEmpty={[true, true]}
            placeholder={[t('orders.createdFrom'), t('orders.createdTo')]}
          />
        </Space>
      }
      columns={[
        {
          title: t('orders.code'),
          dataIndex: 'id',
          width: 120,
          render: (id: string) => <Text code>{id}</Text>
        },
        {
          title: t('orders.customer'),
          key: 'buyer',
          render: (_, record) => (
            <div style={{ minWidth: 0 }}>
              <Text strong style={{ display: 'block' }}>
                {record.buyer.name}
              </Text>
              <Text type='secondary' style={{ fontSize: 12 }}>
                {record.buyer.email} · {record.buyer.phone}
              </Text>
            </div>
          )
        },
        {
          title: t('customers.packageKind'),
          key: 'kind',
          width: 130,
          render: (_, record) => (
            <Tag color={record.product.kind === 'design' ? 'green' : 'purple'}>
              {t(`customers.packageKinds.${record.product.kind}`)}
            </Tag>
          )
        },
        { title: t('orders.planName'), key: 'plan', width: 130, render: (_, record) => nameOf(record) },
        {
          title: t('customers.subtotal'),
          dataIndex: 'subtotal',
          width: 130,
          align: 'right' as const,
          render: (value: number) => money(value)
        },
        {
          title: t('customers.discount'),
          dataIndex: 'discountAmount',
          width: 130,
          align: 'right' as const,
          render: (value: number) => (value ? `−${money(value)}` : '-')
        },
        {
          title: t('customers.total'),
          dataIndex: 'total',
          width: 140,
          align: 'right' as const,
          sorter: (a, b) => a.total - b.total,
          render: (value: number) => <Text strong>{money(value)}</Text>
        },
        {
          title: t('orders.status'),
          dataIndex: 'status',
          width: 190,
          render: (status: CmsOrderStatus) => stateTag(status)
        },
        {
          title: t('orders.createdAt'),
          dataIndex: 'createdAt',
          width: 150,
          sorter: (a, b) => a.createdAt.localeCompare(b.createdAt),
          defaultSortOrder: 'descend' as const,
          render: (value: string) => stamp(value)
        }
      ]}
      renderView={(order) => {
        const ownTransactions = transactions
          .filter((tx) => tx.orderId === order.id)
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        const snapshot = order.product
        return (
          <Space orientation='vertical' size={16} style={{ width: '100%' }}>
            <Descriptions
              size='small'
              column={1}
              bordered
              title={t('orders.orderBlock')}
              items={[
                { key: 'id', label: t('orders.code'), children: <Text code>{order.id}</Text> },
                {
                  key: 'kind',
                  label: t('customers.packageKind'),
                  children: t(`customers.packageKinds.${snapshot.kind}`)
                },
                { key: 'name', label: t('orders.planName'), children: nameOf(order) },
                { key: 'code', label: t('orders.planCode'), children: snapshot.id.toUpperCase() },
                { key: 'status', label: t('orders.status'), children: stateTag(order.status) },
                { key: 'created', label: t('orders.createdAt'), children: stamp(order.createdAt) },
                { key: 'paid', label: t('orders.paidAt'), children: stamp(order.paidAt) },
                { key: 'expires', label: t('orders.expiresAt'), children: stamp(order.expiresAt) }
              ]}
            />
            <Descriptions
              size='small'
              column={1}
              bordered
              title={t('orders.buyerBlock')}
              items={[
                { key: 'name', label: t('fields.name'), children: order.buyer.name },
                { key: 'email', label: 'Email', children: order.buyer.email },
                { key: 'phone', label: t('orders.phone'), children: order.buyer.phone },
                {
                  key: 'invoice',
                  label: t('orders.invoiceBlock'),
                  children: order.invoice.enabled ? (
                    <div>
                      <div>{order.invoice.company}</div>
                      <div>
                        {t('orders.taxCode')}: {order.invoice.taxCode}
                      </div>
                      <div>{order.invoice.address}</div>
                      <div>{order.invoice.email}</div>
                    </div>
                  ) : (
                    t('orders.noInvoice')
                  )
                }
              ]}
            />
            <Descriptions
              size='small'
              column={1}
              bordered
              title={t('orders.paymentBlock')}
              items={[
                { key: 'subtotal', label: t('orders.basePrice'), children: money(order.subtotal) },
                { key: 'code', label: t('orders.discountCode'), children: order.discountCode || '-' },
                {
                  key: 'type',
                  label: t('orders.discountType'),
                  children: order.discountType
                    ? order.discountType === 'percent'
                      ? t('discounts.typePercent')
                      : t('discounts.typeAmount')
                    : '-'
                },
                {
                  key: 'value',
                  label: t('orders.discountConfigured'),
                  children:
                    order.discountValue === undefined
                      ? '-'
                      : order.discountType === 'percent'
                        ? `${order.discountValue}%`
                        : money(order.discountValue)
                },
                {
                  key: 'discount',
                  label: t('orders.discountApplied'),
                  children: order.discountAmount ? `−${money(order.discountAmount)}` : '-'
                },
                { key: 'total', label: t('orders.totalDue'), children: <Text strong>{money(order.total)}</Text> },
                { key: 'method', label: t('customers.method'), children: t('transactionMethod.bank-qr') }
              ]}
            />
            <Descriptions
              size='small'
              column={1}
              bordered
              title={t('orders.snapshotBlock')}
              items={[
                { key: 'price', label: t('orders.snapshotPrice'), children: money(snapshot.price) },
                {
                  key: 'period',
                  label: t('orders.snapshotPeriod'),
                  children: snapshot.periodDays ? t('orders.days', { days: snapshot.periodDays }) : '-'
                },
                {
                  key: 'credits',
                  label: t('orders.snapshotCredits'),
                  children:
                    snapshot.designCredits !== undefined
                      ? t('orders.creditsLine', {
                          design: snapshot.designCredits,
                          library: snapshot.libraryCredits ?? 0
                        })
                      : '-'
                },
                {
                  key: 'benefits',
                  label: t('customers.benefits'),
                  children: (
                    <ul className='m-0 list-disc pl-4'>
                      {snapshot.benefits.map((benefit) => (
                        <li key={benefit}>{benefit}</li>
                      ))}
                    </ul>
                  )
                },
                {
                  key: 'gift',
                  label: t('customers.gift'),
                  children: snapshot.gift ? `${snapshot.gift.title} — ${snapshot.gift.conditions}` : '-'
                }
              ]}
            />
            <div>
              <Text strong style={{ display: 'block', marginBottom: 8 }}>
                {t('orders.transactionsBlock')}
              </Text>
              <Table<CmsTransaction>
                rowKey='id'
                size='small'
                pagination={false}
                dataSource={ownTransactions}
                locale={{ emptyText: t('table.empty') }}
                columns={[
                  { title: t('customers.txCode'), dataIndex: 'id', render: (id: string) => <Text code>{id}</Text> },
                  {
                    title: t('customers.txStatus'),
                    dataIndex: 'status',
                    render: (value: CmsTransaction['status']) => <Tag>{t(`transactionStatus.${value}`)}</Tag>
                  },
                  { title: t('customers.amount'), dataIndex: 'amount', render: (value: number) => money(value) },
                  { title: t('customers.txTime'), dataIndex: 'createdAt', render: (value: string) => stamp(value) },
                  { title: t('orders.note'), dataIndex: 'note', render: (value?: string) => value ?? '-' }
                ]}
              />
            </div>
          </Space>
        )
      }}
      renderForm={() => null}
    />
  )
}
