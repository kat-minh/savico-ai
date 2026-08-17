'use client'

import { Form, Input, Segmented } from 'antd'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

import { SectionListField } from '../common/field-kit'
import { DocumentEditor } from '../common/document-editor'

type StaticPageKey = 'termsPage' | 'privacyPage'

/**
 * Sửa hai trang tĩnh ở chân trang (mục II.2): Điều khoản sử dụng và Chính sách
 * bảo mật. Bên A gửi bản chính thức trước go-live (Q&A §8.2) nên đây là màn phải
 * dùng ngay ngày bàn giao.
 *
 * `key` ép DocumentEditor mount lại khi đổi trang — nếu không form sẽ giữ giá
 * trị của trang trước.
 */
export function StaticPagesEditor() {
  const t = useTranslations('admin')
  const [page, setPage] = useState<StaticPageKey>('termsPage')

  return (
    <DocumentEditor
      key={page}
      document={page}
      title={t('nav.staticPages')}
      description={t('staticPages.description')}
      extraActions={
        <Segmented
          value={page}
          onChange={(value) => setPage(value as StaticPageKey)}
          options={[
            { label: t('staticPages.terms'), value: 'termsPage' },
            { label: t('staticPages.privacy'), value: 'privacyPage' }
          ]}
        />
      }
    >
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
