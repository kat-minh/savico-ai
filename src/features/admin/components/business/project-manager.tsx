'use client'

import { Col, Form, Input, InputNumber, Row, Select, Tag, Typography } from 'antd'
import { useLocale, useTranslations } from 'next-intl'

import type { Locale } from '@/i18n/routing'
import type { CmsProjectStatus } from '@/shared/cms'
import { formatCurrency } from '@/shared/utils'
import { ResourceManager } from '../common/resource-manager'

const { Text } = Typography

const STATUSES: CmsProjectStatus[] = ['input', 'designing', 'review', 'completed']

const STATUS_COLOR: Record<CmsProjectStatus, string> = {
  input: 'default',
  designing: 'blue',
  review: 'gold',
  completed: 'green'
}

/**
 * Dự án khách hàng — theo dõi luồng 3 bước (mục III) từ phía vận hành.
 *
 * Đây là dữ liệu backend sinh ra, không phải nội dung site: admin chỉ đổi trạng
 * thái (ví dụ duyệt xong hồ sơ thì chuyển "Hoàn tất") chứ không tạo dự án hộ
 * khách, nên màn này không có nút Thêm mới.
 */
export function ProjectManager() {
  const t = useTranslations('admin')
  const locale = useLocale() as Locale

  return (
    <ResourceManager
      collection='designProjects'
      title={t('nav.projects')}
      description={t('projects.description')}
      allowDelete={false}
      searchText={(item) => `${item.id} ${item.name} ${item.customerName} ${item.address}`}
      columns={[
        {
          title: t('projects.code'),
          dataIndex: 'id',
          width: 140,
          render: (id: string) => <Text code>{id}</Text>
        },
        {
          title: t('projects.name'),
          dataIndex: 'name',
          render: (_, record) => (
            <div style={{ minWidth: 0 }}>
              <Text strong ellipsis style={{ display: 'block' }}>
                {record.name}
              </Text>
              <Text type='secondary' style={{ fontSize: 12 }}>
                {record.address}
              </Text>
            </div>
          )
        },
        {
          title: t('projects.customer'),
          dataIndex: 'customerName',
          width: 180,
          render: (_, record) => (
            <div style={{ minWidth: 0 }}>
              <Text style={{ display: 'block' }}>{record.customerName}</Text>
              <Text type='secondary' style={{ fontSize: 12 }}>
                {record.customerEmail}
              </Text>
            </div>
          )
        },
        {
          title: t('projects.step'),
          dataIndex: 'currentStep',
          width: 90,
          sorter: (a, b) => a.currentStep - b.currentStep,
          render: (step: number) => t('projects.stepValue', { step })
        },
        {
          title: t('projects.status'),
          dataIndex: 'status',
          width: 130,
          filters: STATUSES.map((value) => ({ text: t(`projectStatus.${value}`), value })),
          onFilter: (value, record) => record.status === value,
          render: (status: CmsProjectStatus) => <Tag color={STATUS_COLOR[status]}>{t(`projectStatus.${status}`)}</Tag>
        },
        {
          title: t('projects.estimateTotal'),
          dataIndex: 'estimateTotal',
          width: 160,
          sorter: (a, b) => (a.estimateTotal ?? 0) - (b.estimateTotal ?? 0),
          render: (total: number | null) =>
            total === null ? <Text type='secondary'>—</Text> : <Text strong>{formatCurrency(total, locale)}</Text>
        },
        { title: t('projects.updatedAt'), dataIndex: 'updatedAt', width: 120 }
      ]}
      renderForm={() => (
        <>
          <Form.Item name='name' label={t('projects.name')}>
            <Input />
          </Form.Item>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item name='customerName' label={t('projects.customer')}>
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name='customerEmail' label={t('projects.customerEmail')}>
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name='address' label={t('projects.address')}>
            <Input />
          </Form.Item>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item name='buildingTypeLabel' label={t('projects.buildingType')}>
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name='styleLabel' label={t('projects.style')}>
                <Input />
              </Form.Item>
            </Col>
            <Col xs={12} md={8}>
              <Form.Item name='currentStep' label={t('projects.step')}>
                <Select
                  options={[1, 2, 3].map((step) => ({ label: t('projects.stepValue', { step }), value: step }))}
                />
              </Form.Item>
            </Col>
            <Col xs={12} md={8}>
              <Form.Item name='status' label={t('projects.status')}>
                <Select options={STATUSES.map((value) => ({ label: t(`projectStatus.${value}`), value }))} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name='estimateTotal' label={t('projects.estimateTotal')}>
                <InputNumber<number>
                  min={0}
                  step={1_000_000}
                  style={{ width: '100%' }}
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
                  parser={(value) => Number(`${value}`.replace(/\./g, ''))}
                  addonAfter='₫'
                />
              </Form.Item>
            </Col>
          </Row>
        </>
      )}
    />
  )
}
