'use client'

import { CheckOutlined, CloseOutlined, PhoneOutlined, SmileOutlined } from '@ant-design/icons'
import {
  Alert,
  App,
  Button,
  DatePicker,
  Descriptions,
  Form,
  Input,
  Modal,
  Popconfirm,
  Segmented,
  Select,
  Space,
  Tag,
  Tooltip,
  Typography
} from 'antd'
import dayjs, { type Dayjs } from 'dayjs'
import { useSearchParams } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { useState } from 'react'

import type { Locale } from '@/i18n/routing'
import { CONSULT_SLOT_MINUTES, isSlotClosed, type CmsBooking, type CmsBookingStatus } from '@/shared/cms'
import { useAdminCollection, useSaveAdminItem } from '../../hooks/use-admin-data'
import { relativeTime } from '../../services/ops.service'
import { ResourceManager } from '../common/resource-manager'

const { Text } = Typography

const STATUS_TAG: Record<CmsBookingStatus, string> = {
  pending: 'gold',
  confirmed: 'green',
  rejected: 'red',
  done: 'blue',
  cancelled: 'default'
}

/** Thời điểm kết thúc khung tư vấn — sớm nhất được đánh dấu Hoàn tất (§5). */
function slotEnd(booking: CmsBooking): Dayjs {
  return dayjs(`${booking.date} ${booking.time}`).add(CONSULT_SLOT_MINUTES, 'minute')
}

/** Phút từ bây giờ tới giờ bắt đầu (âm = đã quá giờ). */
function minutesUntil(booking: CmsBooking): number {
  return dayjs(`${booking.date} ${booking.time}`).diff(dayjs(), 'minute')
}

/** Coi là "sát giờ" khi còn dưới 2 tiếng hoặc đã quá giờ (§7). */
const NEAR_MINUTES = 120

function formatStamp(value: string): string {
  return dayjs(value).format('DD/MM/YYYY HH:mm')
}

type View = 'pending' | 'upcoming' | 'closed' | 'all'

/** Bề ngang của nút thao tác. */
const BUTTON_WIDTH = 104

/**
 * LỊCH TƯ VẤN 1:1 (epic AppointmentManagement) — dạng bảng như mọi hàng đợi khác.
 *
 * Chỉ ba bước chuyển hợp lệ, không có đường lùi:
 *
 *   Chờ xác nhận ──Xác nhận──▶ Đã xác nhận ──Hoàn tất──▶ Hoàn tất
 *         └──Từ chối (bắt buộc lý do)──▶ Đã từ chối
 *
 * Hoàn tất chỉ bấm được khi khung giờ đã qua. Ngăn kéo (cây bút) chỉ sửa ghi
 * chú nội bộ — không đặt lại trạng thái, vì spec cấm chuyển ngược lịch đã từ
 * chối hoặc đã hoàn tất.
 *
 * Mặc định lọc "Chờ xác nhận" — đó là chỗ có khách đang đợi được gọi lại.
 */
