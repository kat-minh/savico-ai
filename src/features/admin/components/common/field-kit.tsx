'use client'

import { DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import { Button, Form, Image, Input, Space, Typography, type FormInstance } from 'antd'
import { useTranslations } from 'next-intl'
import type { NamePath } from 'antd/es/form/interface'

const { Text } = Typography

/**
 * Các trường form dùng lại nhiều lần trong khu quản trị.
 *
 * Ba thứ lặp đi lặp lại ở mọi màn: ô ảnh có xem trước, danh sách chuỗi (mô tả
 * nhiều đoạn, tiểu sử KTS) và danh sách mục có tiêu đề + nội dung (thân bài
 * viết, điều khoản). Gom về đây để mọi màn nhập liệu giống nhau.
 */

/** Ô nhập URL ảnh kèm ô xem trước — bắt lỗi dán nhầm link ngay tại chỗ. */
export function ImageUrlField({
  form,
  name,
  label,
  required
}: {
  form: FormInstance
  name: NamePath
  label: string
  required?: boolean
}) {
  const t = useTranslations('admin')
  const value = Form.useWatch(name, form) as string | undefined

  return (
    <Form.Item label={label} required={required} style={{ marginBottom: 16 }} tooltip={t('fields.imageUrlHint')}>
      {/* Flex tay chứ không dùng `Space`: item của Space không giãn, ô URL sẽ co
          lại còn một mẩu và cắt mất phần đuôi link. */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div
          style={{
            width: 84,
            height: 60,
            flexShrink: 0,
            borderRadius: 8,
            overflow: 'hidden',
            background: 'var(--admin-placeholder)',
            display: 'grid',
            placeItems: 'center'
          }}
        >
          {value ? (
            <Image src={value} alt='' width={84} height={60} style={{ objectFit: 'cover' }} />
          ) : (
            <Text type='secondary' style={{ fontSize: 11 }}>
              {t('fields.noImage')}
            </Text>
          )}
        </div>
        <Form.Item
          name={name}
          rules={required ? [{ required: true, message: t('fields.requiredMessage') }] : undefined}
          noStyle
        >
          <Input placeholder='https://…' style={{ flex: 1 }} />
        </Form.Item>
      </div>
    </Form.Item>
  )
}

/** Danh sách chuỗi — mỗi phần tử một đoạn / một dòng. */
export function StringListField({
  name,
  label,
  placeholder,
  textarea
}: {
  name: NamePath
  label: string
  placeholder?: string
  textarea?: boolean
}) {
  const t = useTranslations('admin')

  return (
    <Form.Item label={label} style={{ marginBottom: 16 }}>
      <Form.List name={name}>
        {(fields, { add, remove }) => (
          <Space orientation='vertical' size={8} style={{ width: '100%' }}>
            {/* Từng dòng là flex tay: item của `Space` không giãn nên ô nhập sẽ
                teo lại còn một cột hẹp dù thẻ cha rộng cả ngăn kéo. */}
            {/* Tách `key` ra khỏi phần spread: React cảnh báo khi key đi lẫn
                trong props object. */}
            {fields.map(({ key, ...field }) => (
              <div key={key} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <Form.Item {...field} noStyle>
                  {textarea ? (
                    <Input.TextArea
                      autoSize={{ minRows: 2, maxRows: 6 }}
                      placeholder={placeholder}
                      style={{ flex: 1 }}
                    />
                  ) : (
                    <Input placeholder={placeholder} style={{ flex: 1 }} />
                  )}
                </Form.Item>
                <Button
                  type='text'
                  danger
                  icon={<DeleteOutlined />}
                  aria-label={t('actions.removeRow')}
                  onClick={() => remove(field.name)}
                />
              </div>
            ))}
            <Button type='dashed' block icon={<PlusOutlined />} onClick={() => add('')}>
              {t('actions.addRow')}
            </Button>
          </Space>
        )}
      </Form.List>
    </Form.Item>
  )
}

/**
 * Danh sách mục "tiêu đề + nội dung" — thân bài viết Cẩm nang, các điều của
 * trang Điều khoản / Bảo mật.
 */
export function SectionListField({
  name,
  label,
  headingLabel,
  bodyLabel,
  bodyAsList
}: {
  name: NamePath
  label: string
  headingLabel: string
  bodyLabel: string
  /** `true` khi nội dung là mảng đoạn văn (`paragraphs`) thay vì một chuỗi. */
  bodyAsList?: boolean
}) {
  const t = useTranslations('admin')

  return (
    <Form.Item label={label} style={{ marginBottom: 16 }}>
      <Form.List name={name}>
        {(fields, { add, remove }) => (
          <Space orientation='vertical' size={12} style={{ width: '100%' }}>
            {fields.map((field, index) => (
              <div key={field.key} style={{ border: '1px solid var(--admin-border)', borderRadius: 10, padding: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                  <Text strong style={{ flex: 1 }}>
                    {t('fields.sectionIndex', { index: index + 1 })}
                  </Text>
                  <Button
                    type='text'
                    danger
                    size='small'
                    icon={<DeleteOutlined />}
                    aria-label={t('actions.removeRow')}
                    onClick={() => remove(field.name)}
                  />
                </div>
                <Form.Item name={[field.name, 'heading']} label={headingLabel} style={{ marginBottom: 10 }}>
                  <Input />
                </Form.Item>
                {bodyAsList ? (
                  <StringListField name={[field.name, 'paragraphs']} label={bodyLabel} textarea />
                ) : (
                  <Form.Item name={[field.name, 'body']} label={bodyLabel} style={{ marginBottom: 0 }}>
                    <Input.TextArea autoSize={{ minRows: 3, maxRows: 8 }} />
                  </Form.Item>
                )}
              </div>
            ))}
            <Button
              type='dashed'
              block
              icon={<PlusOutlined />}
              onClick={() => add(bodyAsList ? { heading: '', paragraphs: [''] } : { heading: '', body: '' })}
            >
              {t('actions.addSection')}
            </Button>
          </Space>
        )}
      </Form.List>
    </Form.Item>
  )
}
