'use client'

import { Alert, Col, Divider, Form, InputNumber, Row } from 'antd'
import { useTranslations } from 'next-intl'

import { DocumentEditor } from '../common/document-editor'

/**
 * Hạn mức miễn phí & hạn mức theo ngày.
 *
 * Cột hẹp (8/24) là cố ý: đây là TRƯỜNG SỐ. Kéo ô nhập rộng bằng nửa màn hình
 * thì nhìn như ô chữ, người dùng tưởng gõ được gì vào cũng được.
 *
 * Ba nhóm số này trước đây nằm CỨNG trong code, mỗi nhóm một chỗ: hạn mức chat ở
 * `features/chatbot/constants`, hạn mức tra Cẩm nang ở `handbook.mock`, còn lượt
 * cho người chưa mua gói thì không tồn tại ở đâu cả. Đổi một con số phải sửa code
 * rồi deploy — trong khi đây đúng là thứ vận hành muốn vặn theo tuần.
 *
 * Hạn mức của các gói TRẢ TIỀN không nằm ở đây mà ở tab "Bảng gói" bên cạnh, vì
 * mỗi gói một dòng riêng.
 */
export function QuotaEditor() {
  const t = useTranslations('admin')

  return (
    <DocumentEditor document='quotas' title={t('quotas.title')} description={t('quotas.description')}>
      {() => (
        <>
          <Alert type='info' showIcon message={t('quotas.enforcementNote')} style={{ marginBottom: 20 }} />

          <Divider titlePlacement='start'>{t('quotas.freeGroup')}</Divider>
          <Row gutter={16}>
            <Col xs={24} sm={12} md={8}>
              <Form.Item name='freeDesignCredits' label={t('quotas.freeDesignCredits')} tooltip={t('quotas.freeHint')}>
                <InputNumber min={0} max={999} style={{ width: '100%' }} addonAfter={t('quotas.unitPerPeriod')} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                name='freeLibraryCredits'
                label={t('quotas.freeLibraryCredits')}
                tooltip={t('quotas.freeHint')}
              >
                <InputNumber min={0} max={9999} style={{ width: '100%' }} addonAfter={t('quotas.unitPerPeriod')} />
              </Form.Item>
            </Col>
          </Row>

          <Divider titlePlacement='start'>{t('quotas.chatGroup')}</Divider>
          <Row gutter={16}>
            <Col xs={24} sm={12} md={8}>
              <Form.Item name='chatDailyGuest' label={t('quotas.chatDailyGuest')}>
                <InputNumber min={0} max={999} style={{ width: '100%' }} addonAfter={t('quotas.unitPerDay')} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item name='chatDailyCustomer' label={t('quotas.chatDailyCustomer')}>
                <InputNumber min={0} max={999} style={{ width: '100%' }} addonAfter={t('quotas.unitPerDay')} />
              </Form.Item>
            </Col>
          </Row>

          <Divider titlePlacement='start'>{t('quotas.handbookGroup')}</Divider>
          <Row gutter={16}>
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                name='handbookLookupPerDay'
                label={t('quotas.handbookLookupPerDay')}
                tooltip={t('quotas.handbookLookupHint')}
              >
                <InputNumber min={0} max={999} style={{ width: '100%' }} addonAfter={t('quotas.unitPerDay')} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                name='handbookDetailPerDay'
                label={t('quotas.handbookDetailPerDay')}
                tooltip={t('quotas.handbookDetailHint')}
              >
                <InputNumber min={0} max={999} style={{ width: '100%' }} addonAfter={t('quotas.unitPerDay')} />
              </Form.Item>
            </Col>
          </Row>
        </>
      )}
    </DocumentEditor>
  )
}
