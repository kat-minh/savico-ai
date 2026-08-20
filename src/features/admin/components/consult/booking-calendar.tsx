'use client'

import {
  App,
  Badge,
  Button,
  Calendar,
  Card,
  Col,
  Drawer,
  Form,
  Grid,
  Input,
  Row,
  Select,
  Space,
  Tag,
  Typography
} from 'antd'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import { useLocale, useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'

import type { CmsBooking, CmsBookingStatus } from '@/shared/cms'
import { useAdminCollection, useSaveAdminItem } from '../../hooks/use-admin-data'
import { AdminPage } from '../common/admin-page'

const { Text } = Typography

const STATUSES: CmsBookingStatus[] = ['pending', 'confirmed', 'done', 'cancelled']

/** Màu chấm sự kiện theo trạng thái — cùng bảng màu với Tag ở các màn khác. */
const STATUS_BADGE: Record<CmsBookingStatus, 'warning' | 'success' | 'processing' | 'error'> = {
  pending: 'warning',
  confirmed: 'success',
  done: 'processing',
  cancelled: 'error'
}

const STATUS_TAG: Record<CmsBookingStatus, string> = {
  pending: 'gold',
  confirmed: 'green',
  done: 'blue',
  cancelled: 'red'
}

/**
 * Lịch hẹn tư vấn dạng LỊCH THÁNG, kiểu Google Calendar.
 *
 * Bảng dòng-cột trả lời "có những lịch nào", nhưng câu vận hành thật sự cần là
 * "tuần này dày mỏng ra sao, hôm nào trống, hôm nào dồn cục" — thứ chỉ lịch
 * tháng nhìn ra được. Mỗi ô ngày liệt kê các cuộc hẹn kèm chấm màu trạng thái;
 * bấm một cuộc hẹn để xác nhận / đổi trạng thái / ghi chú ngay trong Drawer.
 */
export function BookingCalendar() {
  const t = useTranslations('admin')
  const locale = useLocale()
  const screens = Grid.useBreakpoint()
  const { message } = App.useApp()
  const [form] = Form.useForm()

  const { data } = useAdminCollection('bookings')
  const { data: consultants } = useAdminCollection('consultants')
  const save = useSaveAdminItem('bookings')

  const [editing, setEditing] = useState<CmsBooking | null>(null)
  /** Lọc theo KTS — người điều phối thường xem lịch của một người một lúc. */
  const [consultantId, setConsultantId] = useState<string>('all')

  const bookings = useMemo(() => {
    const all = (data ?? []) as CmsBooking[]
    return consultantId === 'all' ? all : all.filter((booking) => booking.consultantId === consultantId)
  }, [data, consultantId])

  const byDate = useMemo(() => {
    const map = new Map<string, CmsBooking[]>()
    for (const booking of bookings) {
      map.set(booking.date, [...(map.get(booking.date) ?? []), booking])
    }
    // Trong một ngày xếp theo giờ, đúng thứ tự sẽ diễn ra.
    for (const list of map.values()) list.sort((a, b) => a.time.localeCompare(b.time))
    return map
  }, [bookings])

  function openEditor(booking: CmsBooking) {
    setEditing(booking)
    form.setFieldsValue(booking)
  }

  function closeEditor() {
    setEditing(null)
    form.resetFields()
  }

  async function submit() {
    if (!editing) return
    const values = (await form.validateFields()) as Partial<CmsBooking>
    await save.mutateAsync({ ...editing, ...values })
    message.success(t('feedback.saved'))
    closeEditor()
  }

  function cellRender(date: Dayjs) {
    const list = byDate.get(date.format('YYYY-MM-DD'))
    if (!list?.length) return null

    // Ô lịch chỉ đủ chỗ cho vài dòng — quá thì dồn phần còn lại vào "+n nữa".
    const shown = list.slice(0, 3)
    return (
      <div className='flex flex-col gap-0.5'>
        {shown.map((booking) => (
          <button
            key={booking.id}
            type='button'
            onClick={(event) => {
              // Đừng để Calendar đổi ngày đang chọn khi bấm vào một cuộc hẹn.
              event.stopPropagation()
              openEditor(booking)
            }}
            className='block w-full cursor-pointer truncate rounded border-0 bg-transparent p-0 text-left text-xs hover:underline'
          >
            <Badge status={STATUS_BADGE[booking.status]} text={`${booking.time} · ${booking.customerName}`} />
          </button>
        ))}
        {list.length > shown.length ? (
          <Text type='secondary' style={{ fontSize: 11 }}>
            {t('bookings.moreOnDay', { count: list.length - shown.length })}
          </Text>
        ) : null}
      </div>
    )
  }

  return (
    <AdminPage
      title={t('nav.bookings')}
      description={t('bookings.description')}
      actions={
        <Space wrap>
          <Select
            value={consultantId}
            onChange={setConsultantId}
            style={{ minWidth: 220 }}
            options={[
              { value: 'all', label: t('bookings.allConsultants') },
              ...(consultants ?? []).map((consultant) => ({ value: consultant.id, label: consultant.name }))
            ]}
          />
          <Space size={10} wrap>
            {STATUSES.map((status) => (
              <Badge key={status} status={STATUS_BADGE[status]} text={t(`bookingStatus.${status}`)} />
            ))}
          </Space>
        </Space>
      }
    >
      <Card styles={{ body: { padding: screens.md ? 16 : 8 } }}>
        <Calendar cellRender={(date, info) => (info.type === 'date' ? cellRender(date) : info.originNode)} />
      </Card>

      <Drawer
        open={editing !== null}
        onClose={closeEditor}
        size={screens.md ? 480 : '100%'}
        destroyOnHidden
        title={editing ? `${editing.id} · ${editing.customerName}` : ''}
        extra={
          <Space>
            <Button onClick={closeEditor}>{t('actions.cancel')}</Button>
            <Button type='primary' loading={save.isPending} onClick={submit}>
              {t('actions.save')}
            </Button>
          </Space>
        }
      >
        {editing ? (
          <>
            <Space orientation='vertical' size={4} style={{ marginBottom: 16 }}>
              <Text>
                {t('bookings.consultant')}: <Text strong>{editing.consultantName}</Text>
              </Text>
              <Text type='secondary'>
                {t('bookings.phone')}: {editing.phone} · {t('bookings.createdAt')}: {editing.createdAt}
              </Text>
              <Tag color={STATUS_TAG[editing.status]}>{t(`bookingStatus.${editing.status}`)}</Tag>
            </Space>

            <Form form={form} layout='vertical'>
              <Row gutter={16}>
                <Col xs={12}>
                  <Form.Item name='date' label={t('bookings.date')}>
                    <Input placeholder={dayjs().locale(locale).format('YYYY-MM-DD')} />
                  </Form.Item>
                </Col>
                <Col xs={12}>
                  <Form.Item name='time' label={t('bookings.time')}>
                    <Input placeholder='09:00' />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item name='status' label={t('bookings.status')}>
                <Select options={STATUSES.map((value) => ({ label: t(`bookingStatus.${value}`), value }))} />
              </Form.Item>
              <Form.Item name='note' label={t('bookings.note')}>
                <Input.TextArea autoSize={{ minRows: 3, maxRows: 6 }} />
              </Form.Item>
            </Form>
          </>
        ) : null}
      </Drawer>
    </AdminPage>
  )
}
