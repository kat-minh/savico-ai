'use client'

import { DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import { Button, Col, Form, Image, Input, Row, Space, Typography, type FormInstance } from 'antd'
import { useTranslations } from 'next-intl'
import type { NamePath } from 'antd/es/form/interface'

const { Text } = Typography

/**
 * Các trường form dùng lại nhiều lần trong khu quản trị.
 *
 * Bốn thứ lặp đi lặp lại ở mọi màn: ô ảnh có xem trước, danh sách chuỗi (mô tả
 * nhiều đoạn, tiểu sử KTS), danh sách mục có tiêu đề + nội dung (thân bài viết,
 * điều khoản) và bảng dòng nhiều cột (điểm cam kết, dải 3 bước). Gom về đây để
 * mọi màn nhập liệu giống nhau.
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
          lại còn một mẩu và cắt mất phần đuôi link. Canh giữa theo chiều dọc để
          ô nhập không dính lên mép trên của khung xem trước. */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
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
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
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

/** Một cột của {@link RowListField}. */
export interface RowListColumn {
  /** Tên trường trong từng phần tử của mảng. */
  name: string
  label: string
  /** Số cột trên lưới 24 của antd ở khổ `md` trở lên. */
  span: number
  /** Ô khóa (mã khớp icon / khóa dịch) — hiện mờ, không cho sửa. */
  locked?: boolean
  placeholder?: string
}

/**
 * Bảng dòng nhiều cột: dải 3 điểm cam kết, dải 3 bước, và mọi danh sách "mỗi
 * dòng vài trường ngắn" khác.
 *
 * Có HÀNG TIÊU ĐỀ CỘT hẳn hoi. Trước đây mỗi ô chỉ có placeholder, mà placeholder
 * biến mất ngay khi ô có chữ — nhìn vào bảng đã điền thì không còn biết cột nào
 * là gì, và ô mã bị khóa trông y như một ô hỏng.
 */
export function RowListField({
  name,
  columns,
  emptyRow,
  addLabel
}: {
  name: NamePath
  columns: readonly RowListColumn[]
  /** Giá trị của một dòng mới. */
  emptyRow: () => Record<string, unknown>
  addLabel?: string
}) {
  const t = useTranslations('admin')
  // Cột cuối chừa 2/24 cho nút xóa, đúng bằng bề ngang nút icon của antd.
  const ACTION_SPAN = 2

  return (
    <Form.List name={name}>
      {(fields, { add, remove }) => (
        <Space orientation='vertical' size={8} style={{ width: '100%' }}>
          {fields.length > 0 ? (
            <Row gutter={8} className='px-1'>
              {columns.map((column) => (
                <Col key={column.name} xs={0} md={column.span}>
                  <Text type='secondary' style={{ fontSize: 12 }}>
                    {column.label}
                  </Text>
                </Col>
              ))}
              <Col xs={0} md={ACTION_SPAN} />
            </Row>
          ) : null}

          {fields.map((field) => (
            <Row key={field.key} gutter={8} align='middle'>
              {columns.map((column) => (
                <Col key={column.name} xs={24} md={column.span}>
                  {/* Khổ hẹp lưới xếp chồng nên placeholder là thứ duy nhất còn
                      chỉ ra cột — giữ lại nhãn ở đó. */}
                  <Form.Item name={[field.name, column.name]} style={{ marginBottom: 8 }}>
                    <Input disabled={column.locked} placeholder={column.placeholder ?? column.label} />
                  </Form.Item>
                </Col>
              ))}
              <Col xs={24} md={ACTION_SPAN}>
                <Button
                  type='text'
                  danger
                  icon={<DeleteOutlined />}
                  aria-label={t('actions.removeRow')}
                  onClick={() => remove(field.name)}
                  style={{ marginBottom: 8 }}
                />
              </Col>
            </Row>
          ))}

          <Button type='dashed' block icon={<PlusOutlined />} onClick={() => add(emptyRow())}>
            {addLabel ?? t('actions.addRow')}
          </Button>
        </Space>
      )}
    </Form.List>
  )
}
