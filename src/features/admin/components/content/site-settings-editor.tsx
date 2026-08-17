'use client'

import { App, Button, Col, Divider, Form, Input, Popconfirm, Row } from 'antd'
import { useTranslations } from 'next-intl'

import { useResetAdminContent } from '../../hooks/use-admin-data'
import { DocumentEditor } from '../common/document-editor'

/**
 * Cài đặt site: thương hiệu, liên hệ, mạng xã hội, pháp lý ở chân trang
 * (mục II.2) và thẻ SEO mặc định.
 *
 * Kèm nút "Khôi phục nội dung mặc định" — xoá mọi thay đổi CMS, đưa toàn bộ site
 * về bộ nội dung gốc. Hữu ích khi demo cho khách xong muốn trả lại như cũ.
 */
export function SiteSettingsEditor() {
  const t = useTranslations('admin')
  const { message } = App.useApp()
  const reset = useResetAdminContent()

  return (
    <DocumentEditor
      document='settings'
      title={t('nav.settings')}
      description={t('settings.description')}
      extraActions={
        <Popconfirm
          title={t('settings.resetConfirmTitle')}
          description={t('settings.resetConfirmBody')}
          okText={t('actions.confirm')}
          okButtonProps={{ danger: true }}
          cancelText={t('actions.cancel')}
          onConfirm={async () => {
            await reset.mutateAsync()
            message.success(t('settings.resetDone'))
          }}
        >
          <Button danger loading={reset.isPending}>
            {t('settings.reset')}
          </Button>
        </Popconfirm>
      }
    >
      {() => (
        <>
          <Divider titlePlacement='start'>{t('settings.brandGroup')}</Divider>
          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item name='brandName' label={t('settings.brandName')}>
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} md={16}>
              <Form.Item name='tagline' label={t('settings.tagline')}>
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Divider titlePlacement='start'>{t('settings.contactGroup')}</Divider>
          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item name='hotline' label={t('settings.hotline')}>
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name='email' label={t('settings.email')}>
                <Input type='email' />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name='address' label={t('settings.address')}>
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Divider titlePlacement='start'>{t('settings.socialGroup')}</Divider>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item name='zaloUrl' label='Zalo'>
                <Input placeholder='https://zalo.me/…' />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name='messengerUrl' label='Messenger'>
                <Input placeholder='https://m.me/…' />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name='facebookUrl' label='Facebook'>
                <Input placeholder='https://facebook.com/…' />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name='youtubeUrl' label='YouTube'>
                <Input placeholder='https://youtube.com/@…' />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name='tiktokUrl' label='TikTok'>
                <Input placeholder='https://tiktok.com/@…' />
              </Form.Item>
            </Col>
          </Row>

          <Divider titlePlacement='start'>{t('settings.legalGroup')}</Divider>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item name='companyName' label={t('settings.companyName')}>
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name='taxCode' label={t('settings.taxCode')}>
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Divider titlePlacement='start'>{t('settings.seoGroup')}</Divider>
          <Form.Item name='seoTitle' label={t('settings.seoTitle')}>
            <Input />
          </Form.Item>
          <Form.Item name='seoDescription' label={t('settings.seoDescription')}>
            <Input.TextArea autoSize={{ minRows: 2, maxRows: 4 }} />
          </Form.Item>
          <Form.Item
            name='maintenanceNotice'
            label={t('settings.maintenanceNotice')}
            tooltip={t('settings.maintenanceHint')}
          >
            <Input />
          </Form.Item>
        </>
      )}
    </DocumentEditor>
  )
}
