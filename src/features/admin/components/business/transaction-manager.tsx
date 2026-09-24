'use client'

import { Select, Space, Tag, Typography } from 'antd'
import { useSearchParams } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { useState } from 'react'

import type { Locale } from '@/i18n/routing'
import type { CmsTransaction, CmsTransactionStatus } from '@/shared/cms'
import { formatCurrency } from '@/shared/utils'
import { ResourceManager } from '../common/resource-manager'
import { useProductLabel } from '../ops/use-product-label'

const { Text } = Typography

const STATUSES: CmsTransactionStatus[] = ['paid', 'pending', 'failed', 'refunded']

/** Mã gói thuộc gói giám sát (S19) hay gói thiết kế (S01). */
const SUPERVISION_TIERS: readonly string[] = ['self', 'check', 'control']
const TIERS: CmsTransaction['tier'][] = ['basic', 'advanced', 'pro', 'check', 'control']

const STATUS_TAG: Record<CmsTransactionStatus, string> = {
  paid: 'green',
  pending: 'gold',
  failed: 'red',
  refunded: 'blue'
}

/**
 * Sổ giao dịch thanh toán — CHỈ ĐỌC.
 *
 * Tiền đã chạy thì không sửa bằng tay: đối soát lệch thì xử lý ở cổng thanh toán
 * / kế toán, hệ thống chỉ ghi nhận. Màn này để tra cứu: tìm theo mã / tên /
 * email, lọc trạng thái ngay trên đầu (câu hỏi thường trực là "đơn nào đang treo,
 * đơn nào hỏng"), lọc gói và phương thức trong cột.
 */
export function TransactionManager() {
  const t = useTranslations('admin')
  const locale = useLocale() as Locale
  const [status, setStatus] = useState<CmsTransactionStatus | 'all'>('all')
  const [tier, setTier] = useState<CmsTransaction['tier'] | 'all'>('all')
  const searchParams = useSearchParams()
  const productLabel = useProductLabel()
  const tierLabel = (tier: CmsTransaction['tier']) =>
    productLabel(SUPERVISION_TIERS.includes(tier) ? 'supervision' : 'design', tier)

  return (
    <ResourceManager
      collection='transactions'
      title={t('nav.transactions')}
      description={t('transactions.description')}
      allowDelete={false}
      allowEdit={false}
      searchText={(item) => `${item.id} ${item.customerName} ${item.customerEmail}`}
      initialQuery={searchParams.get('q') ?? undefined}
      filterKey={`${status}|${tier}`}
      extraActions={
        <Space wrap>
          <Select<CmsTransaction['tier'] | 'all'>
            value={tier}
            onChange={setTier}
            style={{ minWidth: 180 }}
            options={[
              { value: 'all', label: t('transactions.allPlans') },
              ...TIERS.map((value) => ({ value, label: tierLabel(value) }))
            ]}
          />
          <Select
            value={status}
            onChange={setStatus}
            style={{ minWidth: 180 }}
            options={[
              { value: 'all', label: t('transactions.allStatuses') },
              ...STATUSES.map((value) => ({ value, label: t(`transactionStatus.${value}`) }))
            ]}
          />
        </Space>
      }
      filterItems={(item) => (status === 'all' || item.status === status) && (tier === 'all' || item.tier === tier)}
      columns={[
        {
          title: t('transactions.code'),
          dataIndex: 'id',
          width: 150,
          render: (id: string, record) => (
            <div style={{ minWidth: 0 }}>
              <Text code>{id}</Text>
              {record.note ? (
                <Text type='secondary' style={{ display: 'block', fontSize: 12 }} ellipsis={{ tooltip: record.note }}>
                  {record.note}
                </Text>
              ) : null}
            </div>
          )
        },
        {
          title: t('customers.name'),
          dataIndex: 'customerName',
          render: (_, record) => (
            <div style={{ minWidth: 0 }}>
              <Text strong style={{ display: 'block' }}>
                {record.customerName}
              </Text>
              <Text type='secondary' style={{ fontSize: 12 }}>
                {record.customerEmail}
              </Text>
            </div>
          )
        },
        {
          title: t('customers.plan'),
          dataIndex: 'tier',
          width: 120,
          render: (value: CmsTransaction['tier']) => <Tag>{tierLabel(value)}</Tag>
        },
        {
          title: t('transactions.amount'),
          dataIndex: 'amount',
          width: 150,
          align: 'right' as const,
          sorter: (a, b) => a.amount - b.amount,
          render: (amount: number) => <Text strong>{formatCurrency(amount, locale)}</Text>
        },
        {
          title: t('transactions.method'),
          dataIndex: 'method',
          width: 150,
          // Phương thức hiện tại chỉ có QR chuyển khoản.
          render: () => t('transactionMethod.bank-qr')
        },
        {
          title: t('bookings.status'),
          dataIndex: 'status',
          width: 130,
          render: (value: CmsTransactionStatus) => (
            <Tag color={STATUS_TAG[value]}>{t(`transactionStatus.${value}`)}</Tag>
          )
        },
        {
          title: t('transactions.createdAt'),
          dataIndex: 'createdAt',
          width: 170,
          sorter: (a, b) => a.createdAt.localeCompare(b.createdAt),
          defaultSortOrder: 'descend' as const,
          render: (createdAt: string) => (
            <Space size={4}>
              <Text>{createdAt.slice(0, 10)}</Text>
              <Text type='secondary'>{createdAt.slice(11, 16)}</Text>
            </Space>
          )
        }
      ]}
      renderForm={() => null}
    />
  )
}
