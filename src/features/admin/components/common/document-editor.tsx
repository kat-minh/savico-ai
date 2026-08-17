'use client'

import { App, Button, Card, Form, Skeleton, Space, type FormInstance } from 'antd'
import { useTranslations } from 'next-intl'
import { useEffect, type ReactNode } from 'react'

import type { CmsDocument, CmsDocumentMap } from '@/shared/cms'
import { useAdminDocument, useSaveAdminDocument } from '../../hooks/use-admin-data'
import { AdminPage } from './admin-page'
import { ContentLocaleBanner } from './content-locale-banner'

/**
 * Trình soạn cho các nội dung "chỉ có MỘT bản": trang chủ, trang tĩnh, cài đặt
 * site. Khác `ResourceManager` ở chỗ không có bảng và không có thêm / xóa —
 * mở ra là thấy ngay nội dung hiện tại, sửa rồi Lưu.
 */
export function DocumentEditor<K extends CmsDocument>({
  document,
  title,
  description,
  children,
  extraActions
}: {
  document: K
  title: string
  description?: string
  children: (form: FormInstance) => ReactNode
  extraActions?: ReactNode
}) {
  const t = useTranslations('admin')
  const { message } = App.useApp()
  const [form] = Form.useForm()

  const { data, isPending } = useAdminDocument(document)
  const save = useSaveAdminDocument(document)

  // Dữ liệu về sau khi form đã mount, nên nạp lại giá trị khi nó tới.
  useEffect(() => {
    if (data) form.setFieldsValue(data)
  }, [data, form])

  async function submit() {
    const values = (await form.validateFields()) as CmsDocumentMap[K]
    await save.mutateAsync({ ...(data as CmsDocumentMap[K]), ...values })
    message.success(t('feedback.saved'))
  }

  return (
    <AdminPage
      title={title}
      description={description}
      actions={
        <Space>
          {extraActions}
          <Button onClick={() => data && form.setFieldsValue(data)}>{t('actions.revert')}</Button>
          <Button type='primary' loading={save.isPending} onClick={submit}>
            {t('actions.save')}
          </Button>
        </Space>
      }
    >
      <ContentLocaleBanner />
      <Card>
        {isPending ? (
          <Skeleton active paragraph={{ rows: 8 }} />
        ) : (
          <Form form={form} layout='vertical' initialValues={data}>
            {children(form)}
          </Form>
        )}
      </Card>
    </AdminPage>
  )
}