export function BookingManager() {
  const t = useTranslations('admin')
  const locale = useLocale() as Locale
  const { message } = App.useApp()

  const searchParams = useSearchParams()
  const initialQuery = searchParams.get('q') ?? undefined
  // Mở từ đường dẫn có mã lịch → xem ở mọi trạng thái, không kẹt ở tab mặc định.
  const [view, setView] = useState<View>(initialQuery ? 'all' : 'pending')
  const [consultantId, setConsultantId] = useState<string>('all')
  const [date, setDate] = useState<Dayjs | null>(null)

  const { data: bookings = [] } = useAdminCollection('bookings')
  const { data: consultants = [] } = useAdminCollection('consultants')
  const save = useSaveAdminItem('bookings')

  const matchesView = (item: CmsBooking, target: View) => {
    if (target === 'pending') return item.status === 'pending'
    if (target === 'upcoming') return item.status === 'confirmed'
    if (target === 'closed') return item.status === 'done' || item.status === 'rejected' || item.status === 'cancelled'
    return true
  }

  const ofConsultant = (item: CmsBooking) =>
    (consultantId === 'all' || item.consultantId === consultantId) && (!date || item.date === date.format('YYYY-MM-DD'))
  const count = (target: View) => bookings.filter((item) => ofConsultant(item) && matchesView(item, target)).length

  /** Lịch đang mở hộp nhập lý do từ chối. */
  const [rejecting, setRejecting] = useState<CmsBooking | null>(null)
  const [rejectForm] = Form.useForm<{ reason: string }>()

  const setStatus = async (booking: CmsBooking, patch: Partial<CmsBooking> & { status: CmsBookingStatus }) => {
    await save.mutateAsync({ ...booking, ...patch })
    message.success(t('bookings.statusToast', { code: booking.id, status: t(`bookingStatus.${patch.status}`) }))
  }

  /**
   * Xung đột trước khi xác nhận (§3, §7): khung giờ đã bị admin khóa, hoặc kiến
   * trúc sư đã có lịch Đã xác nhận khác đúng khung đó. Trả về lý do để hiện.
   */
  const conflictOf = (booking: CmsBooking): string | null => {
    const consultant = consultants.find((item) => item.id === booking.consultantId)
    if (!consultant) return t('bookings.consultantMissing')
    if (isSlotClosed(consultant.closures ?? [], booking.date, booking.time)) return t('bookings.slotClosed')
    const other = bookings.find(
      (item) =>
        item.id !== booking.id &&
        item.status === 'confirmed' &&
        item.consultantId === booking.consultantId &&
        item.date === booking.date &&
        item.time === booking.time
    )
    return other ? t('bookings.slotTakenBy', { code: other.id }) : null
  }

  const submitReject = async () => {
    if (!rejecting) return
    // Form sai thì antd reject kèm lỗi từng ô — đã hiện dưới ô, không cần ném tiếp.
    const values = await rejectForm.validateFields().catch(() => null)
    if (!values) return
    const { reason } = values
    await setStatus(rejecting, {
      status: 'rejected',
      rejectReason: reason.trim(),
      rejectedAt: new Date().toISOString()
    })
    setRejecting(null)
  }

  return (
    <>
      <ResourceManager
        collection='bookings'
        title={t('nav.bookings')}
        description={t('bookings.description')}
        allowDelete={false}
        searchText={(item) => `${item.id} ${item.customerName} ${item.phone}`}
        initialQuery={initialQuery}
        filterItems={(item) => ofConsultant(item) && matchesView(item, view)}
        filterKey={`${view}|${consultantId}|${date?.format('YYYY-MM-DD') ?? ''}`}
        extraActions={
          <Space wrap>
            <Select
              value={consultantId}
              onChange={setConsultantId}
              style={{ minWidth: 220 }}
              options={[
                { value: 'all', label: t('bookings.allConsultants') },
                ...consultants.map((consultant) => ({ value: consultant.id, label: consultant.name }))
              ]}
            />
            <DatePicker value={date} onChange={setDate} format='DD/MM/YYYY' placeholder={t('bookings.filterDate')} />
          </Space>
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
            // Chỉ hiện thao tác hợp lệ với trạng thái hiện tại (§1); lịch đã từ
            // chối / hoàn tất không còn nút nào (§7).
            render: (_, record) => {
              if (record.status === 'pending') {
                const conflict = conflictOf(record)
                return (
                  <div className='flex items-center gap-1.5 whitespace-nowrap'>
                    <Popconfirm
                      disabled={Boolean(conflict)}
                      title={t('bookings.confirmTitle', { code: record.id })}
                      description={
                        <div style={{ maxWidth: 260 }}>
                          {record.customerName} · {record.consultantName}
                          <br />
                          {dayjs(record.date).format('DD/MM/YYYY')} · {record.time}
                        </div>
                      }
                      okText={t('bookings.confirm')}
                      cancelText={t('actions.cancel')}
                      onConfirm={() =>
                        setStatus(record, { status: 'confirmed', confirmedAt: new Date().toISOString() })
                      }
                    >
                      <Tooltip title={conflict ?? undefined}>
                        <Button
                          size='small'
                          type='primary'
                          icon={<CheckOutlined />}
                          disabled={Boolean(conflict)}
                          style={{ width: BUTTON_WIDTH }}
                        >
                          {t('bookings.confirm')}
                        </Button>
                      </Tooltip>
                    </Popconfirm>
                    <Button
                      size='small'
                      danger
                      icon={<CloseOutlined />}
                      style={{ width: BUTTON_WIDTH }}
                      onClick={() => setRejecting(record)}
                    >
                      {t('bookings.reject')}
                    </Button>
                  </div>
                )
              }
              if (record.status === 'confirmed') {
                const canComplete = slotEnd(record).isBefore(dayjs())
                return (
                  <Popconfirm
                    disabled={!canComplete}
                    title={t('bookings.completeTitle', { code: record.id })}
                    okText={t('bookings.markDone')}
                    cancelText={t('actions.cancel')}
                    onConfirm={() => setStatus(record, { status: 'done', completedAt: new Date().toISOString() })}
                  >
                    <Tooltip
                      title={
                        canComplete
                          ? undefined
                          : t('bookings.completeFrom', { time: slotEnd(record).format('HH:mm DD/MM/YYYY') })
                      }
                    >
                      <Button
                        size='small'
                        icon={<SmileOutlined />}
                        disabled={!canComplete}
                        style={{ width: BUTTON_WIDTH }}
                      >
                        {t('bookings.markDone')}
                      </Button>
                    </Tooltip>
                  </Popconfirm>
                )
              }
              return <Text type='secondary'>-</Text>
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
            <Descriptions.Item label={t('bookings.email')}>{booking.email ?? '-'}</Descriptions.Item>
            <Descriptions.Item label={t('bookings.phone')}>
              <Text copyable>{booking.phone}</Text>
            </Descriptions.Item>
            <Descriptions.Item label={t('bookings.consultant')}>{booking.consultantName}</Descriptions.Item>
            {booking.note ? <Descriptions.Item label={t('bookings.note')}>{booking.note}</Descriptions.Item> : null}
            <Descriptions.Item label={t('bookings.status')}>
              <Tag color={STATUS_TAG[booking.status]}>{t(`bookingStatus.${booking.status}`)}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label={t('bookings.createdAt')}>{formatStamp(booking.createdAt)}</Descriptions.Item>
            {booking.confirmedAt ? (
              <Descriptions.Item label={t('bookings.confirmedAt')}>
                {formatStamp(booking.confirmedAt)}
              </Descriptions.Item>
            ) : null}
            {booking.rejectedAt ? (
              <Descriptions.Item label={t('bookings.rejectedAt')}>{formatStamp(booking.rejectedAt)}</Descriptions.Item>
            ) : null}
            {booking.rejectReason ? (
              <Descriptions.Item label={t('bookings.rejectReason')}>{booking.rejectReason}</Descriptions.Item>
            ) : null}
            {booking.completedAt ? (
              <Descriptions.Item label={t('bookings.completedAt')}>
                {formatStamp(booking.completedAt)}
              </Descriptions.Item>
            ) : null}
          </Descriptions>
        )}
        renderForm={() => (
          <Form.Item name='opsNote' label={t('bookings.opsNote')} extra={t('bookings.opsNoteHint')}>
            <Input.TextArea rows={3} />
          </Form.Item>
        )}
      />

      <Modal
        open={rejecting !== null}
        onCancel={() => setRejecting(null)}
        onOk={submitReject}
        confirmLoading={save.isPending}
        okText={t('bookings.reject')}
        okButtonProps={{ danger: true }}
        cancelText={t('actions.cancel')}
        title={rejecting ? t('bookings.rejectTitle', { code: rejecting.id }) : ''}
        destroyOnHidden
      >
        {rejecting ? (
          <Form form={rejectForm} layout='vertical'>
            <Alert
              type='warning'
              showIcon
              style={{ marginBottom: 16 }}
              title={`${rejecting.customerName} · ${rejecting.consultantName}`}
              description={`${dayjs(rejecting.date).format('DD/MM/YYYY')} · ${rejecting.time}`}
            />
            {minutesUntil(rejecting) < NEAR_MINUTES ? (
              <Alert
                type='error'
                showIcon
                style={{ marginBottom: 16 }}
                title={t('bookings.nearWarning')}
                description={
                  minutesUntil(rejecting) >= 0
                    ? t('bookings.startsIn', { minutes: minutesUntil(rejecting) })
                    : t('bookings.overdueBy', { minutes: -minutesUntil(rejecting) })
                }
              />
            ) : null}
            <Form.Item
              name='reason'
              label={t('bookings.rejectReason')}
              rules={[
                { required: true, whitespace: true, message: t('bookings.rejectReasonRequired') },
                { max: 500, message: t('bookings.rejectReasonMax') }
              ]}
            >
              <Input.TextArea rows={3} maxLength={500} showCount />
            </Form.Item>
          </Form>
        ) : null}
      </Modal>
    </>
  )
}
