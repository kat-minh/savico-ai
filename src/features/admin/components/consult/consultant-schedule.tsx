'use client'

import { Alert, App, Button, Empty, Modal, Space, Switch, Tag, Tooltip, Typography } from 'antd'
import dayjs from 'dayjs'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

import { Link } from '@/i18n/navigation'
import {
  CONSULT_SESSION_TIMES,
  bookingAt,
  consultSlotState,
  type CmsBooking,
  type CmsConsultClosure,
  type Consultant,
  type ConsultSession
} from '@/shared/cms'
import { ADMIN_ROUTES } from '@/shared/constants'
import { useAdminCollection, useSaveAdminItem } from '../../hooks/use-admin-data'
import { todayKey } from '../../services/admin.service'

const { Text } = Typography

/** Số ngày tới admin quản lý lịch. */
const SCHEDULE_DAYS = 14
const SESSIONS: ConsultSession[] = ['morning', 'afternoon']

const SLOT_COLOR = { open: 'green', closed: 'default', full: 'orange' } as const

/**
 * QUẢN LÝ LỊCH TƯ VẤN của một kiến trúc sư (epic ArchitectManagement §5–§6).
 *
 * Đánh dấu Không tư vấn cả ngày, một buổi hoặc từng khung giờ chưa có người
 * đặt. Khung "Kín" (đã có lịch Chờ xác nhận / Đã xác nhận) không mở lại được và
 * KHÔNG tự hủy khi khóa: ngày hoặc buổi còn lịch đặt thì nút khóa bị vô hiệu
 * hóa, kèm danh sách lịch cần xử lý ở màn Lịch đặt tư vấn trước.
 */
