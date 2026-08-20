'use client'

import { CheckOutlined, CloseOutlined } from '@ant-design/icons'
import { App, Button, Popconfirm, Space, Tag, Typography } from 'antd'
import { useTranslations } from 'next-intl'

import type { CmsBooking, CmsRescheduleRequest, CmsRescheduleStatus } from '@/shared/cms'
import { useAdminCollection, useSaveAdminItem } from '../../hooks/use-admin-data'
import { ResourceManager } from '../common/resource-manager'

const { Text } = Typography

const STATUS_TAG: Record<CmsRescheduleStatus, string> = {
  pending: 'gold',
  approved: 'green',
  rejected: 'red'
}

/**
 * Yêu cầu đổi lịch tư vấn — khách gửi, vận hành duyệt hoặc từ chối.
 *
 * DUYỆT thì lịch hẹn gốc được dời sang khung giờ mới NGAY TẠI ĐÂY — duyệt xong
 * mà còn phải tự mở màn Lịch hẹn sửa tay thì trước sau cũng có người quên, lịch
 * một nơi khách một nẻo. Từ chối chỉ đổi trạng thái; SAVICO gọi báo lại khách.
 */
export function RescheduleManager() {
  const t = useTranslations('admin')
  const { message } = App.useApp()
  const { data: bookings } = useAdminCollection('bookings')
  const saveRequest = useSaveAdminItem('rescheduleRequests')
  const saveBooking = useSaveAdminItem('bookings')

  const approve = async (request: CmsRescheduleRequest) => {
    const booking = ((bookings ?? []) as CmsBooking[]).find((item) => item.id === request.bookingId)
    if (booking) {
      await saveBooking.mutateAsync({ ...booking, date: request.toDate, time: request.toTime, status: 'confirmed' })
    }
    await saveRequest.mutateAsync({ ...request, status: 'approved' })
    message.success(t('reschedule.approvedToast', { booking: request.bookingId }))
  }

  const reject = async (request: CmsRescheduleRequest) => {
    await saveRequest.mutateAsync({ ...request, status: 'rejected' })
    message.success(t('reschedule.rejectedToast'))
  }

  return (
    <ResourceManager
      collection='rescheduleRequests'
      title={t('nav.reschedule')}
      description={t('reschedule.description')}
      allowDelete={false}
      allowEdit={false}
      searchText={(item) => `${item.id} ${item.bookingId} ${item.customerName} ${item.consultantName}`}
      columns={[
        {
          title: t('bookings.code'),
          dataIndex: 'bookingId',
          width: 130,
          render: (bookingId: string, record) => (
            <div style={{ minWidth: 0 }}>
              <Text code>{bookingId}</Text>
              <Text type='secondary' style={{ display: 'block', fontSize: 12 }}>
                {record.createdAt}
              </Text>
            </div>
          )
        },
        {
          title: t('bookings.customer'),
          dataIndex: 'customerName',
          render: (_, record) => (
            <div style={{ minWidth: 0 }}>
              <Text strong style={{ display: 'block' }}>
                {record.customerName}
              </Text>
              <Text type='secondary' style={{ fontSize: 12 }}>
                {record.consultantName}
              </Text>
            </div>
          )
        },
        {
          title: t('reschedule.change'),
          key: 'change',
          width: 250,
          render: (_, record) => (
            <Space size={6}>
              <Text delete type='secondary'>
                {record.fromDate} · {record.fromTime}
              </Text>
              <Text>→</Text>
              <Text strong>
                {record.toDate} · {record.toTime}
              </Text>
            </Space>
          )
        },
        {
          title: t('reschedule.reason'),
          dataIndex: 'reason',
          ellipsis: true,
          render: (reason?: string) => reason || <Text type='secondary'>—</Text>
        },
        {
          title: t('bookings.status'),
          dataIndex: 'status',
          width: 130,
          filters: (['pending', 'approved', 'rejected'] as const).map((status) => ({
            text: t(`rescheduleStatus.${status}`),
            value: status
          })),
          onFilter: (value, record) => record.status === value,
          render: (status: CmsRescheduleStatus) => (
            <Tag color={STATUS_TAG[status]}>{t(`rescheduleStatus.${status}`)}</Tag>
          )
        },
        {
          title: t('table.actions'),
          key: 'decision',
          width: 190,
          render: (_, record) =>
            record.status === 'pending' ? (
              <Space size={8}>
                <Popconfirm
                  title={t('reschedule.approveConfirmTitle')}
                  description={t('reschedule.approveConfirmBody', { date: record.toDate, time: record.toTime })}
                  okText={t('reschedule.approve')}
                  cancelText={t('actions.cancel')}
                  onConfirm={() => approve(record)}
                >
                  <Button size='small' type='primary' icon={<CheckOutlined />}>
                    {t('reschedule.approve')}
                  </Button>
                </Popconfirm>
                <Popconfirm
                  title={t('reschedule.rejectConfirmTitle')}
                  okText={t('reschedule.reject')}
                  okButtonProps={{ danger: true }}
                  cancelText={t('actions.cancel')}
                  onConfirm={() => reject(record)}
                >
                  <Button size='small' danger icon={<CloseOutlined />}>
                    {t('reschedule.reject')}
                  </Button>
                </Popconfirm>
              </Space>
            ) : (
              <Text type='secondary'>—</Text>
            )
        }
      ]}
      renderForm={() => null}
    />
  )
}
