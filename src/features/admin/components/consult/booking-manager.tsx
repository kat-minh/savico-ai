'use client'

import { CheckOutlined, CloseOutlined, PhoneOutlined, SmileOutlined } from '@ant-design/icons'
import { App, Button, Descriptions, Form, Input, Popconfirm, Segmented, Select, Tag, Typography } from 'antd'
import dayjs from 'dayjs'
import { useLocale, useTranslations } from 'next-intl'
import { useState } from 'react'

import type { Locale } from '@/i18n/routing'
import type { CmsBooking, CmsBookingStatus } from '@/shared/cms'
import { useAdminCollection, useSaveAdminItem } from '../../hooks/use-admin-data'
import { relativeTime } from '../../services/ops.service'
import { ResourceManager } from '../common/resource-manager'

const { Text } = Typography

const STATUSES: CmsBookingStatus[] = ['pending', 'confirmed', 'done', 'cancelled']

const STATUS_TAG: Record<CmsBookingStatus, string> = {
  pending: 'gold',
  confirmed: 'green',
  done: 'blue',
  cancelled: 'default'
}

type View = 'pending' | 'upcoming' | 'closed' | 'all'

/** Bề ngang cố định của ba nút — mọi dòng có đủ ba nút, không dùng được thì mờ. */
const BUTTON_WIDTH = 104

/**
 * LỊCH TƯ VẤN 1:1 — dạng bảng như mọi hàng đợi khác.
 *
 * Khách đặt ở trang Tư vấn 1:1 (mục VIII.3), vận hành gọi lại trong 24h làm
 * việc để chốt với kiến trúc sư rồi bấm "Xác nhận". Ba nút đi theo đúng vòng
 * đời một buổi hẹn:
 *
 *   Chờ xác nhận ──Xác nhận──▶ Đã xác nhận ──Đã tư vấn──▶ Đã tư vấn
 *         └────────────Hủy────────────┘
 *
 * Bấm nhầm thì mở ngăn kéo (cây bút) để đặt lại trạng thái — ngăn kéo chỉ sửa
 * được trạng thái và ghi chú nội bộ. Khách muốn dời giờ thì gọi điện; vận hành
 * hủy lịch cũ và ghi lại giờ mới đã hẹn.
 *
 * Mặc định lọc "Chờ xác nhận" — đó là chỗ có khách đang đợi được gọi lại.
 */