export function ConsultantScheduleModal({
  consultant,
  onClose
}: {
  consultant: Consultant | null
  onClose: () => void
}) {
  const t = useTranslations('admin')
  const { message } = App.useApp()
  const { data: bookings = [] } = useAdminCollection('bookings')
  const save = useSaveAdminItem('consultants')
  const [draft, setDraft] = useState<CmsConsultClosure[] | null>(null)
  const [openedFor, setOpenedFor] = useState<string | null>(null)

  // Mở cho KTS khác → nạp lại bản nháp từ cấu hình đang lưu.
  if (consultant && openedFor !== consultant.id) {
    setOpenedFor(consultant.id)
    setDraft(consultant.closures ?? [])
  }
  if (!consultant && openedFor !== null) {
    setOpenedFor(null)
    setDraft(null)
  }

  const closures = draft ?? []
  const today = todayKey()
  const days = Array.from({ length: SCHEDULE_DAYS }, (_, index) => dayjs(today).add(index, 'day').format('YYYY-MM-DD'))

  const hasDay = (date: string) => closures.some((c) => c.date === date && !c.session && !c.time)
  const hasSession = (date: string, session: ConsultSession) =>
    closures.some((c) => c.date === date && c.session === session && !c.time)
  const hasSlot = (date: string, time: string) => closures.some((c) => c.date === date && c.time === time)

  const bookingsIn = (date: string, session?: ConsultSession): CmsBooking[] =>
    consultant
      ? (session
          ? CONSULT_SESSION_TIMES[session]
          : [...CONSULT_SESSION_TIMES.morning, ...CONSULT_SESSION_TIMES.afternoon]
        )
          .map((time) => bookingAt(bookings, consultant.id, date, time))
          .filter((booking): booking is CmsBooking => Boolean(booking))
      : []

  const toggle = (match: (c: CmsConsultClosure) => boolean, entry: CmsConsultClosure, on: boolean) =>
    setDraft((current) => {
      const rest = (current ?? []).filter((c) => !match(c))
      return on ? [...rest, entry] : rest
    })

  const submit = async () => {
    if (!consultant) return
    // Bỏ các phạm vi đã qua — không còn ý nghĩa với lịch đặt mới.
    await save.mutateAsync({ ...consultant, closures: closures.filter((c) => c.date >= today) })
    message.success(t('feedback.saved'))
    onClose()
  }

  const affectedList = (items: CmsBooking[]) => (
    <Alert
      type='warning'
      showIcon
      style={{ marginTop: 8 }}
      title={t('consultants.affected', { count: items.length })}
      description={
        <ul className='m-0 pl-4'>
          {items.map((booking) => (
            <li key={booking.id}>
              <Link href={`${ADMIN_ROUTES.BOOKINGS}?q=${booking.id}`}>{booking.id}</Link> · {booking.time} ·{' '}
              {booking.customerName}
            </li>
          ))}
        </ul>
      }
    />
  )

  return (
    <Modal
      open={consultant !== null}
      onCancel={onClose}
      onOk={submit}
      okText={t('actions.save')}
      cancelText={t('actions.cancel')}
      confirmLoading={save.isPending}
      width={880}
      title={consultant ? t('consultants.scheduleTitle', { name: consultant.name }) : ''}
      destroyOnHidden
    >
      <Text type='secondary' style={{ display: 'block', marginBottom: 12 }}>
        {t('consultants.scheduleHint')}
      </Text>
      <Space size={6} wrap style={{ marginBottom: 12 }}>
        {(['open', 'closed', 'full'] as const).map((state) => (
          <Tag key={state} color={SLOT_COLOR[state]}>
            {t(`consultants.slotStates.${state}`)}
          </Tag>
        ))}
      </Space>
      {consultant ? (
        <div className='flex max-h-[60vh] flex-col gap-3 overflow-y-auto pr-1'>
          {days.map((date) => {
            const dayClosed = hasDay(date)
            const dayBookings = bookingsIn(date)
            return (
              <div key={date} className='rounded-lg border border-[var(--admin-border)] p-3'>
                <div className='flex flex-wrap items-center justify-between gap-2'>
                  <Text strong>{dayjs(date).format('dddd, DD/MM/YYYY')}</Text>
                  <Tooltip title={!dayClosed && dayBookings.length ? t('consultants.lockBlocked') : undefined}>
                    <Space size={6}>
                      <Text type='secondary' style={{ fontSize: 12 }}>
                        {t('consultants.closeDay')}
                      </Text>
                      <Switch
                        size='small'
                        checked={dayClosed}
                        disabled={!dayClosed && dayBookings.length > 0}
                        onChange={(on) => toggle((c) => c.date === date && !c.session && !c.time, { date }, on)}
                      />
                    </Space>
                  </Tooltip>
                </div>
                {SESSIONS.map((session) => {
                  const sessionClosed = dayClosed || hasSession(date, session)
                  const sessionBookings = bookingsIn(date, session)
                  return (
                    <div key={session} className='mt-2 flex flex-wrap items-center gap-2'>
                      <div className='flex w-40 items-center gap-2'>
                        <Switch
                          size='small'
                          checked={!sessionClosed}
                          disabled={dayClosed || (!hasSession(date, session) && sessionBookings.length > 0)}
                          onChange={(open) =>
                            toggle((c) => c.date === date && c.session === session && !c.time, { date, session }, !open)
                          }
                        />
                        <Text>{t(`consultants.sessions.${session}`)}</Text>
                      </div>
                      {CONSULT_SESSION_TIMES[session].map((time) => {
                        const state = consultSlotState(closures, bookings, consultant.id, date, time)
                        const coveredByRange = sessionClosed && !hasSlot(date, time)
                        return (
                          <Tooltip
                            key={time}
                            title={
                              state === 'full'
                                ? t('consultants.slotFull')
                                : coveredByRange
                                  ? t('consultants.slotRangeClosed')
                                  : undefined
                            }
                          >
                            <Tag
                              color={SLOT_COLOR[state]}
                              style={{ cursor: state === 'full' || coveredByRange ? 'not-allowed' : 'pointer' }}
                              onClick={() => {
                                if (state === 'full' || coveredByRange) return
                                toggle((c) => c.date === date && c.time === time, { date, time }, state === 'open')
                              }}
                            >
                              {time}
                            </Tag>
                          </Tooltip>
                        )
                      })}
                    </div>
                  )
                })}
                {dayBookings.length > 0 && !dayClosed ? affectedList(dayBookings) : null}
              </div>
            )
          })}
        </div>
      ) : (
        <Empty />
      )}
      <Button type='link' style={{ paddingLeft: 0, marginTop: 8 }} onClick={() => setDraft(consultant?.closures ?? [])}>
        {t('actions.revert')}
      </Button>
    </Modal>
  )
}
