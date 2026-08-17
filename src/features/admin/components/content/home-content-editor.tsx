'use client'

import { DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import { Alert, Button, Col, Divider, Form, Input, Row, Space, Typography } from 'antd'
import { useTranslations } from 'next-intl'

import { DocumentEditor } from '../common/document-editor'

const { Text } = Typography

/**
 * Sửa nội dung trang chủ (mục II.2): thông điệp hero, hai nút CTA, dải 3 điểm
 * cam kết và dải 3 bước.
 *
 * `id` của từng điểm cam kết / từng bước KHÔNG sửa được vì nó khớp với icon và
 * với khóa dịch tiếng Anh — đổi id là mất icon và mất bản dịch. Thêm mục mới thì
 * đặt id mới, giao diện sẽ bỏ qua mục không khớp thay vì vỡ.
 */
export function HomeContentEditor() {
  const t = useTranslations('admin')

  return (
    <DocumentEditor document='home' title={t('nav.homeContent')} description={t('homeContent.description')}>
      {() => (
        <>
          <Alert type='info' showIcon title={t('homeContent.fallbackNote')} style={{ marginBottom: 20 }} />

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item name='heroTitleLead' label={t('homeContent.titleLead')}>
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name='heroTitleAccent'
                label={t('homeContent.titleAccent')}
                tooltip={t('homeContent.titleAccentHint')}
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name='heroSubtitle' label={t('homeContent.subtitle')}>
            <Input.TextArea autoSize={{ minRows: 2, maxRows: 4 }} />
          </Form.Item>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item name='heroPrimaryCta' label={t('homeContent.primaryCta')}>
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name='heroSecondaryCta' label={t('homeContent.secondaryCta')}>
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Divider titlePlacement='start'>{t('homeContent.promises')}</Divider>
          <Form.List name='promises'>
            {(fields, { add, remove }) => (
              <Space orientation='vertical' size={10} style={{ width: '100%' }}>
                {fields.map((field) => (
                  <Row key={field.key} gutter={8} align='middle'>
                    <Col xs={24} md={5}>
                      <Form.Item name={[field.name, 'id']} style={{ marginBottom: 8 }}>
                        <Input placeholder='id' disabled />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={8}>
                      <Form.Item name={[field.name, 'title']} style={{ marginBottom: 8 }}>
                        <Input placeholder={t('homeContent.promiseTitle')} />
                      </Form.Item>
                    </Col>
                    <Col xs={20} md={9}>
                      <Form.Item name={[field.name, 'hint']} style={{ marginBottom: 8 }}>
                        <Input placeholder={t('homeContent.promiseHint')} />
                      </Form.Item>
                    </Col>
                    <Col xs={4} md={2}>
                      <Button
                        type='text'
                        danger
                        icon={<DeleteOutlined />}
                        aria-label={t('actions.removeRow')}
                        onClick={() => remove(field.name)}
                      />
                    </Col>
                  </Row>
                ))}
                <Button
                  type='dashed'
                  block
                  icon={<PlusOutlined />}
                  onClick={() => add({ id: '', title: '', hint: '' })}
                >
                  {t('actions.addRow')}
                </Button>
              </Space>
            )}
          </Form.List>

          <Divider titlePlacement='start'>{t('homeContent.steps')}</Divider>
          <Text type='secondary'>{t('homeContent.stepsHint')}</Text>
          <Form.List name='steps'>
            {(fields, { add, remove }) => (
              <Space orientation='vertical' size={10} style={{ width: '100%', marginTop: 12 }}>
                {fields.map((field) => (
                  <Row key={field.key} gutter={8} align='middle'>
                    <Col xs={24} md={5}>
                      <Form.Item name={[field.name, 'id']} style={{ marginBottom: 8 }}>
                        <Input placeholder='id' disabled />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={6}>
                      <Form.Item name={[field.name, 'title']} style={{ marginBottom: 8 }}>
                        <Input placeholder={t('homeContent.stepTitle')} />
                      </Form.Item>
                    </Col>
                    <Col xs={20} md={11}>
                      <Form.Item name={[field.name, 'description']} style={{ marginBottom: 8 }}>
                        <Input placeholder={t('homeContent.stepDescription')} />
                      </Form.Item>
                    </Col>
                    <Col xs={4} md={2}>
                      <Button
                        type='text'
                        danger
                        icon={<DeleteOutlined />}
                        aria-label={t('actions.removeRow')}
                        onClick={() => remove(field.name)}
                      />
                    </Col>
                  </Row>
                ))}
                <Button
                  type='dashed'
                  block
                  icon={<PlusOutlined />}
                  onClick={() => add({ id: '', title: '', description: '' })}
                >
                  {t('actions.addRow')}
                </Button>
              </Space>
            )}
          </Form.List>
        </>
      )}
    </DocumentEditor>
  )
}
