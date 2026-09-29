'use client'

import { DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import { Button, Form, Image, Input, Radio, Space, Typography, type FormInstance } from 'antd'
import { useTranslations } from 'next-intl'

import { useHttpsUrlRule } from '../common/https-image-field'
import { ASSET_EXTENSIONS, extensionOf, fileNameOf } from './library-assets.helpers'

const { Text } = Typography

/**
 * Khu "Ảnh mẫu" trong form TẠO mẫu: dán nhiều URL ảnh https đã upload, chọn ảnh
 * bìa. Chỉ thu thập dữ liệu — việc tạo asset + gắn vào phiên bản do `onCreate`
 * của màn quản lý làm sau khi mẫu (và phiên bản đầu) đã được tạo, vì asset cần
 * `versionId` chỉ có sau khi tạo. BE chưa có upload file nên vẫn nhập URL.
 *
 * Giá trị form: `images: { url }[]` và `coverIndex: number` (chỉ số ảnh bìa).
 */
export function LibraryCreateImages({ form }: { form: FormInstance }) {
  const l = useTranslations('admin.library')
  const t = useTranslations('admin')
  const httpsRule = useHttpsUrlRule()
  const images = (Form.useWatch('images', form) as Array<{ url?: string } | undefined> | undefined) ?? []

  /** Luật: bỏ trống thì bỏ qua; có URL thì phải là ảnh JPG/PNG/WebP. */
  const imageFormatRule = {
    validator: (_: unknown, value: unknown) => {
      const url = String(value ?? '').trim()
      if (!url) return Promise.resolve()
      const ok = ASSET_EXTENSIONS.Image[extensionOf(fileNameOf(url))] ?? ASSET_EXTENSIONS.Image[extensionOf(url)]
      return ok ? Promise.resolve() : Promise.reject(new Error(l('imageFormat')))
    }
  }

  return (
    <div style={{ marginBottom: 16 }}>
      <Text strong style={{ display: 'block' }}>
        {l('createImagesTitle')}
      </Text>
      <Text type='secondary' style={{ display: 'block', marginBottom: 8, fontSize: 12 }}>
        {l('createImagesHint')}
      </Text>

      <Form.Item name='coverIndex' noStyle>
        <Radio.Group style={{ width: '100%' }}>
          <Form.List name='images'>
            {(fields, { add, remove }) => (
              <Space orientation='vertical' size={8} style={{ width: '100%' }}>
                {fields.map(({ key, name, ...rest }) => {
                  const url = images[name]?.url?.trim()
                  return (
                    <div key={key} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                      <div
                        style={{
                          width: 56,
                          height: 42,
                          flexShrink: 0,
                          borderRadius: 6,
                          overflow: 'hidden',
                          background: 'var(--admin-placeholder)',
                          display: 'grid',
                          placeItems: 'center'
                        }}
                      >
                        {url ? (
                          <Image src={url} alt='' width={56} height={42} style={{ objectFit: 'cover' }} />
                        ) : (
                          <Text type='secondary' style={{ fontSize: 10 }}>
                            {t('fields.noImage')}
                          </Text>
                        )}
                      </div>
                      <Form.Item
                        {...rest}
                        name={[name, 'url']}
                        rules={[httpsRule, imageFormatRule]}
                        style={{ flex: 1, marginBottom: 0 }}
                      >
                        <Input placeholder='https://….jpg' />
                      </Form.Item>
                      <Radio value={name} style={{ marginTop: 6, whiteSpace: 'nowrap' }}>
                        {l('cover')}
                      </Radio>
                      <Button
                        type='text'
                        danger
                        icon={<DeleteOutlined />}
                        aria-label={t('actions.delete')}
                        onClick={() => remove(name)}
                      />
                    </div>
                  )
                })}
                <Button
                  type='dashed'
                  icon={<PlusOutlined />}
                  onClick={() => {
                    // Ảnh đầu tiên mặc định là ảnh bìa.
                    if (fields.length === 0) form.setFieldValue('coverIndex', 0)
                    add()
                  }}
                  style={{ width: '100%' }}
                >
                  {l('addImage')}
                </Button>
              </Space>
            )}
          </Form.List>
        </Radio.Group>
      </Form.Item>
    </div>
  )
}
