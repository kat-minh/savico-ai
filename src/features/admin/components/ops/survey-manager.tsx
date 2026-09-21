'use client'

import { CalendarOutlined, CheckOutlined, CloseOutlined, PhoneOutlined } from '@ant-design/icons'
import { Alert, App, Button, DatePicker, Form, Input, Modal, Segmented, Select, Space, Tag, Typography } from 'antd'
import dayjs, { type Dayjs } from 'dayjs'
import { useLocale, useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'

import type { Locale } from '@/i18n/routing'
import {
  SURVEY_SLOTS,
  surveySlotId,
  surveySlotLabel,
  type CmsContractorInvitation,
  type CmsSurveyStatus
} from '@/shared/cms'
import { useAdminCollection, useSaveAdminItem } from '../../hooks/use-admin-data'
import { relativeTime, surveyNeedsAction, surveyStatusOf, updateSurvey } from '../../services/ops.service'
import { ResourceManager } from '../common/resource-manager'

const { Text } = Typography

const STATUS_TAG: Record<CmsSurveyStatus, string> = {
  requested: 'gold',
  rescheduled: 'orange',
  confirmed: 'green',
  cancelled: 'default'
}

type View = 'action' | 'confirmed' | 'all'
type Action = 'confirm' | 'reschedule' | 'cancel'

interface FormValues {
  date?: Dayjs
  slotId?: string
  note: string
}

/**
 * LỊCH KHẢO SÁT — hàng đợi gọi điện của vận hành (S16–S17, R3).
 *
 * Khách chọn giờ ở S16 rồi mọi thứ diễn ra ngoài web. Vận hành là người GỌI HAI
 * ĐẦU: gọi nhà thầu xem giờ đó có đi được không, gọi khách chốt lại. Vì vậy mỗi
 * dòng đặt số điện thoại của cả khách lẫn nhà thầu ngay cạnh nhau — hai cuộc
 * gọi đầu tiên của ngày không phải mở thêm màn nào.
 *
 * Mỗi lịch gắn với một lời mời báo giá (một nhà thầu), nên bảng đọc thẳng bảng
 * lời mời: không có kho lịch riêng để phải giữ cho khớp.
 *
 * Mặc định lọc "Cần gọi" = lịch mới đặt + lịch vừa đổi giờ mà chưa chốt lại.
 */
export function SurveyManager() {
  const t = useTranslations('admin')
  const locale = useLocale() as Locale
  const { message } = App.useApp()
  const [form] = Form.useForm<FormValues>()

  const [view, setView] = useState<View>('action')
  const [pending, setPending] = useState<{ action: Action; invitation: CmsContractorInvitation } | null>(null)

  const { data: invitations = [] } = useAdminCollection('contractorInvitations')
  const { data: contractors = [] } = useAdminCollection('contractors')
  const save = useSaveAdminItem('contractorInvitations')

  const contactOf = useMemo(() => {
    const map = new Map(contractors.map((contractor) => [contractor.id, contractor.contact]))
    return (contractorId: string) => map.get(contractorId)
  }, [contractors])

  const counts = {
    action: invitations.filter(surveyNeedsAction).length,
    confirmed: invitations.filter((item) => surveyStatusOf(item) === 'confirmed').length,
    all: invitations.length
  }

  const inView = (item: CmsContractorInvitation) => {
    if (view === 'action') return surveyNeedsAction(item)
    if (view === 'confirmed') return surveyStatusOf(item) === 'confirmed'
    return true
  }

  function open(action: Action, invitation: CmsContractorInvitation) {
    form.setFieldsValue({
      date: dayjs(invitation.survey.date),
      slotId: invitation.survey.slotId,
      note: ''
    })
    setPending({ action, invitation })
  }

  async function submit() {
    if (!pending) return
    const values = await form.validateFields()
    const status: CmsSurveyStatus =
      pending.action === 'confirm' ? 'confirmed' : pending.action === 'cancel' ? 'cancelled' : 'rescheduled'

    await save.mutateAsync(
      updateSurvey(pending.invitation, {
        status,
        note: values.note,
        ...(pending.action === 'reschedule' && values.date
          ? { date: values.date.format('YYYY-MM-DD'), ...(values.slotId ? { slotId: values.slotId } : {}) }
          : {})
      })
    )
    message.success(t(`surveys.toast.${pending.action}`, { code: pending.invitation.id }))
    setPending(null)
  }

  return (
    <>
      <ResourceManager
        collection='contractorInvitations'
        title={t('nav.surveys')}
        description={t('surveys.description')}
        allowDelete={false}
        allowEdit={false}
        searchText={(item) =>
          `${item.id} ${item.projectId} ${item.projectName} ${item.contractorName} ${item.survey.phone} ${item.survey.email}`
        }
        filterItems={inView}
        banner={
          <Segmented<View>
            value={view}
            onChange={setView}
            options={(['action', 'confirmed', 'all'] as const).map((value) => ({
              value,
              label: `${t(`surveys.views.${value}`)} (${counts[value]})`
            }))}
          />
        }
        columns={[
          {
            title: t('surveys.when'),
            key: 'when',
            width: 170,
            sorter: (a, b) => `${a.survey.date}${a.survey.slotId}`.localeCompare(`${b.survey.date}${b.survey.slotId}`),
            defaultSortOrder: 'ascend' as const,
            render: (_, record) => (
              <div>
                <Text strong style={{ display: 'block' }}>
                  {dayjs(record.survey.date).format('DD/MM/YYYY')}
                </Text>
                <Text type='secondary' style={{ fontSize: 12 }}>
                  {surveySlotLabel(record.survey.slotId)}
                </Text>
              </div>
            )
          },
          {
            title: t('surveys.project'),
            key: 'project',
            render: (_, record) => (
              <div style={{ minWidth: 0 }}>
                <Text strong style={{ display: 'block' }}>
                  {record.projectName}
                </Text>
                <Text type='secondary' style={{ fontSize: 12 }}>
                  {record.projectId} · {record.id}
                </Text>
              </div>
            )
          },
          {
            title: t('surveys.customer'),
            key: 'customer',
            width: 210,
            render: (_, record) => (
              <div style={{ minWidth: 0 }}>
                <Text copyable style={{ display: 'block' }}>
                  <PhoneOutlined /> {record.survey.phone}
                </Text>
                <Text type='secondary' style={{ fontSize: 12 }}>
                  {record.survey.email}
                </Text>
                {record.survey.note ? (
                  <Text
                    type='secondary'
                    style={{ display: 'block', fontSize: 12 }}
                    ellipsis={{ tooltip: record.survey.note }}
                  >
                    “{record.survey.note}”
                  </Text>
                ) : null}
              </div>
            )
          },
          {
            title: t('surveys.contractor'),
            key: 'contractor',
            width: 220,
            render: (_, record) => {
              const contact = contactOf(record.contractorId)
              return (
                <div style={{ minWidth: 0 }}>
                  <Text strong style={{ display: 'block' }}>
                    {record.contractorName}
                  </Text>
                  {contact ? (
                    <Text copyable type='secondary' style={{ fontSize: 12 }}>
                      {contact.person} · {contact.phone}
                    </Text>
                  ) : (
                    <Text type='warning' style={{ fontSize: 12 }}>
                      {t('surveys.noContact')}
                    </Text>
                  )}
                </div>
              )
            }
          },
          {
            title: t('surveys.status'),
            key: 'status',
            width: 170,
            render: (_, record) => {
              const status = surveyStatusOf(record)
              return (
                <div>
                  <Tag color={STATUS_TAG[status]}>{t(`surveyStatus.${status}`)}</Tag>
                  <Text type='secondary' style={{ display: 'block', fontSize: 12 }}>
                    {record.survey.handledAt
                      ? t('surveys.handledAgo', { time: relativeTime(record.survey.handledAt, locale) })
                      : t('surveys.requestedAgo', { time: relativeTime(record.sentAt, locale) })}
                  </Text>
                  {record.survey.opsNote ? (
                    <Text
                      type='secondary'
                      style={{ display: 'block', fontSize: 12 }}
                      ellipsis={{ tooltip: record.survey.opsNote }}
                    >
                      {record.survey.opsNote}
                    </Text>
                  ) : null}
                </div>
              )
            }
          },
          {
            title: t('table.actions'),
            key: 'decide',
            width: 330,
            render: (_, record) => {
              const status = surveyStatusOf(record)
              const closed = status === 'cancelled'
              // Ba nút luôn có mặt, cùng bề ngang ở mọi dòng — nút không dùng được
              // thì mờ đi chứ không biến mất, để cột không nhảy theo trạng thái.
              return (
                <div className='flex items-center gap-1.5 whitespace-nowrap'>
                  <Button
                    size='small'
                    type='primary'
                    icon={<CheckOutlined />}
                    disabled={closed || status === 'confirmed'}
                    style={{ width: 104 }}
                    onClick={() => open('confirm', record)}
                  >
                    {t('surveys.confirm')}
                  </Button>
                  <Button
                    size='small'
                    icon={<CalendarOutlined />}
                    disabled={closed}
                    style={{ width: 96 }}
                    onClick={() => open('reschedule', record)}
                  >
                    {t('surveys.reschedule')}
                  </Button>
                  <Button
                    size='small'
                    danger
                    icon={<CloseOutlined />}
                    disabled={closed}
                    style={{ width: 96 }}
                    onClick={() => open('cancel', record)}
                  >
                    {t('surveys.cancel')}
                  </Button>
                </div>
              )
            }
          }
        ]}
        renderForm={() => null}
      />

      <Modal
        open={pending !== null}
        onCancel={() => setPending(null)}
        onOk={submit}
        confirmLoading={save.isPending}
        okText={pending ? t(`surveys.${pending.action}`) : ''}
        okButtonProps={{ danger: pending?.action === 'cancel' }}
        cancelText={t('actions.cancel')}
        title={pending ? t(`surveys.modalTitle.${pending.action}`, { code: pending.invitation.id }) : ''}
        destroyOnHidden
      >
        {pending ? (
          <Form form={form} layout='vertical'>
            <Alert
              type={pending.action === 'cancel' ? 'warning' : 'info'}
              showIcon
              style={{ marginBottom: 16 }}
              title={t(`surveys.modalHint.${pending.action}`, {
                contractor: pending.invitation.contractorName,
                phone: pending.invitation.survey.phone
              })}
            />
            {pending.action === 'reschedule' ? (
              <Space size={12} style={{ width: '100%' }} wrap>
                <Form.Item
                  name='date'
                  label={t('surveys.newDate')}
                  rules={[{ required: true, message: t('fields.requiredMessage') }]}
                >
                  <DatePicker
                    format='DD/MM/YYYY'
                    disabledDate={(day) => day.isBefore(dayjs(), 'day') || day.day() === 0}
                  />
                </Form.Item>
                <Form.Item
                  name='slotId'
                  label={t('surveys.newSlot')}
                  rules={[{ required: true, message: t('fields.requiredMessage') }]}
                >
                  <Select
                    style={{ minWidth: 180 }}
                    options={SURVEY_SLOTS.map((label, index) => ({ value: surveySlotId(index), label }))}
                  />
                </Form.Item>
              </Space>
            ) : null}
            <Form.Item
              name='note'
              label={t('surveys.opsNote')}
              rules={pending.action === 'confirm' ? [] : [{ required: true, message: t('surveys.noteRequired') }]}
            >
              <Input.TextArea rows={2} placeholder={t('surveys.opsNotePlaceholder')} />
            </Form.Item>
          </Form>
        ) : null}
      </Modal>
    </>
  )
}
