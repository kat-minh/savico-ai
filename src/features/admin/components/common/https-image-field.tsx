'use client'

import { Form } from 'antd'
import type { NamePath } from 'antd/es/form/interface'
import { useTranslations } from 'next-intl'

import { ImagePicker } from './image-upload-button'

/** Trần độ dài URL mà BMT nhận cho ảnh / tệp đã upload. */
export const UPLOADED_URL_MAX = 2048

/**
 * Luật form: URL tuyệt đối https, tối đa 2048 ký tự — đúng điều kiện BE kiểm.
 * Còn dùng ở các panel thư viện, nơi tệp không phải ảnh (bản vẽ PDF…) vẫn phải
 * dán URL vì nút tải lên hiện chỉ nhận ảnh.
 */
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
 * Ô ảnh BẮT BUỘC cho dữ liệu nằm trên BMT API.
 *
 * Trước đây màn chưa có nút tải ảnh nên phải bắt người vận hành dán URL https.
 * Từ khi MEDIA bật (presign 3 bước), ô dán URL đã bỏ: chỉ còn chọn tệp, URL do
 * backend trả về sau khi xác minh và được giữ ngầm trong form.
 */
export function HttpsImageField({ name, label }: { name: NamePath; label: string }) {
  const t = useTranslations('admin')

  return (
    <Form.Item
      name={name}
      label={label}
      required
      rules={[{ required: true, message: t('fields.requiredMessage') }]}
      style={{ marginBottom: 16 }}
    >
      <ImagePicker />
    </Form.Item>
  )
}
