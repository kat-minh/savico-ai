'use client'

import { Select, Space, Tag, Typography } from 'antd'
import { useLocale, useTranslations } from 'next-intl'
import { useState } from 'react'

import type { Locale } from '@/i18n/routing'
import type { CmsTransactionMethod, CmsTransactionStatus, PlanTier } from '@/shared/cms'
import { formatCurrency } from '@/shared/utils'
import { ResourceManager } from '../common/resource-manager'

const { Text } = Typography

const STATUSES: CmsTransactionStatus[] = ['paid', 'pending', 'failed', 'refunded']
const METHODS: CmsTransactionMethod[] = ['bank-qr', 'card', 'manual']

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

  return (
    <ResourceManager
      collection='transactions'
      title={t('nav.transactions')}
      description={t('transactions.description')}
      allowDelete={false}
      allowEdit={false}
      searchText={(item) => `${item.id} ${item.customerName} ${item.customerEmail}`}
      extraActions={
        <Select
          value={status}
          onChange={setStatus}
          style={{ minWidth: 180 }}
          options={[
            { value: 'all', label: t('transactions.allStatuses') },
            ...STATUSES.map((value) => ({ value, label: t(`transactionStatus.${value}`) }))
          ]}
        />
      }
      filterItems={(item) => status === 'all' || item.status === status}
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
          filters: (['basic', 'advanced', 'pro'] as const).map((tier) => ({
            text: t(`planTier.${tier}`),
            value: tier
          })),
          onFilter: (value, record) => record.tier === value,
          render: (tier: PlanTier) => <Tag>{t(`planTier.${tier}`)}</Tag>
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
          filters: METHODS.map((method) => ({ text: t(`transactionMethod.${method}`), value: method })),
          onFilter: (value, record) => record.method === value,
          render: (method: CmsTransactionMethod) => t(`transactionMethod.${method}`)
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
