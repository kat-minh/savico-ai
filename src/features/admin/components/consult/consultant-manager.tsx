'use client'

import { CalendarOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import {
  App,
  Avatar,
  Button,
  Col,
  Descriptions,
  Form,
  Input,
  InputNumber,
  Rate,
  Row,
  Select,
  Space,
  Tag,
  Tooltip,
  Typography
} from 'antd'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

import type { CmsBooking, Consultant } from '@/shared/cms'
import { useAdminCollection, useSaveAdminItem } from '../../hooks/use-admin-data'
import { newAdminId, slugify, todayKey } from '../../services/admin.service'
import { ImageUrlField, StatusSwitch } from '../common/field-kit'
import { ResourceManager } from '../common/resource-manager'
import { ConsultantScheduleModal } from './consultant-schedule'

const { Text } = Typography

/** Số ảnh công trình tiêu biểu tối đa (ArchitectManagement §3). */
const MAX_WORKS = 4

interface FormValues {
  name: string
  title: string
  avatarUrl: string
  intro: string
  specialties: string[]
  yearsExperience: number
  works: Consultant['works']
  visible: boolean
}

/**
 * KIẾN TRÚC SƯ TƯ VẤN 1:1 (epic ArchitectManagement).
 *
 * Thêm / sửa hồ sơ; KHÔNG xóa — chỉ chuyển sang Ẩn (lịch đã đặt vẫn trỏ tới
 * hồ sơ này). KTS mới mặc định Ẩn. Điểm và số lượt đánh giá do hệ thống tổng
 * hợp, không nhập tay. Nút lịch mở màn Quản lý lịch tư vấn.
 */
export function ConsultantManager() {
  const t = useTranslations('admin')
  const { message } = App.useApp()
  const { data: consultants = [] } = useAdminCollection('consultants')
  const { data: bookings = [] } = useAdminCollection('bookings')
  const save = useSaveAdminItem('consultants')

  const [specialty, setSpecialty] = useState<string>('all')
  const [status, setStatus] = useState<'all' | 'visible' | 'hidden'>('all')
  const [scheduleFor, setScheduleFor] = useState<string | null>(null)

  const today = todayKey()
  const upcomingOf = (consultant: Consultant): CmsBooking[] =>
    bookings.filter(
      (booking) =>
        booking.consultantId === consultant.id &&
        booking.date >= today &&
        (booking.status === 'pending' || booking.status === 'confirmed')
    )
  const specialtyOptions = [
    ...new Map(consultants.flatMap((c) => c.specialties).map((item) => [item.label, item.label])).values()
  ].map((label) => ({ value: label, label }))
  const statusLabel = (visible: boolean) => (visible ? t('consultants.shown') : t('consultants.hidden'))

  return (
    <>
      <ResourceManager
        collection='consultants'
        title={t('nav.consultants')}
        description={t('consultants.description')}
        drawerWidth={680}
        allowDelete={false}
        searchText={(item) => item.name}
        filterItems={(item) =>
          (specialty === 'all' || item.specialties.some((s) => s.label === specialty)) &&
          (status === 'all' || item.visible === (status === 'visible'))
        }
        filterKey={`${specialty}|${status}`}
        banner={
          <Space wrap>
            <Select
              value={specialty}
              onChange={setSpecialty}
              style={{ minWidth: 200 }}
              options={[{ value: 'all', label: t('consultants.allSpecialties') }, ...specialtyOptions]}
            />
            <Select<'all' | 'visible' | 'hidden'>
              value={status}
              onChange={setStatus}
              style={{ minWidth: 180 }}
              options={[
                { value: 'all', label: t('consultants.allStatuses') },
                { value: 'visible', label: t('consultants.shown') },
                { value: 'hidden', label: t('consultants.hidden') }
              ]}
            />
          </Space>
        }
        createItem={(): Consultant => ({
          id: newAdminId('kts'),
          name: '',
          title: '',
          avatarUrl: '',
          specialties: [],
          yearsExperience: 0,
          projectCount: 0,
          headline: '',
          bio: [],
          rating: 0,
          reviewCount: 0,
          works: [],
          // KTS mới luôn Ẩn cho tới khi hoàn thiện hồ sơ (§3).
          visible: false
        })}
        toFormValues={(item) => ({
          ...item,
          intro: item.bio.join('\n'),
          specialties: item.specialties.map((s) => s.label)
        })}
        fromFormValues={(values, current) => {
          const form = values as unknown as FormValues
          const bio = form.intro
            .split('\n')
            .map((line) => line.trim())
            .filter(Boolean)
          return {
            ...current,
            name: form.name.trim(),
            title: form.title.trim(),
            avatarUrl: form.avatarUrl,
            bio,
            // Thẻ lưới dùng dòng đầu của phần giới thiệu làm mô tả ngắn.
            headline: bio[0] ?? '',
            specialties: form.specialties.map((label) => ({ id: slugify(label), label: label.trim() })),
            yearsExperience: form.yearsExperience,
            works: (form.works ?? []).filter((work) => work.imageUrl).slice(0, MAX_WORKS),
            visible: form.visible
          }
        }}
        rowActions={(item) => {
          const upcoming = upcomingOf(item)
          return (
            <>
              <Tooltip title={t('consultants.manageSchedule')}>
                <Button
                  type='text'
                  size='small'
                  icon={<CalendarOutlined />}
                  aria-label={t('consultants.manageSchedule')}
                  onClick={() => setScheduleFor(item.id)}
                />
              </Tooltip>
              <StatusSwitch
                name={item.name}
                current={statusLabel(item.visible)}
                next={statusLabel(!item.visible)}
                warning={
                  item.visible && upcoming.length > 0 ? (
                    <Text type='warning'>{t('consultants.hideWarning', { count: upcoming.length })}</Text>
                  ) : null
                }
                onConfirm={async () => {
                  await save.mutateAsync({ ...item, visible: !item.visible })
                  message.success(t('feedback.saved'))
                }}
              />
            </>
          )
        }}
        renderView={(item) => (
          <Descriptions
            size='small'
            column={1}
            bordered
            items={[
              {
                key: 'avatar',
                label: t('consultants.avatar'),
                children: <Avatar src={item.avatarUrl} size={64} />
              },
              { key: 'name', label: t('consultants.name'), children: item.name },
              { key: 'title', label: t('consultants.title'), children: item.title },
              { key: 'intro', label: t('consultants.intro'), children: item.bio.join(' ') },
              {
                key: 'specialties',
                label: t('consultants.specialties'),
                children: item.specialties.map((s) => <Tag key={s.id}>{s.label}</Tag>)
              },
              {
                key: 'years',
                label: t('consultants.experience'),
                children: t('consultants.years', { years: item.yearsExperience })
              },
              {
                key: 'rating',
                label: t('consultants.rating'),
                children: item.reviewCount
                  ? `${item.rating.toFixed(1)}/5 (${item.reviewCount})`
                  : t('consultants.noReviews')
              },
              {
                key: 'works',
                label: t('consultants.works'),
                children: (
                  <Space wrap>
                    {item.works.map((work) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={work.imageUrl}
                        src={work.imageUrl}
                        alt={work.label}
                        width={96}
                        height={72}
                        style={{ objectFit: 'cover', borderRadius: 6 }}
                      />
                    ))}
                  </Space>
                )
              },
              { key: 'status', label: t('consultants.status'), children: statusLabel(item.visible) },
              {
                key: 'upcoming',
                label: t('consultants.upcoming'),
                children: upcomingOf(item).length
              }
            ]}
          />
        )}
        columns={[
          {
            title: t('consultants.name'),
            dataIndex: 'name',
            render: (_, record) => (
              <Space size={10}>
                <Avatar src={record.avatarUrl} size={36}>
                  {record.name.slice(0, 1)}
                </Avatar>
                <div style={{ minWidth: 0 }}>
                  <Text strong style={{ display: 'block' }}>
                    {record.name}
                  </Text>
                  <Text type='secondary' style={{ fontSize: 12 }}>
                    {record.title}
                  </Text>
                </div>
              </Space>
            )
          },
          {
            title: t('consultants.specialties'),
            key: 'specialties',
            width: 220,
            render: (_, record) => (
              <Space size={4} wrap>
                {record.specialties.map((s) => (
                  <Tag key={s.id}>{s.label}</Tag>
                ))}
              </Space>
            )
          },
          {
            title: t('consultants.experience'),
            dataIndex: 'yearsExperience',
            width: 120,
            render: (years: number) => t('consultants.years', { years })
          },
          {
            title: t('consultants.rating'),
            dataIndex: 'rating',
            width: 150,
            render: (rating: number, record) =>
              record.reviewCount ? (
                <Space size={6}>
                  <Text strong>{rating.toFixed(1)}</Text>
                  <Text type='secondary' style={{ fontSize: 12 }}>
                    ({record.reviewCount})
                  </Text>
                </Space>
              ) : (
                <Text type='secondary'>{t('consultants.noReviews')}</Text>
              )
          },
          {
            title: t('consultants.status'),
            dataIndex: 'visible',
            width: 190,
            render: (visible: boolean, record) => (
              <Space orientation='vertical' size={2}>
                <Tag color={visible ? 'green' : 'default'}>{statusLabel(visible)}</Tag>
                {!visible && upcomingOf(record).length > 0 ? (
                  <Text type='warning' style={{ fontSize: 12 }}>
                    {t('consultants.hiddenWithBookings', { count: upcomingOf(record).length })}
                  </Text>
                ) : null}
              </Space>
            )
          }
        ]}
        renderForm={(form) => (
          <>
            <ImageUrlField form={form} name='avatarUrl' label={t('consultants.avatar')} required />
            <Row gutter={16}>
              <Col xs={24} md={14}>
                <Form.Item
                  name='name'
                  label={t('consultants.name')}
                  rules={[
                    { required: true, whitespace: true, message: t('fields.requiredMessage') },
                    { min: 2, max: 100, message: t('consultants.nameLength') }
                  ]}
                >
                  <Input maxLength={100} placeholder='KTS. Nguyễn Văn A' />
                </Form.Item>
              </Col>
              <Col xs={24} md={10}>
                <Form.Item
                  name='title'
                  label={t('consultants.title')}
                  rules={[
                    { required: true, whitespace: true, message: t('fields.requiredMessage') },
                    { max: 100, message: t('fields.maxLength', { max: 100 }) }
                  ]}
                >
                  <Input maxLength={100} />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item
              name='intro'
              label={t('consultants.intro')}
              extra={t('consultants.introHint')}
              rules={[
                { required: true, whitespace: true, message: t('fields.requiredMessage') },
                { max: 1000, message: t('fields.maxLength', { max: 1000 }) }
              ]}
            >
              <Input.TextArea rows={4} maxLength={1000} showCount />
            </Form.Item>
            <Row gutter={16}>
              <Col xs={24} md={16}>
                <Form.Item
                  name='specialties'
                  label={t('consultants.specialties')}
                  extra={t('consultants.specialtiesHint')}
                  rules={[{ required: true, type: 'array', min: 1, message: t('consultants.specialtyRequired') }]}
                >
                  <Select mode='tags' options={specialtyOptions} />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item
                  name='yearsExperience'
                  label={t('consultants.experience')}
                  rules={[{ required: true, type: 'integer', min: 0, message: t('consultants.yearsRule') }]}
                >
                  <InputNumber min={0} precision={0} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item label={t('consultants.works')} tooltip={t('consultants.worksHint')}>
              <Form.List name='works'>
                {(fields, { add, remove }) => (
                  <Space orientation='vertical' size={8} style={{ width: '100%' }}>
                    {fields.map((field) => (
                      <Row key={field.key} gutter={8}>
                        <Col xs={13}>
                          <Form.Item name={[field.name, 'imageUrl']} noStyle>
                            <Input placeholder='https://…' />
                          </Form.Item>
                        </Col>
                        <Col xs={9}>
                          <Form.Item name={[field.name, 'label']} noStyle>
                            <Input placeholder={t('consultants.workLabel')} />
                          </Form.Item>
                        </Col>
                        <Col xs={2}>
                          <Button
                            type='text'
                            danger
                            icon={<DeleteOutlined />}
                            aria-label={t('actions.removeRow')}
                            onClick={() => remove(field.name)}
                          />
                        </Col>
                      </Row>
                    ))}
                    <Button
                      type='dashed'
                      block
                      icon={<PlusOutlined />}
                      disabled={fields.length >= MAX_WORKS}
                      onClick={() => add({ imageUrl: '', label: '' })}
                    >
                      {t('actions.addRow')}
                    </Button>
                  </Space>
                )}
              </Form.List>
            </Form.Item>

            <Form.Item name='visible' label={t('consultants.status')}>
              <Select
                options={[
                  { value: true, label: t('consultants.shown') },
                  { value: false, label: t('consultants.hidden') }
                ]}
              />
            </Form.Item>

            {/* Chỉ đọc: điểm và số lượt đánh giá do hệ thống tổng hợp từ đánh giá
                của khách — spec cấm admin nhập tay. */}
            <Form.Item label={t('consultants.rating')} extra={t('consultants.ratingReadOnly')} shouldUpdate>
              {() => {
                const reviewCount = (form.getFieldValue('reviewCount') as number | undefined) ?? 0
                return reviewCount ? (
                  <Space>
                    <Rate allowHalf disabled value={(form.getFieldValue('rating') as number) ?? 0} />
                    <Text type='secondary'>({reviewCount})</Text>
                  </Space>
                ) : (
                  <Text type='secondary'>{t('consultants.noReviews')}</Text>
                )
              }}
            </Form.Item>
          </>
        )}
      />

      <ConsultantScheduleModal
        consultant={consultants.find((item) => item.id === scheduleFor) ?? null}
        onClose={() => setScheduleFor(null)}
      />
    </>
  )
}
