'use client'

import { Form, Input } from 'antd'
import { useTranslations } from 'next-intl'

import { SectionListField } from '../common/field-kit'
import { DocumentEditor } from '../common/document-editor'

type StaticPageKey = 'termsPage' | 'privacyPage'

/**
 * Sửa một trang tĩnh ở chân trang (mục II.2): Điều khoản sử dụng hoặc Chính sách
 * bảo mật. Bên A gửi bản chính thức trước go-live (Q&A §8.2) nên đây là màn phải
 * dùng ngay ngày bàn giao.
 *
 * Hai trang là hai TAB của màn "Trang tĩnh", không phải một `Segmented` nhét
 * cạnh nút Lưu như trước — bộ chọn trang mà đứng chung hàng với nút hành động
 * thì trông y như một cái nút, rất dễ bấm nhầm.
 */
function StaticPageEditor({ document, label }: { document: StaticPageKey; label: string }) {
  const t = useTranslations('admin')

  return (
    <DocumentEditor document={document} title={label} description={t('staticPages.description')}>
      {() => (
        <>
          <Form.Item name='title' label={t('staticPages.title')}>
            <Input />
          </Form.Item>
          <Form.Item name='updatedNote' label={t('staticPages.updatedNote')}>
            <Input />
          </Form.Item>
          <Form.Item name='intro' label={t('staticPages.intro')}>
            <Input.TextArea autoSize={{ minRows: 3, maxRows: 6 }} />
          </Form.Item>
          <SectionListField
            name='sections'
            label={t('staticPages.sections')}
            headingLabel={t('staticPages.sectionHeading')}
            bodyLabel={t('staticPages.sectionBody')}
          />
        </>
      )}
    </DocumentEditor>
  )
}

export function TermsPageEditor() {
  const t = useTranslations('admin')
  return <StaticPageEditor document='termsPage' label={t('staticPages.terms')} />
}

export function PrivacyPageEditor() {
  const t = useTranslations('admin')
  return <StaticPageEditor document='privacyPage' label={t('staticPages.privacy')} />
}
