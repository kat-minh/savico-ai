'use client'

import { App, Avatar, Form, Input, InputNumber, Tag } from 'antd'
import { useTranslations } from 'next-intl'

import type { CmsTestimonial } from '@/shared/cms'
import { useAdminCollection, useSaveAdminItem } from '../../hooks/use-admin-data'
import { newAdminId } from '../../services/admin.service'
import { ImageUrlField, StatusSwitch } from '../common/field-kit'
import { ResourceManager } from '../common/resource-manager'

/**
 * NHẬN XÉT KHÁCH HÀNG — dải "Khách hàng nói về BuildX" của trang chủ: ảnh đại diện, tên, thông tin
 * công trình và nội dung. Ba trường chữ để trống nghĩa là dùng bản dịch mặc định của site
 * (`landing.testimonials.items.<id>`), nên ô sửa điền sẵn chữ đang hiện trên site để admin sửa tại chỗ.
 * Không xóa cứng — chuyển Inactive là ẩn khỏi trang chủ.
 */
export function TestimonialManager() {
  const t = useTranslations('admin')
  const tDefault = useTranslations('landing.testimonials')
  const { message } = App.useApp()
  const { data: items = [] } = useAdminCollection('testimonials')
  const save = useSaveAdminItem('testimonials')

  const defaultText = (id: string, field: 'name' | 'meta' | 'quote') => {
    const key = `items.${id}.${field}` as Parameters<typeof tDefault>[0]
    return tDefault.has(key) ? tDefault(key) : ''
  }

  /** Chữ đang hiện trên site: bản admin đã soạn, rỗng thì bản dịch mặc định (chỉ có cho sáu mã gốc). */
  const effective = (item: CmsTestimonial, field: 'name' | 'meta' | 'quote') =>
    item[field].trim() || defaultText(item.id, field)

  return (
    <ResourceManager
      collection='testimonials'
      title={t('nav.testimonials')}
      description={t('testimonials.description')}
      drawerWidth={640}
      allowDelete={false}
      searchText={(item) => `${effective(item, 'name')} ${effective(item, 'meta')}`}
      createItem={(): CmsTestimonial => ({
        id: newAdminId('tm'),
        name: '',
        meta: '',
        quote: '',
        avatarUrl: '',
        status: 'active',
        order: items.reduce((max, item) => Math.max(max, item.order), 0) + 1
      })}
      toFormValues={(item) => ({
        ...item,
        name: effective(item, 'name'),
        meta: effective(item, 'meta'),
        quote: effective(item, 'quote')
      })}
      fromFormValues={(values, current) => ({
        ...current,
        ...values,
        name: String(values.name ?? '').trim(),
        meta: String(values.meta ?? '').trim(),
        quote: String(values.quote ?? '').trim(),
        avatarUrl: String(values.avatarUrl ?? '').trim()
      })}
      rowActions={(item) => {
        const active = item.status === 'active'
        return (
          <StatusSwitch
            name={effective(item, 'name')}
            current={active ? 'Active' : 'Inactive'}
            next={active ? 'Inactive' : 'Active'}
            onConfirm={async () => {
              await save.mutateAsync({ ...item, status: active ? 'inactive' : 'active' })
              message.success(t('feedback.saved'))
            }}
          />
        )
      }}
      columns={[
        {
          title: t('testimonials.order'),
          dataIndex: 'order',
          width: 90,
          defaultSortOrder: 'ascend',
          sorter: (a, b) => a.order - b.order
        },
        {
          title: t('testimonials.avatar'),
          key: 'avatar',
          width: 90,
          render: (_, record) => (
            <Avatar src={record.avatarUrl || undefined} size={36}>
              {effective(record, 'name').slice(0, 1)}
            </Avatar>
          )
        },
        { title: t('testimonials.name'), key: 'name', render: (_, record) => effective(record, 'name') },
        { title: t('testimonials.meta'), key: 'meta', render: (_, record) => effective(record, 'meta') },
        {
          title: t('articles.status'),
          dataIndex: 'status',
          width: 120,
          render: (status: CmsTestimonial['status']) => (
            <Tag color={status === 'active' ? 'green' : 'default'}>{status === 'active' ? 'Active' : 'Inactive'}</Tag>
          )
        }
      ]}
      renderForm={(form) => (
        <>
          <ImageUrlField form={form} name='avatarUrl' label={t('testimonials.avatar')} />
          <Form.Item
            name='name'
            label={t('testimonials.name')}
            rules={[
              { required: true, whitespace: true, message: t('fields.requiredMessage') },
              { max: 80, message: t('fields.maxLength', { max: 80 }) }
            ]}
          >
            <Input maxLength={80} />
          </Form.Item>
          <Form.Item
            name='meta'
            label={t('testimonials.meta')}
            extra={t('testimonials.metaHint')}
            rules={[{ max: 120, message: t('fields.maxLength', { max: 120 }) }]}
          >
            <Input maxLength={120} />
          </Form.Item>
          <Form.Item
            name='quote'
            label={t('testimonials.quote')}
            rules={[
              { required: true, whitespace: true, message: t('fields.requiredMessage') },
              { max: 400, message: t('fields.maxLength', { max: 400 }) }
            ]}
          >
            <Input.TextArea rows={5} maxLength={400} showCount />
          </Form.Item>
          <Form.Item
            name='order'
            label={t('testimonials.order')}
            extra={t('testimonials.orderHint')}
            rules={[{ required: true, type: 'integer', min: 1, message: t('testimonials.orderRule') }]}
          >
            <InputNumber min={1} precision={0} style={{ width: 160 }} />
          </Form.Item>
        </>
      )}
    />
  )
}
