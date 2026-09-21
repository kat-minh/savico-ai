'use client'

import { Descriptions, Form, Input, Segmented, Space, Tag, Typography } from 'antd'
import { useLocale, useTranslations } from 'next-intl'
import { useState } from 'react'

import type { Locale } from '@/i18n/routing'
import type { CmsOrder, CmsOrderStatus } from '@/shared/cms'
import { formatCurrency } from '@/shared/utils'
import { useAdminCollection } from '../../hooks/use-admin-data'
import { relativeTime } from '../../services/ops.service'
import { ResourceManager } from '../common/resource-manager'
import { useProductLabel } from './use-product-label'

const { Text } = Typography

const STATUS_TAG: Record<CmsOrderStatus, string> = {
  awaiting: 'blue',
  verifying: 'gold',
  failed: 'red',
  paid: 'green'
}

type View = 'all' | 'paid' | 'pending' | 'failed'

/** "Đang chờ" gộp hai trạng thái chưa có kết quả: chưa chuyển và đang chờ ngân hàng báo về. */
function inPending(order: CmsOrder): boolean {
  return order.status === 'awaiting' || order.status === 'verifying'
}

function stamp(iso: string): string {
  return iso.slice(0, 16).replace('T', ' ')
}

/**
 * ĐƠN HÀNG — màn TRA CỨU, không phải hàng đợi xử lý.
 *
 * Trạng thái thanh toán do backend cập nhật qua webhook của ngân hàng / cổng
 * QR: tiền về là đơn tự sang `paid` và màn S06 của khách tự sang S08. Vận hành
 * KHÔNG xác nhận tiền bằng tay, nên màn này không có nút nào đổi trạng thái.
 *
 * Việc của vận hành ở đây là trả lời khi khách gọi: tìm theo mã đơn, nội dung
 * chuyển khoản, tên, SĐT hoặc email; xem đơn đang ở đâu, thông tin xuất hóa
 * đơn, và ghi chú nội bộ lại cuộc gọi. Ngăn kéo chỉ sửa được đúng ghi chú đó.
 *
 * Không có nút xóa: đơn đã tạo là chứng từ.
 */