export function BookingManager() {
  const t = useTranslations('admin')
  const locale = useLocale() as Locale
  const { message } = App.useApp()

  const [view, setView] = useState<View>('pending')
  const [consultantId, setConsultantId] = useState<string>('all')

  const { data: bookings = [] } = useAdminCollection('bookings')
  const { data: consultants = [] } = useAdminCollection('consultants')
  const save = useSaveAdminItem('bookings')

  const matchesView = (item: CmsBooking, target: View) => {
    if (target === 'pending') return item.status === 'pending'
    if (target === 'upcoming') return item.status === 'confirmed'
    if (target === 'closed') return item.status === 'done' || item.status === 'cancelled'
    return true
  }

  const ofConsultant = (item: CmsBooking) => consultantId === 'all' || item.consultantId === consultantId
  const count = (target: View) => bookings.filter((item) => ofConsultant(item) && matchesView(item, target)).length

  const setStatus = async (booking: CmsBooking, status: CmsBookingStatus) => {
    await save.mutateAsync({ ...booking, status })
    message.success(t('bookings.statusToast', { code: booking.id, status: t(`bookingStatus.${status}`) }))
  }

  return (
    <ResourceManager
      collection='bookings'
      title={t('nav.bookings')}
      description={t('bookings.description')}
      allowDelete={false}
      searchText={(item) => `${item.id} ${item.customerName} ${item.phone} ${item.consultantName}`}
      filterItems={(item) => ofConsultant(item) && matchesView(item, view)}
      extraActions={
        <Select
          value={consultantId}
          onChange={setConsultantId}
          style={{ minWidth: 220 }}
          options={[
            { value: 'all', label: t('bookings.allConsultants') },
            ...consultants.map((consultant) => ({ value: consultant.id, label: consultant.name }))
          ]}
        />
      }
      banner={
        <Segmented<View>
          value={view}
          onChange={setView}
          options={(['pending', 'upcoming', 'closed', 'all'] as const).map((value) => ({
            value,
            label: `${t(`bookings.views.${value}`)} (${count(value)})`
          }))}
        />
      }
      columns={[
        {
          title: t('bookings.slot'),
          key: 'slot',
          width: 150,
          sorter: (a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`),
          defaultSortOrder: 'ascend' as const,
          render: (_, record) => (
            <div>
              <Text strong style={{ display: 'block' }}>
                {dayjs(record.date).format('DD/MM/YYYY')}
              </Text>
              <Text type='secondary' style={{ fontSize: 12 }}>
                {record.time}
              </Text>
            </div>
          )
        },
        {
          title: t('bookings.customer'),
          key: 'customer',
          render: (_, record) => (
            <div style={{ minWidth: 0 }}>
              <Text strong style={{ display: 'block' }}>
                {record.customerName}
              </Text>
              <Text copyable type='secondary' style={{ fontSize: 12 }}>
                <PhoneOutlined /> {record.phone}
              </Text>
              {record.note ? (
                <Text type='secondary' style={{ display: 'block', fontSize: 12 }} ellipsis={{ tooltip: record.note }}>
                  “{record.note}”
                </Text>
              ) : null}
            </div>
          )
        },
        {
          title: t('bookings.consultant'),
          dataIndex: 'consultantName',
          width: 200
        },
        {
          title: t('bookings.status'),
          dataIndex: 'status',
          width: 170,
          render: (status: CmsBookingStatus, record) => (
            <div>
              <Tag color={STATUS_TAG[status]}>{t(`bookingStatus.${status}`)}</Tag>
              <Text type='secondary' style={{ display: 'block', fontSize: 12 }}>
                {t('bookings.bookedAgo', { time: relativeTime(record.createdAt, locale) })}
              </Text>
            </div>
          )
        },
        {
          title: t('bookings.decide'),
          key: 'decide',
          width: BUTTON_WIDTH * 3 + 24,
          render: (_, record) => {
            const open = record.status === 'pending' || record.status === 'confirmed'
            return (
              <div className='flex items-center gap-1.5 whitespace-nowrap'>
                <Button
                  size='small'
                  type='primary'
                  icon={<CheckOutlined />}
                  disabled={record.status !== 'pending'}
                  style={{ width: BUTTON_WIDTH }}
                  onClick={() => setStatus(record, 'confirmed')}
                >
                  {t('bookings.confirm')}
                </Button>
                <Button
                  size='small'
                  icon={<SmileOutlined />}
                  disabled={record.status !== 'confirmed'}
                  style={{ width: BUTTON_WIDTH }}
                  onClick={() => setStatus(record, 'done')}
                >
                  {t('bookings.markDone')}
                </Button>
                <Popconfirm
                  disabled={!open}
                  title={t('bookings.cancelConfirmTitle')}
                  description={<div style={{ maxWidth: 260 }}>{t('bookings.cancelConfirmBody')}</div>}
                  okText={t('bookings.cancel')}
                  okButtonProps={{ danger: true }}
                  cancelText={t('actions.cancel')}
                  onConfirm={() => setStatus(record, 'cancelled')}
                >
                  <Button size='small' danger icon={<CloseOutlined />} disabled={!open} style={{ width: BUTTON_WIDTH }}>
                    {t('bookings.cancel')}
                  </Button>
                </Popconfirm>
              </div>
            )
          }
        }
      ]}
      renderDetail={(booking) => (
        <Descriptions size='small' column={1} bordered>
          <Descriptions.Item label={t('bookings.code')}>
            <Text code>{booking.id}</Text>
          </Descriptions.Item>
          <Descriptions.Item label={t('bookings.slot')}>
            {dayjs(booking.date).format('DD/MM/YYYY')} · {booking.time}
          </Descriptions.Item>
          <Descriptions.Item label={t('bookings.customer')}>{booking.customerName}</Descriptions.Item>
          <Descriptions.Item label={t('bookings.phone')}>
            <Text copyable>{booking.phone}</Text>
          </Descriptions.Item>
          <Descriptions.Item label={t('bookings.consultant')}>{booking.consultantName}</Descriptions.Item>
          {booking.note ? <Descriptions.Item label={t('bookings.note')}>{booking.note}</Descriptions.Item> : null}
        </Descriptions>
      )}
      renderForm={() => (
        <>
          <Form.Item name='status' label={t('bookings.status')} extra={t('bookings.statusHint')}>
            <Select options={STATUSES.map((value) => ({ value, label: t(`bookingStatus.${value}`) }))} />
          </Form.Item>
          <Form.Item name='opsNote' label={t('bookings.opsNote')} extra={t('bookings.opsNoteHint')}>
            <Input.TextArea rows={3} />
          </Form.Item>
        </>
      )}
    />
  )
}
