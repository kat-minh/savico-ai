'use client'

import { App, Button, Popconfirm, Space, Tag, Typography } from 'antd'
import { useLocale, useTranslations } from 'next-intl'

import type { Locale } from '@/i18n/routing'
import type { CmsSubscription, CmsSubscriptionStatus, PlanTier } from '@/shared/cms'
import { formatDate } from '@/shared/utils'
import { useSaveAdminItem } from '../../hooks/use-admin-data'
import { ResourceManager } from '../common/resource-manager'

const { Text } = Typography

const STATUS_TAG: Record<CmsSubscriptionStatus, string> = {
  active: 'green',
  cancelled: 'red',
  expired: 'default'
}

const TIER_TAG: Record<PlanTier, string> = { basic: 'default', advanced: 'green', pro: 'purple' }

/** Cộng thêm `days` ngày vào một mốc ISO `yyyy-mm-dd`. */
function addDays(isoDate: string, days: number): string {
  const date = new Date(isoDate)
  date.setDate(date.getDate() + days)
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

/**
 * Subscription của người dùng — mỗi dòng là MỘT KỲ đăng ký.
 *
 * Hai việc vận hành làm ở đây, mỗi việc một nút ngay trên dòng:
 *   · GIA HẠN thủ công +30 ngày — khách chuyển khoản tay, khiếu nại, tặng bù…
 *     Kỳ đã hết hạn thì gia hạn tính từ HÔM NAY (cộng vào một mốc quá khứ là
 *     tặng một kỳ vẫn đang hết hạn).
 *   · HỦY — dừng kỳ đang chạy, có hỏi lại. Không xóa: kỳ đã hủy vẫn nằm đó làm
 *     lịch sử đối soát với bảng giao dịch.
 *
 * Không tạo tay ở màn này: kỳ mới sinh ra từ một giao dịch thanh toán.
 */
export function SubscriptionManager() {
  const t = useTranslations('admin')
  const locale = useLocale() as Locale
  const { message } = App.useApp()
  const save = useSaveAdminItem('subscriptions')

  const extend = async (subscription: CmsSubscription) => {
    const base =
      subscription.status === 'expired' || new Date(subscription.expiresAt) < new Date()
        ? new Date().toISOString().slice(0, 10)
        : subscription.expiresAt
    const expiresAt = addDays(base, 30)
    await save.mutateAsync({ ...subscription, expiresAt, status: 'active', note: t('subscriptions.extendNote') })
    message.success(t('subscriptions.extendedToast', { date: formatDate(expiresAt, locale) }))
  }

  const cancel = async (subscription: CmsSubscription) => {
    await save.mutateAsync({ ...subscription, status: 'cancelled' })
    message.success(t('subscriptions.cancelledToast', { name: subscription.customerName }))
  }

  return (
    <ResourceManager
      collection='subscriptions'
      title={t('nav.subscriptions')}
      description={t('subscriptions.description')}
      allowDelete={false}
      allowEdit={false}
      searchText={(item) => `${item.id} ${item.customerName} ${item.customerEmail}`}
      columns={[
        { title: t('subscriptions.code'), dataIndex: 'id', width: 150, render: (id: string) => <Text code>{id}</Text> },
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
          width: 130,
          filters: (['basic', 'advanced', 'pro'] as const).map((tier) => ({
            text: t(`planTier.${tier}`),
            value: tier
          })),
          onFilter: (value, record) => record.tier === value,
          render: (tier: PlanTier) => <Tag color={TIER_TAG[tier]}>{t(`planTier.${tier}`)}</Tag>
        },
        {
          title: t('subscriptions.period'),
          dataIndex: 'expiresAt',
          width: 210,
          sorter: (a, b) => a.expiresAt.localeCompare(b.expiresAt),
          render: (_, record) => (
            <Text>
              {formatDate(record.startedAt, locale)} → <Text strong>{formatDate(record.expiresAt, locale)}</Text>
            </Text>
          )
        },
        {
          title: t('bookings.status'),
          dataIndex: 'status',
          width: 130,
          filters: (['active', 'cancelled', 'expired'] as const).map((status) => ({
            text: t(`subscriptionStatus.${status}`),
            value: status
          })),
          onFilter: (value, record) => record.status === value,
          render: (status: CmsSubscriptionStatus) => (
            <Tag color={STATUS_TAG[status]}>{t(`subscriptionStatus.${status}`)}</Tag>
          )
        },
        {
          title: t('subscriptions.actions'),
          key: 'subscriptionActions',
          width: 210,
          render: (_, record) => (
            <Space size={8}>
              <Button size='small' disabled={record.status === 'cancelled'} onClick={() => extend(record)}>
                {t('subscriptions.extend')}
              </Button>
              {record.status === 'active' ? (
                <Popconfirm
                  title={t('subscriptions.cancelConfirmTitle')}
                  description={t('subscriptions.cancelConfirmBody')}
                  okText={t('subscriptions.cancel')}
                  okButtonProps={{ danger: true }}
                  cancelText={t('actions.keepEditing')}
                  onConfirm={() => cancel(record)}
                >
                  <Button size='small' danger>
                    {t('subscriptions.cancel')}
                  </Button>
                </Popconfirm>
              ) : null}
            </Space>
          )
        }
      ]}
      renderForm={() => null}
    />
  )
}
