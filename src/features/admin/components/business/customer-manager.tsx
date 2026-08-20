'use client'

import { Alert, Avatar, Col, Descriptions, Form, Input, InputNumber, Row, Select, Tag, Typography } from 'antd'
import { useTranslations } from 'next-intl'

import type { CmsCustomer, PlanTier } from '@/shared/cms'
import { getInitials } from '@/shared/utils'
import { ResourceManager } from '../common/resource-manager'

const { Text } = Typography

const TIERS: PlanTier[] = ['basic', 'advanced', 'pro']

/**
 * Người dùng.
 *
 * Tên, email, số điện thoại là THÔNG TIN CỦA CHÍNH NGƯỜI DÙNG — họ tự sửa ở màn
 * Tài khoản. Vận hành sửa hộ thì khách không hề hay biết, nên ở đây chỉ đọc.
 *
 * Cái vận hành thực sự nắm: vai trò, gói và hạn gói, số lượt còn lại, và khóa /
 * mở tài khoản. Không tạo tài khoản hộ và không xóa — đó là việc của backend
 * .NET, có ghi vết.
 *
 * Vai trò `admin` mở toàn bộ khu quản trị nên đổi vai trò là thao tác nhạy cảm —
 * form để riêng một ô chứ không nhét chung dòng gói cước.
 */
/** Hạn gói đã qua chưa. Bỏ trống = chưa mua gói, không tính là hết hạn. */
function isExpired(planExpiresAt: string | undefined): boolean {
  if (!planExpiresAt) return false
  return new Date(planExpiresAt).getTime() < Date.now()
}

export function CustomerManager() {
  const t = useTranslations('admin')

  return (
    <ResourceManager
      collection='customers'
      title={t('nav.customers')}
      description={t('customers.description')}
      // Không tạo và không xóa tài khoản từ đây: người dùng tự đăng ký, còn xóa
      // là chuyện dữ liệu cá nhân — backend .NET làm, có ghi vết. Khóa tài khoản
      // thì đã có ô "Trạng thái" bên dưới.
      allowDelete={false}
      searchText={(item) => `${item.name} ${item.email} ${item.phone ?? ''}`}
      columns={[
        {
          title: t('customers.name'),
          dataIndex: 'name',
          render: (_, record) => (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
              <Avatar size={34}>{getInitials(record.name)}</Avatar>
              <div style={{ minWidth: 0 }}>
                <Text strong style={{ display: 'block' }}>
                  {record.name}
                </Text>
                <Text type='secondary' style={{ fontSize: 12 }}>
                  {record.email}
                </Text>
              </div>
            </div>
          )
        },
        {
          title: t('customers.phone'),
          dataIndex: 'phone',
          width: 130,
          render: (phone: string | undefined) => phone || <Text type='secondary'>—</Text>
        },
        {
          title: t('customers.role'),
          dataIndex: 'role',
          width: 110,
          filters: [
            { text: t('customers.roleCustomer'), value: 'customer' },
            { text: t('customers.roleAdmin'), value: 'admin' }
          ],
          onFilter: (value, record) => record.role === value,
          render: (role: CmsCustomer['role']) => (
            <Tag color={role === 'admin' ? 'purple' : 'default'}>
              {role === 'admin' ? t('customers.roleAdmin') : t('customers.roleCustomer')}
            </Tag>
          )
        },
        {
          title: t('customers.plan'),
          dataIndex: 'planTier',
          width: 160,
          render: (tier: PlanTier | null, record) =>
            tier ? (
              <div>
                <Tag color='green'>{t(`planTier.${tier}`)}</Tag>
                {/* Gói hết hạn mà vẫn hiện ngày trơn thì phải tự nhẩm lịch mới
                    biết — tô đỏ để lướt bảng là thấy ngay ai cần nhắc gia hạn. */}
                <Text type={isExpired(record.planExpiresAt) ? 'danger' : 'secondary'} style={{ fontSize: 12 }}>
                  {record.planExpiresAt}
                  {isExpired(record.planExpiresAt) ? ` · ${t('customers.planExpired')}` : ''}
                </Text>
              </div>
            ) : (
              <Tag>{t('planTier.none')}</Tag>
            )
        },
        {
          title: t('customers.creditsColumn'),
          dataIndex: 'designCreditsLeft',
          width: 150,
          sorter: (a, b) => a.designCreditsLeft - b.designCreditsLeft,
          render: (_, record) => (
            <div style={{ minWidth: 0 }}>
              <Text style={{ display: 'block' }}>
                {t('customers.credits')}: <Text strong>{record.designCreditsLeft}</Text>
              </Text>
              <Text type='secondary' style={{ fontSize: 12 }}>
                {t('customers.libraryCredits')}: {record.libraryCreditsLeft}
              </Text>
            </div>
          )
        },
        {
          title: t('customers.status'),
          dataIndex: 'status',
          width: 120,
          render: (status: CmsCustomer['status']) => (
            <Tag color={status === 'active' ? 'green' : 'red'}>{t(`customerStatus.${status}`)}</Tag>
          )
        },
        { title: t('customers.createdAt'), dataIndex: 'createdAt', width: 120 }
      ]}
      renderDetail={(customer) => (
        <>
          <Alert type='info' showIcon message={t('customers.readOnlyNote')} style={{ marginBottom: 16 }} />
          <Descriptions
            size='small'
            column={1}
            bordered
            items={[
              { key: 'name', label: t('customers.name'), children: customer.name },
              { key: 'email', label: t('customers.email'), children: customer.email },
              { key: 'phone', label: t('customers.phone'), children: customer.phone || '—' },
              { key: 'createdAt', label: t('customers.createdAt'), children: customer.createdAt }
            ]}
          />
        </>
      )}
      renderForm={() => (
        <>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item name='role' label={t('customers.role')} tooltip={t('customers.roleHint')}>
                <Select
                  options={[
                    { label: t('customers.roleCustomer'), value: 'customer' },
                    { label: t('customers.roleAdmin'), value: 'admin' }
                  ]}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name='status' label={t('customers.status')} tooltip={t('customers.statusHint')}>
                <Select
                  options={(['active', 'suspended'] as const).map((value) => ({
                    label: t(`customerStatus.${value}`),
                    value
                  }))}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name='planTier' label={t('customers.plan')}>
                <Select
                  allowClear
                  placeholder={t('planTier.none')}
                  options={TIERS.map((value) => ({ label: t(`planTier.${value}`), value }))}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name='planExpiresAt' label={t('customers.planExpiresAt')}>
                <Input placeholder='2026-12-31' />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name='designCreditsLeft' label={t('customers.credits')}>
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name='libraryCreditsLeft' label={t('customers.libraryCredits')}>
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
        </>
      )}
    />
  )
}
