'use client'

import { Col, Form, Input, Row, Select, Tag, Typography } from 'antd'
import { useTranslations } from 'next-intl'

import type { CmsBooking, CmsBookingStatus } from '@/shared/cms'
import { useAdminCollection } from '../../hooks/use-admin-data'
import { ResourceManager } from '../common/resource-manager'

const { Text } = Typography

const STATUSES: CmsBookingStatus[] = ['pending', 'confirmed', 'done', 'cancelled']

const STATUS_COLOR: Record<CmsBookingStatus, string> = {
  pending: 'gold',
  confirmed: 'green',
  done: 'blue',
  cancelled: 'red'
}

/**
 * Lịch hẹn tư vấn 1:1 (mục VIII.3).
 *
 * Khách đặt lịch xong trạng thái là `pending` cho tới khi SAVICO gọi xác nhận
 * trong 24h làm việc — nên việc chính ở màn này là đổi trạng thái và ghi chú
 * lại nội dung cuộc gọi. Lịch khách vừa đặt trên site hiện ngay ở đây.
 */
export function BookingManager() {
  const t = useTranslations('admin')
  const { data: consultants } = useAdminCollection('consultants')

  return (
    <ResourceManager
      collection='bookings'
      title={t('nav.bookings')}
      description={t('bookings.description')}
      searchText={(item) => `${item.customerName} ${item.phone} ${item.consultantName}`}
      columns={[
        { title: t('bookings.code'), dataIndex: 'id', width: 120 },
        {
          title: t('bookings.customer'),
          dataIndex: 'customerName',
          render: (_, record) => (
            <div style={{ minWidth: 0 }}>
              <Text strong style={{ display: 'block' }}>
                {record.customerName}
              </Text>
              <Text type='secondary' style={{ fontSize: 12 }}>
                {record.phone}
              </Text>
            </div>
          )
        },
        { title: t('bookings.consultant'), dataIndex: 'consultantName', width: 190 },
        {
          title: t('bookings.slot'),
          key: 'slot',
          width: 160,
          sorter: (a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`),
          render: (_, record) => (
            <span>
              {record.date} · {record.time}
            </span>
          )
        },
        {
          title: t('bookings.status'),
          dataIndex: 'status',
          width: 130,
          filters: STATUSES.map((value) => ({ text: t(`bookingStatus.${value}`), value })),
          onFilter: (value, record) => record.status === value,
          render: (status: CmsBookingStatus) => <Tag color={STATUS_COLOR[status]}>{t(`bookingStatus.${status}`)}</Tag>
        },
        { title: t('bookings.note'), dataIndex: 'note', ellipsis: true }
      ]}
      renderForm={() => (
        <>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item name='customerName' label={t('bookings.customer')}>
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name='phone' label={t('bookings.phone')}>
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name='consultantId' label={t('bookings.consultant')}>
                <Select
                  showSearch
                  optionFilterProp='label'
                  options={(consultants ?? []).map((consultant) => ({
                    label: consultant.name,
                    value: consultant.id
                  }))}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name='status' label={t('bookings.status')}>
                <Select options={STATUSES.map((value) => ({ label: t(`bookingStatus.${value}`), value }))} />
              </Form.Item>
            </Col>
            <Col xs={12}>
              <Form.Item name='date' label={t('bookings.date')}>
                <Input placeholder='2026-08-20' />
              </Form.Item>
            </Col>
            <Col xs={12}>
              <Form.Item name='time' label={t('bookings.time')}>
                <Input placeholder='09:00' />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name='note' label={t('bookings.note')}>
            <Input.TextArea autoSize={{ minRows: 3, maxRows: 6 }} />
          </Form.Item>
        </>
      )}
      fromFormValues={(values, current) => {
        const next = { ...current, ...values } as CmsBooking
        // Tên KTS lưu kèm bản ghi để bảng khỏi phải join — đổi người thì phải
        // cập nhật lại tên, không thì hàng vẫn hiện tên KTS cũ.
        const consultant = (consultants ?? []).find((item) => item.id === next.consultantId)
        return consultant ? { ...next, consultantName: consultant.name } : next
      }}
    />
  )
}
