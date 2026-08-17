'use client'

import { Avatar, Col, Form, Input, InputNumber, Row, Select, Tag, Typography } from 'antd'
import { useTranslations } from 'next-intl'

import type { CmsCustomer, PlanTier } from '@/shared/cms'
import { getInitials } from '@/shared/utils'
import { newAdminId, todayKey } from '../../services/admin.service'
import { ResourceManager } from '../common/resource-manager'

const { Text } = Typography

const TIERS: PlanTier[] = ['basic', 'advanced', 'pro']

/**
 * Người dùng. Ở bản mock đây là bảng đọc - sửa để dựng khung; khi có API .NET
 * thì tạo tài khoản, đổi mật khẩu và khóa tài khoản đều do backend làm, màn này
 * chỉ gửi lệnh.
 *
 * Vai trò `admin` mở toàn bộ khu quản trị nên đổi vai trò là thao tác nhạy cảm —
 * form để riêng một ô chứ không nhét chung dòng gói cước.
 */
export function CustomerManager() {
  const t = useTranslations('admin')

  return (
    <ResourceManager
      collection='customers'
      title={t('nav.customers')}
      description={t('customers.description')}
      searchText={(item) => `${item.name} ${item.email} ${item.phone ?? ''}`}
      createItem={(): CmsCustomer => ({
        id: newAdminId('usr'),
        name: '',
        email: '',
        role: 'customer',
        planTier: null,
        designCreditsLeft: 1,
        status: 'active',
        createdAt: todayKey()
      })}
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
          width: 150,
          render: (tier: PlanTier | null, record) =>
            tier ? (
              <div>
                <Tag color='green'>{t(`planTier.${tier}`)}</Tag>
                <Text type='secondary' style={{ fontSize: 12 }}>
                  {record.planExpiresAt}
                </Text>
              </div>
            ) : (
              <Tag>{t('planTier.none')}</Tag>
            )
        },
        {
          title: t('customers.credits'),
          dataIndex: 'designCreditsLeft',
          width: 110,
          sorter: (a, b) => a.designCreditsLeft - b.designCreditsLeft
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
      renderForm={() => (
        <>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name='name'
                label={t('customers.name')}
                rules={[{ required: true, message: t('fields.requiredMessage') }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name='email'
                label={t('customers.email')}
                rules={[{ required: true, type: 'email', message: t('fields.emailMessage') }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name='phone' label={t('customers.phone')}>
                <Input />
              </Form.Item>
            </Col>
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
            <Col xs={12}>
              <Form.Item name='designCreditsLeft' label={t('customers.credits')}>
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={12}>
              <Form.Item name='status' label={t('customers.status')}>
                <Select
                  options={(['active', 'suspended'] as const).map((value) => ({
                    label: t(`customerStatus.${value}`),
                    value
                  }))}
                />
              </Form.Item>
            </Col>
          </Row>
        </>
      )}
      fromFormValues={(values, current) => ({
        ...current,
        ...values,
        // Select có allowClear trả `undefined`; kho dùng `null` cho "chưa mua gói".
        planTier: (values.planTier as PlanTier | undefined) ?? null
      })}
    />
  )
}
