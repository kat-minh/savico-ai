'use client'

import { Form, Image, Input, Typography, type FormInstance } from 'antd'
import type { NamePath } from 'antd/es/form/interface'
import { useTranslations } from 'next-intl'

const { Text } = Typography

/** Trần độ dài URL mà BMT nhận cho ảnh / tệp đã upload. */
export const UPLOADED_URL_MAX = 2048

/** Luật form: URL tuyệt đối https, tối đa 2048 ký tự — đúng điều kiện BE kiểm. */
export function useHttpsUrlRule() {
  const t = useTranslations('admin.estimateCatalog')
  return {
    validator: (_: unknown, value: unknown) => {
      const url = String(value ?? '').trim()
      if (!url) return Promise.resolve()
      return /^https:\/\/\S+$/i.test(url) && url.length <= UPLOADED_URL_MAX
        ? Promise.resolve()
        : Promise.reject(new Error(t('httpsUrl')))
    }
  }
}

/**
 * Ô URL ảnh bắt buộc có xem trước, cho dữ liệu nằm trên BMT API: BE không nhận
 * tệp mà chỉ nhận URL https thuộc kho presign — màn chưa có nút upload nên
 * người vận hành dán URL đã upload sẵn.
 */
export function HttpsImageField({ form, name, label }: { form: FormInstance; name: NamePath; label: string }) {
  const t = useTranslations('admin')
  const httpsRule = useHttpsUrlRule()
  const value = Form.useWatch(name, form) as string | undefined

  return (
    <Form.Item label={label} required style={{ marginBottom: 16 }}>
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
          rules={[{ required: true, whitespace: true, message: t('fields.requiredMessage') }, httpsRule]}
          style={{ flex: 1, marginBottom: 0 }}
        >
          <Input placeholder='https://…' />
        </Form.Item>
      </div>
    </Form.Item>
  )
}