export function OrderManager() {
  const t = useTranslations('admin')
  const locale = useLocale() as Locale
  const productLabel = useProductLabel()
  const [view, setView] = useState<View>('all')

  const { data: orders = [] } = useAdminCollection('orders')

  const counts: Record<View, number> = {
    all: orders.length,
    paid: orders.filter((order) => order.status === 'paid').length,
    pending: orders.filter(inPending).length,
    failed: orders.filter((order) => order.status === 'failed').length
  }

  const inView = (order: CmsOrder) => {
    if (view === 'all') return true
    if (view === 'pending') return inPending(order)
    return order.status === view
  }

  return (
    <ResourceManager
      collection='orders'
      title={t('nav.orders')}
      description={t('orders.description')}
      allowDelete={false}
      drawerWidth={620}
      searchText={(item) =>
        `${item.id} ${item.transfer.content} ${item.buyer.name} ${item.buyer.phone} ${item.buyer.email} ${item.total}`
      }
      filterItems={inView}
      banner={
        <Segmented<View>
          value={view}
          onChange={setView}
          options={(['all', 'paid', 'pending', 'failed'] as const).map((value) => ({
            value,
            label: `${t(`orders.views.${value}`)} (${counts[value]})`
          }))}
        />
      }
      columns={[
        {
          title: t('orders.code'),
          dataIndex: 'id',
          width: 170,
          render: (id: string, record) => (
            <div style={{ minWidth: 0 }}>
              <Text code>{id}</Text>
              <Text type='secondary' style={{ display: 'block', fontSize: 12 }}>
                {t('orders.transferContent')}: <Text copyable>{record.transfer.content}</Text>
              </Text>
            </div>
          )
        },
        {
          title: t('orders.buyer'),
          key: 'buyer',
          render: (_, record) => (
            <div style={{ minWidth: 0 }}>
              <Text strong style={{ display: 'block' }}>
                {record.buyer.name}
              </Text>
              <Text type='secondary' style={{ fontSize: 12 }}>
                {record.buyer.phone} · {record.buyer.email}
              </Text>
            </div>
          )
        },
        {
          title: t('orders.product'),
          key: 'product',
          width: 170,
          render: (_, record) => (
            <Space orientation='vertical' size={2}>
              <Tag color={record.product.kind === 'design' ? 'green' : 'purple'}>
                {productLabel(record.product.kind, record.product.id)}
              </Tag>
              {record.projectId ? (
                <Text type='secondary' style={{ fontSize: 12 }}>
                  {record.projectId}
                </Text>
              ) : null}
              {record.invoice.enabled ? <Tag>{t('orders.invoiceRequested')}</Tag> : null}
            </Space>
          )
        },
        {
          title: t('orders.amount'),
          dataIndex: 'total',
          width: 160,
          align: 'right' as const,
          sorter: (a, b) => a.total - b.total,
          render: (total: number, record) => (
            <div>
              <Text strong>{formatCurrency(total, locale)}</Text>
              {record.discountAmount > 0 ? (
                <Text type='secondary' style={{ display: 'block', fontSize: 12 }}>
                  {record.discountCode} −{formatCurrency(record.discountAmount, locale)}
                </Text>
              ) : null}
            </div>
          )
        },
        {
          title: t('orders.status'),
          dataIndex: 'status',
          width: 190,
          render: (status: CmsOrderStatus, record) => (
            <div>
              <Tag color={STATUS_TAG[status]}>{t(`orderStatus.${status}`)}</Tag>
              <Text type='secondary' style={{ display: 'block', fontSize: 12 }}>
                {status === 'paid'
                  ? t('orders.paidAgo', { time: relativeTime(record.paidAt, locale) })
                  : t('orders.createdAgo', { time: relativeTime(record.createdAt, locale) })}
              </Text>
              {record.opsNote ? (
                <Text
                  type='secondary'
                  style={{ display: 'block', fontSize: 12 }}
                  ellipsis={{ tooltip: record.opsNote }}
                >
                  {record.opsNote}
                </Text>
              ) : null}
            </div>
          )
        },
        {
          title: t('orders.createdAt'),
          dataIndex: 'createdAt',
          width: 150,
          sorter: (a, b) => a.createdAt.localeCompare(b.createdAt),
          defaultSortOrder: 'descend' as const,
          render: (createdAt: string) => <Text>{stamp(createdAt)}</Text>
        }
      ]}
      renderDetail={(order) => (
        <Space orientation='vertical' size={16} style={{ width: '100%' }}>
          <Descriptions size='small' column={1} bordered title={t('orders.transferBlock')}>
            <Descriptions.Item label={t('orders.status')}>
              <Tag color={STATUS_TAG[order.status]}>{t(`orderStatus.${order.status}`)}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label={t('orders.amount')}>{formatCurrency(order.total, locale)}</Descriptions.Item>
            <Descriptions.Item label={t('orders.transferContent')}>
              <Text copyable>{order.transfer.content}</Text>
            </Descriptions.Item>
            <Descriptions.Item label={t('orders.bankAccount')}>
              {order.transfer.bankName} · {order.transfer.accountNumber}
            </Descriptions.Item>
          </Descriptions>
          <Descriptions size='small' column={1} bordered title={t('orders.buyer')}>
            <Descriptions.Item label={t('fields.name')}>{order.buyer.name}</Descriptions.Item>
            <Descriptions.Item label={t('orders.phone')}>
              <Text copyable>{order.buyer.phone}</Text>
            </Descriptions.Item>
            <Descriptions.Item label='Email'>
              <Text copyable>{order.buyer.email}</Text>
            </Descriptions.Item>
          </Descriptions>
          {order.invoice.enabled ? (
            <Descriptions size='small' column={1} bordered title={t('orders.invoiceBlock')}>
              <Descriptions.Item label={t('orders.company')}>{order.invoice.company}</Descriptions.Item>
              <Descriptions.Item label={t('orders.taxCode')}>
                <Text copyable>{order.invoice.taxCode}</Text>
              </Descriptions.Item>
              <Descriptions.Item label={t('orders.address')}>{order.invoice.address}</Descriptions.Item>
              <Descriptions.Item label='Email'>{order.invoice.email}</Descriptions.Item>
            </Descriptions>
          ) : null}
          <Descriptions size='small' column={1} bordered title={t('orders.timeline')}>
            <Descriptions.Item label={t('orders.createdAt')}>{stamp(order.createdAt)}</Descriptions.Item>
            {order.transferredAt ? (
              <Descriptions.Item label={t('orders.transferredAt')}>{stamp(order.transferredAt)}</Descriptions.Item>
            ) : null}
            {order.paidAt ? (
              <Descriptions.Item label={t('orders.paidAt')}>{stamp(order.paidAt)}</Descriptions.Item>
            ) : null}
          </Descriptions>
        </Space>
      )}
      renderForm={() => (
        <Form.Item name='opsNote' label={t('orders.opsNote')} extra={t('orders.opsNoteHint')}>
          <Input.TextArea rows={3} />
        </Form.Item>
      )}
    />
  )
}
